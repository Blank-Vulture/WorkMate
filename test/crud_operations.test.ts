import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createShift, updateShift, deleteShift, getShiftById } from '../src/db/shifts';
import { createTask, updateTask, deleteTask, getTaskById } from '../src/db/tasks';
import { createTaskActivity, getActivitiesByTaskId } from '../src/db/taskActivities';
import { createHourlyRate, updateHourlyRate } from '../src/db/hourlyRates';

// Mock database
const mocks = vi.hoisted(() => ({
    runAsync: vi.fn(),
    getFirstAsync: vi.fn(),
    getAllAsync: vi.fn(),
}));

vi.mock('../src/db/database', () => ({
    getDatabase: vi.fn().mockResolvedValue({
        runAsync: mocks.runAsync,
        getFirstAsync: mocks.getFirstAsync,
        getAllAsync: mocks.getAllAsync,
    }),
}));

// Mock expo-crypto
vi.mock('expo-crypto', () => ({
    randomUUID: vi.fn().mockReturnValue('mock-uuid-1234'),
}));

describe('CRUD Operations', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.runAsync.mockResolvedValue({ changes: 1 });
        // Default mock for rate queries
        mocks.getFirstAsync.mockResolvedValue({ rate: 1000 });
    });

    describe('Shifts', () => {
        it('should create a shift', async () => {
            const input = {
                date: '2025-01-01',
                startTime: '09:00',
                endTime: '17:00',
                breakMinutes: 60,
            };

            const shift = await createShift(input);

            expect(shift.id).toBe('mock-uuid-1234');
            expect(shift.date).toBe(input.date);
            expect(mocks.runAsync).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO shifts'),
                expect.any(Array)
            );
        });

        it('should read a shift', async () => {
            mocks.getFirstAsync.mockResolvedValue({
                id: 'mock-uuid-1234',
                date: '2025-01-01',
                start_time: '09:00',
                end_time: '17:00',
                break_minutes: 60,
                hourly_rate: 1000,
                note: null,
                created_at: '2025-01-01T00:00:00Z',
                updated_at: '2025-01-01T00:00:00Z',
            });

            const shift = await getShiftById('mock-uuid-1234');

            expect(shift).toBeDefined();
            expect(shift?.id).toBe('mock-uuid-1234');
            expect(mocks.getFirstAsync).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM shifts'),
                ['mock-uuid-1234']
            );
        });

        it('should update a shift', async () => {
            // Mock existing shift for the update check
            mocks.getFirstAsync.mockResolvedValueOnce({
                id: 'mock-uuid-1234',
                date: '2025-01-01',
                start_time: '09:00',
                end_time: '17:00',
                break_minutes: 60,
                hourly_rate: 1000,
                note: null,
                created_at: '2025-01-01T00:00:00Z',
                updated_at: '2025-01-01T00:00:00Z',
            });

            const updated = await updateShift('mock-uuid-1234', { breakMinutes: 45 });

            expect(updated?.breakMinutes).toBe(45);
            expect(mocks.runAsync).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE shifts'),
                expect.any(Array)
            );
        });

        it('should delete a shift', async () => {
            const result = await deleteShift('mock-uuid-1234');

            expect(result).toBe(true);
            expect(mocks.runAsync).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM shifts'),
                ['mock-uuid-1234']
            );
        });
    });

    describe('Tasks', () => {
        it('should create a task', async () => {
            const input = {
                title: 'Test Task',
                status: 'todo' as const,
                priority: 'medium' as const,
            };

            const task = await createTask(input);

            expect(task.id).toBe('mock-uuid-1234');
            expect(task.title).toBe(input.title);
            expect(mocks.runAsync).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO tasks'),
                expect.any(Array)
            );
        });

        it('should read a task', async () => {
            mocks.getFirstAsync.mockResolvedValue({
                id: 'mock-uuid-1234',
                title: 'Test Task',
                description: null,
                status: 'todo',
                priority: 'medium',
                due_date: null,
                created_at: '2025-01-01T00:00:00Z',
                updated_at: '2025-01-01T00:00:00Z',
                completed_at: null,
            });

            const task = await getTaskById('mock-uuid-1234');

            expect(task).toBeDefined();
            expect(task?.id).toBe('mock-uuid-1234');
            expect(mocks.getFirstAsync).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM tasks'),
                ['mock-uuid-1234']
            );
        });

        it('should update a task', async () => {
            mocks.getFirstAsync.mockResolvedValueOnce({
                id: 'mock-uuid-1234',
                title: 'Test Task',
                description: null,
                status: 'todo',
                priority: 'medium',
                due_date: null,
                created_at: '2025-01-01T00:00:00Z',
                updated_at: '2025-01-01T00:00:00Z',
                completed_at: null,
            });

            const updated = await updateTask('mock-uuid-1234', { status: 'in_progress' });

            expect(updated?.status).toBe('in_progress');
            expect(mocks.runAsync).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE tasks'),
                expect.any(Array)
            );
        });

        it('should delete a task', async () => {
            const result = await deleteTask('mock-uuid-1234');

            expect(result).toBe(true);
            expect(mocks.runAsync).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM tasks'),
                ['mock-uuid-1234']
            );
        });
    });

    describe('TaskActivities', () => {
        it('should create a task activity', async () => {
            const input = {
                taskId: 'mock-task-id',
                type: 'status_change' as const,
                content: 'Status changed to in_progress',
                previousValue: 'todo',
                newValue: 'in_progress',
            };

            const activity = await createTaskActivity(input);

            expect(activity.id).toBe('mock-uuid-1234');
            expect(activity.content).toBe(input.content);
            expect(mocks.runAsync).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO task_activities'),
                expect.any(Array)
            );
        });
    });

    describe('Salary Sync', () => {
        it('should update shift hourly rate when rate history changes', async () => {
            // 1. Setup mocks for this specific test
            mocks.getFirstAsync.mockResolvedValue({ rate: 1200 }); // New rate

            // 2. Call updateHourlyRate (which should trigger shift updates)
            await updateHourlyRate('rate-id', { rate: 1200 });

            // 3. Verify that a SQL update was executed on the shifts table
            expect(mocks.runAsync).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE shifts')
            );
            expect(mocks.runAsync).toHaveBeenCalledWith(
                expect.stringContaining('SET hourly_rate')
            );
        });
    });
});
