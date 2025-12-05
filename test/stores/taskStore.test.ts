import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTaskStore } from '../../src/stores/taskStore';
import * as db from '../../src/db';

// Mock database module
vi.mock('../../src/db', () => ({
    getAllTasks: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    getActivitiesByTaskId: vi.fn(),
    addComment: vi.fn(),
}));

describe('TaskStore', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useTaskStore.setState({
            tasks: [],
            filter: {},
            isLoading: false,
            error: null,
        });
    });

    describe('loadTasks', () => {
        it('should load tasks successfully', async () => {
            const mockTasks = [{ id: 't1', title: 'Task 1' }];
            vi.mocked(db.getAllTasks).mockResolvedValue(mockTasks as any);

            await useTaskStore.getState().loadTasks();

            const state = useTaskStore.getState();
            expect(state.tasks).toEqual(mockTasks);
            expect(state.isLoading).toBe(false);
        });
    });

    describe('createTask', () => {
        it('should create task and reload', async () => {
            const newTask = { id: 't1', title: 'New Task' };
            vi.mocked(db.createTask).mockResolvedValue(newTask as any);
            vi.mocked(db.getAllTasks).mockResolvedValue([newTask] as any);

            await useTaskStore.getState().createTask({ title: 'New Task' } as any);

            expect(db.createTask).toHaveBeenCalled();
            expect(db.getAllTasks).toHaveBeenCalled();
        });
    });

    describe('updateTask', () => {
        it('should update task and reload', async () => {
            const updatedTask = { id: 't1', title: 'Updated Task' };
            vi.mocked(db.updateTask).mockResolvedValue(updatedTask as any);

            await useTaskStore.getState().updateTask('t1', { title: 'Updated Task' });

            expect(db.updateTask).toHaveBeenCalled();
            expect(db.getAllTasks).toHaveBeenCalled();
        });
    });

    describe('deleteTask', () => {
        it('should delete task and reload', async () => {
            vi.mocked(db.deleteTask).mockResolvedValue(true);

            await useTaskStore.getState().deleteTask('t1');

            expect(db.deleteTask).toHaveBeenCalled();
            expect(db.getAllTasks).toHaveBeenCalled();
        });
    });
});
