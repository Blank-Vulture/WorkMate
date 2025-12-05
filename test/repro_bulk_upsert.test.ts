import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useShiftStore } from '../src/stores/shiftStore';
import * as db from '../src/db/shifts';
import type { ShiftInput } from '../src/types';

// Mock database operations
vi.mock('../src/db/shifts', () => ({
    createShift: vi.fn(),
    updateShift: vi.fn(),
    getShiftsByMonth: vi.fn(),
    getShiftsByYear: vi.fn(),
}));

describe('Bulk Upsert Verification', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useShiftStore.setState({
            shifts: [],
            selectedMonth: { year: 2026, month: 1 },
            isLoading: false,
            error: null
        });
    });

    it('should handle bulk upsert with single reload', async () => {
        const inputs = [
            { type: 'create' as const, data: { date: '2026-01-01', startTime: '09:00', endTime: '18:00', breakMinutes: 60 } },
            { type: 'create' as const, data: { date: '2026-01-02', startTime: '09:00', endTime: '18:00', breakMinutes: 60 } },
            { type: 'update' as const, id: 'existing-id', data: { date: '2026-01-03', startTime: '09:00', endTime: '18:00', breakMinutes: 60 } },
        ];

        (db.getShiftsByMonth as any).mockResolvedValue([]);

        await useShiftStore.getState().bulkUpsertShifts(inputs);

        // Verify DB operations
        expect(db.createShift).toHaveBeenCalledTimes(2);
        expect(db.updateShift).toHaveBeenCalledTimes(1);

        // Verify reload called only ONCE
        // loadShifts calls getShiftsByMonth
        expect(db.getShiftsByMonth).toHaveBeenCalledTimes(1);
        expect(db.getShiftsByMonth).toHaveBeenCalledWith(2026, 1);
    });
});
