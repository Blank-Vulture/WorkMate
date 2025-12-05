import { describe, it, expect, vi } from 'vitest';
import { calculateYearlyStats } from '../src/utils/tax';
import { calculateMonthlyIncome } from '../src/utils/salary';
import type { Shift, Settings } from '../src/types';

describe('Jan 2026 Bug Reproduction', () => {
    const settings: Settings = {
        id: 1,
        defaultBreakRules: [],
        transportationCost: 0,
        nightShiftMultiplier: 1.25,
        nightShiftStart: '22:00',
        nightShiftEnd: '05:00',
        standardShiftStart: '09:00',
        standardShiftEnd: '18:00',
        standardShiftBreak: 60,
    };

    it('should handle shifts in Jan 2026 without freezing', () => {
        const shift2026: Shift = {
            id: '1',
            date: '2026-01-15',
            startTime: '09:00',
            endTime: '18:00',
            breakMinutes: 60,
            hourlyRate: 1000,
            note: null,
            createdAt: '2025-12-05T00:00:00Z',
            updatedAt: '2025-12-05T00:00:00Z',
        };

        // Calculate monthly income for Jan 2026
        const monthlyIncome = calculateMonthlyIncome([shift2026], settings, 2026, 1);
        expect(monthlyIncome.grossIncome).toBe(8000);

        // Calculate yearly stats for 2026
        // Assuming we are in 2025, but looking at 2026 stats?
        // Or if we are "in" Jan 2026?
        const yearlyStats = calculateYearlyStats([monthlyIncome], 1);
        expect(yearlyStats.totalGrossIncome).toBe(8000);
    });

    it('should handle year transition correctly', () => {
        // Simulate a scenario where we have shifts in Dec 2025 and Jan 2026
        const shiftDec2025: Shift = {
            id: '2',
            date: '2025-12-31',
            startTime: '09:00',
            endTime: '18:00',
            breakMinutes: 60,
            hourlyRate: 1000,
            note: null,
            createdAt: '2025-12-05T00:00:00Z',
            updatedAt: '2025-12-05T00:00:00Z',
        };

        const shiftJan2026: Shift = {
            id: '3',
            date: '2026-01-01',
            startTime: '09:00',
            endTime: '18:00',
            breakMinutes: 60,
            hourlyRate: 1000,
            note: null,
            createdAt: '2025-12-05T00:00:00Z',
            updatedAt: '2025-12-05T00:00:00Z',
        };

        const incomeDec = calculateMonthlyIncome([shiftDec2025], settings, 2025, 12);
        const incomeJan = calculateMonthlyIncome([shiftJan2026], settings, 2026, 1);

        // Verify 2025 stats
        const stats2025 = calculateYearlyStats([incomeDec], 12);
        expect(stats2025.totalGrossIncome).toBe(8000);

        // Verify 2026 stats
        const stats2026 = calculateYearlyStats([incomeJan], 1);
        expect(stats2026.totalGrossIncome).toBe(8000);
    });
});
