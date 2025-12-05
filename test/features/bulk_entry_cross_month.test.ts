import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useShiftStore } from '../../src/stores/shiftStore';
import * as db from '../../src/db';
import type { ShiftInput } from '../../src/types';

// Mock database operations
vi.mock('../../src/db', () => ({
    createShift: vi.fn(),
    updateShift: vi.fn(),
    getShiftsByMonth: vi.fn(),
    getShiftsByYear: vi.fn(),
    deleteShift: vi.fn(),
    getRecentShifts: vi.fn(),
}));

describe('Bulk Entry Cross-Month Scenarios', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('Scenario 1: selectedMonth is Dec 2025, bulk entry dates are Jan 2026', async () => {
        // Initial state: viewing December 2025
        useShiftStore.setState({
            shifts: [],
            selectedMonth: { year: 2025, month: 12 },
            isLoading: false,
            error: null
        });

        const selectedDates = ['2026-01-05', '2026-01-06', '2026-01-07'];
        
        (db.createShift as any).mockResolvedValue({
            id: 'mock-id',
            date: '',
            startTime: '09:00',
            endTime: '18:00',
            breakMinutes: 60,
            hourlyRate: 1000,
            createdAt: '2025-12-05',
            updatedAt: '2025-12-05',
        });
        (db.getShiftsByMonth as any).mockResolvedValue([]);

        // Build operations like shifts.tsx does
        const shifts = useShiftStore.getState().shifts;
        const operations = selectedDates.map(date => {
            const existing = shifts.find(s => s.date === date);
            const input = {
                date,
                startTime: '09:00',
                endTime: '18:00',
                breakMinutes: 60,
            };
            if (existing) {
                return { type: 'update' as const, id: existing.id, data: input };
            } else {
                return { type: 'create' as const, data: input };
            }
        });

        await useShiftStore.getState().bulkUpsertShifts(operations);

        // Verify DB operations were performed
        expect(db.createShift).toHaveBeenCalledTimes(3);
        
        // FIX: Now it should reload Jan 2026, matching the input dates
        expect(db.getShiftsByMonth).toHaveBeenCalledWith(2026, 1);
        
        // Also verify selectedMonth was updated
        expect(useShiftStore.getState().selectedMonth).toEqual({ year: 2026, month: 1 });
    });

    it('Scenario 2: selectedMonth is Jan 2026, bulk entry dates are Jan 2026', async () => {
        // State: viewing January 2026
        useShiftStore.setState({
            shifts: [],
            selectedMonth: { year: 2026, month: 1 },
            isLoading: false,
            error: null
        });

        const selectedDates = ['2026-01-05', '2026-01-06', '2026-01-07'];
        
        const createdShifts = selectedDates.map((date, i) => ({
            id: `shift-${i}`,
            date,
            startTime: '09:00',
            endTime: '18:00',
            breakMinutes: 60,
            hourlyRate: 1000,
            createdAt: '2025-12-05',
            updatedAt: '2025-12-05',
        }));

        (db.createShift as any).mockImplementation(async (input: ShiftInput) => {
            const idx = selectedDates.indexOf(input.date);
            return createdShifts[idx];
        });
        (db.getShiftsByMonth as any).mockResolvedValue(createdShifts);

        const shifts = useShiftStore.getState().shifts;
        const operations = selectedDates.map(date => {
            const existing = shifts.find(s => s.date === date);
            const input = {
                date,
                startTime: '09:00',
                endTime: '18:00',
                breakMinutes: 60,
            };
            if (existing) {
                return { type: 'update' as const, id: existing.id, data: input };
            } else {
                return { type: 'create' as const, data: input };
            }
        });

        await useShiftStore.getState().bulkUpsertShifts(operations);

        // Verify DB operations
        expect(db.createShift).toHaveBeenCalledTimes(3);
        
        // This time it should reload Jan 2026
        expect(db.getShiftsByMonth).toHaveBeenCalledWith(2026, 1);
        
        // Verify state was updated
        const stateAfter = useShiftStore.getState();
        expect(stateAfter.shifts).toHaveLength(3);
    });

    it('Scenario 3: Check if the issue is with month matching in createShift', async () => {
        // State: viewing January 2026
        useShiftStore.setState({
            shifts: [],
            selectedMonth: { year: 2026, month: 1 },
            isLoading: false,
            error: null
        });

        const input: ShiftInput = {
            date: '2026-01-15',
            startTime: '09:00',
            endTime: '18:00',
            breakMinutes: 60,
        };

        (db.createShift as any).mockResolvedValue({
            id: 'new-shift',
            ...input,
            hourlyRate: 1000,
            createdAt: '2025-12-05',
            updatedAt: '2025-12-05',
        });
        (db.getShiftsByMonth as any).mockResolvedValue([]);

        // Use createShift (single)
        await useShiftStore.getState().createShift(input);

        // Check if month matching works
        // In createShift: parseInt(input.date.split('-')[1], 10) should be 1
        // And parseInt(input.date.split('-')[0], 10) should be 2026
        expect(db.getShiftsByMonth).toHaveBeenCalledWith(2026, 1);
    });

    it('Scenario 4: Verify date parsing for year 2026', () => {
        const date = '2026-01-15';
        const shiftMonth = parseInt(date.split('-')[1], 10);
        const shiftYear = parseInt(date.split('-')[0], 10);
        
        expect(shiftYear).toBe(2026);
        expect(shiftMonth).toBe(1);
    });
});
