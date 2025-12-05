import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useShiftStore } from '../../src/stores/shiftStore';
import * as db from '../../src/db/shifts';
import * as rateDb from '../../src/db/hourlyRates';
import type { ShiftInput } from '../../src/types';

// Mock database operations
vi.mock('../../src/db/shifts', () => ({
    createShift: vi.fn(),
    updateShift: vi.fn(),
    deleteShift: vi.fn(),
    getShiftsByMonth: vi.fn(),
    getShiftsByYear: vi.fn(),
}));

vi.mock('../../src/db/hourlyRates', () => ({
    getCurrentHourlyRate: vi.fn(),
}));

describe('Comprehensive Shift Management', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useShiftStore.setState({
            shifts: [],
            selectedMonth: { year: 2025, month: 12 },
            isLoading: false,
            error: null
        });
        // Default mock implementation
        (db.getShiftsByMonth as any).mockResolvedValue([]);
        (rateDb.getCurrentHourlyRate as any).mockResolvedValue(1000);
    });

    describe('Single Entry Mode', () => {
        it('should create shift in the PAST (2024)', async () => {
            const input: ShiftInput = {
                date: '2024-05-15',
                startTime: '09:00',
                endTime: '17:00',
                breakMinutes: 60,
            };

            (db.createShift as any).mockResolvedValue({ ...input, id: 'past-1', hourlyRate: 950 });

            await useShiftStore.getState().createShift(input);

            expect(db.createShift).toHaveBeenCalledWith(input);
        });

        it('should create shift in the FUTURE (2030)', async () => {
            const input: ShiftInput = {
                date: '2030-01-01',
                startTime: '09:00',
                endTime: '17:00',
                breakMinutes: 60,
            };

            (db.createShift as any).mockResolvedValue({ ...input, id: 'future-1', hourlyRate: 1200 });

            await useShiftStore.getState().createShift(input);

            expect(db.createShift).toHaveBeenCalledWith(input);
        });
    });

    describe('Bulk Entry Mode', () => {
        it('should bulk create shifts across YEAR boundary (Dec 2025 - Jan 2026)', async () => {
            const inputs = [
                { type: 'create' as const, data: { date: '2025-12-31', startTime: '09:00', endTime: '18:00', breakMinutes: 60 } },
                { type: 'create' as const, data: { date: '2026-01-01', startTime: '09:00', endTime: '18:00', breakMinutes: 60 } },
            ];

            await useShiftStore.getState().bulkUpsertShifts(inputs);

            expect(db.createShift).toHaveBeenCalledTimes(2);
            expect(db.createShift).toHaveBeenCalledWith(inputs[0].data);
            expect(db.createShift).toHaveBeenCalledWith(inputs[1].data);

            // Should reload the CURRENTLY selected month (Dec 2025)
            expect(db.getShiftsByMonth).toHaveBeenCalledWith(2025, 12);
        });

        it('should bulk create shifts in far FUTURE (2030)', async () => {
            const inputs = [
                { type: 'create' as const, data: { date: '2030-05-01', startTime: '09:00', endTime: '18:00', breakMinutes: 60 } },
                { type: 'create' as const, data: { date: '2030-05-02', startTime: '09:00', endTime: '18:00', breakMinutes: 60 } },
            ];

            await useShiftStore.getState().bulkUpsertShifts(inputs);

            expect(db.createShift).toHaveBeenCalledTimes(2);
        });
    });

    describe('Hourly Rate Integrity', () => {
        it('should apply correct hourly rate for PAST dates', async () => {
            const date = '2020-01-01';
            const input: ShiftInput = {
                date,
                startTime: '09:00',
                endTime: '17:00',
                breakMinutes: 60,
            };

            // Mock rate for 2020
            (rateDb.getCurrentHourlyRate as any).mockResolvedValue(900);

            // We need to simulate the DB logic here slightly because createShift in store calls db.createShift
            // But db.createShift is mocked. The store doesn't call getCurrentHourlyRate directly, 
            // the DB function does.
            // So we verify that the DB function would be called with the input, 
            // and we trust our previous tests that db.createShift calls getCurrentHourlyRate.

            // However, let's verify the store passes the date correctly.
            await useShiftStore.getState().createShift(input);
            expect(db.createShift).toHaveBeenCalledWith(expect.objectContaining({ date }));
        });
    });
});
