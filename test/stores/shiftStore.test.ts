import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useShiftStore } from '../../src/stores/shiftStore';
import * as db from '../../src/db';

// Mock database module
vi.mock('../../src/db', () => ({
    getShiftsByMonth: vi.fn(),
    getShiftsByYear: vi.fn(),
    createShift: vi.fn(),
    updateShift: vi.fn(),
    deleteShift: vi.fn(),
    getRecentShifts: vi.fn(),
}));

describe('ShiftStore', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useShiftStore.setState({
            shifts: [],
            selectedMonth: { year: 2025, month: 1 },
            isLoading: false,
            error: null,
        });
    });

    describe('loadShifts', () => {
        it('should load shifts successfully', async () => {
            const mockShifts = [{ id: 's1', date: '2025-01-01' }];
            vi.mocked(db.getShiftsByMonth).mockResolvedValue(mockShifts as any);

            await useShiftStore.getState().loadShifts(2025, 1);

            const state = useShiftStore.getState();
            expect(state.shifts).toEqual(mockShifts);
            expect(state.isLoading).toBe(false);
            expect(state.error).toBeNull();
        });

        it('should handle error', async () => {
            vi.mocked(db.getShiftsByMonth).mockRejectedValue(new Error('DB Error'));

            await useShiftStore.getState().loadShifts(2025, 1);

            const state = useShiftStore.getState();
            expect(state.shifts).toEqual([]);
            expect(state.error).toBe('DB Error');
            expect(state.isLoading).toBe(false);
        });
    });

    describe('createShift', () => {
        it('should create shift and reload if in current month', async () => {
            const newShift = { id: 's1', date: '2025-01-01' };
            vi.mocked(db.createShift).mockResolvedValue(newShift as any);
            vi.mocked(db.getShiftsByMonth).mockResolvedValue([newShift] as any);

            await useShiftStore.getState().createShift({ date: '2025-01-01' } as any);

            expect(db.createShift).toHaveBeenCalled();
            expect(db.getShiftsByMonth).toHaveBeenCalledWith(2025, 1);
        });

        it('should create shift but NOT reload if in different month', async () => {
            const newShift = { id: 's1', date: '2025-02-01' };
            vi.mocked(db.createShift).mockResolvedValue(newShift as any);

            await useShiftStore.getState().createShift({ date: '2025-02-01' } as any);

            expect(db.createShift).toHaveBeenCalled();
            expect(db.getShiftsByMonth).not.toHaveBeenCalled();
        });
    });

    describe('updateShift', () => {
        it('should update shift and reload', async () => {
            const updatedShift = { id: 's1', date: '2025-01-01' };
            vi.mocked(db.updateShift).mockResolvedValue(updatedShift as any);

            await useShiftStore.getState().updateShift('s1', { note: 'updated' });

            expect(db.updateShift).toHaveBeenCalled();
            expect(db.getShiftsByMonth).toHaveBeenCalled();
        });
    });

    describe('deleteShift', () => {
        it('should delete shift and reload', async () => {
            vi.mocked(db.deleteShift).mockResolvedValue(true);

            await useShiftStore.getState().deleteShift('s1');

            expect(db.deleteShift).toHaveBeenCalled();
            expect(db.getShiftsByMonth).toHaveBeenCalled();
        });
    });
});
