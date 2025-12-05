import { describe, it, expect, vi } from 'vitest';
import { createShift } from '../src/db/shifts';
import { createTask } from '../src/db/tasks';

// Mock database to avoid Expo SQLite issues in test environment
vi.mock('../src/db/database', () => ({
    getDatabase: vi.fn().mockResolvedValue({
        runAsync: vi.fn(),
        getFirstAsync: vi.fn(),
        getAllAsync: vi.fn(),
    }),
}));

// Mock hourly rates
vi.mock('../src/db/hourlyRates', () => ({
    getCurrentHourlyRate: vi.fn().mockResolvedValue(1000),
}));

// Mock task activities
vi.mock('../src/db/taskActivities', () => ({
    createTaskActivity: vi.fn(),
}));

// Mock expo-crypto
vi.mock('expo-crypto', () => ({
    randomUUID: vi.fn().mockReturnValue('mock-uuid-1234'),
}));

describe('UUID Generation', () => {
    it('should generate a UUID when creating a shift', async () => {
        try {
            const shift = await createShift({
                date: '2025-01-01',
                startTime: '09:00',
                endTime: '17:00',
                breakMinutes: 60,
            });
            expect(shift.id).toBeDefined();
            expect(typeof shift.id).toBe('string');
            expect(shift.id.length).toBeGreaterThan(0);
            console.log('Shift ID generated:', shift.id);
        } catch (error) {
            console.error('Shift creation failed:', error);
            throw error;
        }
    });

    it('should generate a UUID when creating a task', async () => {
        try {
            const task = await createTask({
                title: 'Test Task',
                status: 'todo',
                priority: 'medium',
            });
            expect(task.id).toBeDefined();
            expect(typeof task.id).toBe('string');
            expect(task.id.length).toBeGreaterThan(0);
            console.log('Task ID generated:', task.id);
        } catch (error) {
            console.error('Task creation failed:', error);
            throw error;
        }
    });
});
