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

describe('Bulk Entry Jan 2026 Reproduction', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useShiftStore.setState({
            shifts: [],
            selectedMonth: { year: 2026, month: 1 },
            isLoading: false,
            error: null
        });
    });

    it('should handle bulk creation in Jan 2026', async () => {
        const selectedDates = ['2026-01-01', '2026-01-02', '2026-01-03'];
        const input: ShiftInput = {
            date: '', // Will be set in loop
            startTime: '09:00',
            endTime: '18:00',
            breakMinutes: 60,
        };

        // Mock successful creation
        (db.createShift as any).mockResolvedValue({
            id: 'mock-id',
            ...input,
            hourlyRate: 1000,
            createdAt: '2026-01-01',
            updatedAt: '2026-01-01',
        });

        (db.getShiftsByMonth as any).mockResolvedValue([]);

        // Simulate bulk entry loop from shifts.tsx
        for (const date of selectedDates) {
            const shiftInput = { ...input, date };
            await useShiftStore.getState().createShift(shiftInput);
        }

        expect(db.createShift).toHaveBeenCalledTimes(3);
        expect(db.createShift).toHaveBeenCalledWith(expect.objectContaining({ date: '2026-01-01' }));
        expect(db.createShift).toHaveBeenCalledWith(expect.objectContaining({ date: '2026-01-02' }));
        expect(db.createShift).toHaveBeenCalledWith(expect.objectContaining({ date: '2026-01-03' }));
    });
});
