import { describe, it, expect } from 'vitest';
import {
    timeToMinutes,
    calculateWorkingHours,
    calculateNightHours,
    calculateAutoBreak,
    calculateShiftIncome,
    calculateMonthlyIncome,
} from '../../src/utils/salary';
import type { Shift, Settings } from '../../src/types';

describe('Salary Utils', () => {
    describe('timeToMinutes', () => {
        it('should convert HH:mm to minutes', () => {
            expect(timeToMinutes('09:00')).toBe(540);
            expect(timeToMinutes('17:30')).toBe(1050);
            expect(timeToMinutes('00:00')).toBe(0);
            expect(timeToMinutes('23:59')).toBe(1439);
        });
    });

    describe('calculateWorkingHours', () => {
        it('should calculate hours for normal shift', () => {
            expect(calculateWorkingHours('09:00', '17:00', 60)).toBe(7);
            expect(calculateWorkingHours('09:00', '18:00', 60)).toBe(8);
        });

        it('should calculate hours for overnight shift', () => {
            // 22:00 to 05:00 is 7 hours
            expect(calculateWorkingHours('22:00', '05:00', 0)).toBe(7);
            // 22:00 to 05:00 with 60 min break is 6 hours
            expect(calculateWorkingHours('22:00', '05:00', 60)).toBe(6);
        });

        it('should handle zero or negative result', () => {
            expect(calculateWorkingHours('09:00', '09:00', 0)).toBe(0);
            expect(calculateWorkingHours('09:00', '08:00', 0)).toBe(23); // 09:00 to 08:00 next day
            expect(calculateWorkingHours('09:00', '09:30', 60)).toBe(0); // Break longer than work
        });
    });

    describe('calculateNightHours', () => {
        // Default night shift: 22:00 - 05:00

        it('should return 0 for day shift', () => {
            expect(calculateNightHours('09:00', '17:00', 60)).toBe(0);
        });

        it('should calculate night hours for full night shift', () => {
            // 22:00 - 05:00 = 7 hours
            expect(calculateNightHours('22:00', '05:00', 0)).toBe(7);
        });

        it('should calculate partial night hours (evening)', () => {
            // 18:00 - 23:00 (5 hours total). Night: 22:00-23:00 (1 hour)
            expect(calculateNightHours('18:00', '23:00', 0)).toBe(1);
        });

        it('should calculate partial night hours (morning)', () => {
            // 04:00 - 09:00 (5 hours total). Night: 04:00-05:00 (1 hour)
            expect(calculateNightHours('04:00', '09:00', 0)).toBe(1);
        });

        it('should handle overnight shift crossing midnight', () => {
            // 20:00 - 02:00 (6 hours total). Night: 22:00-02:00 (4 hours)
            expect(calculateNightHours('20:00', '02:00', 0)).toBe(4);
        });

        it('should reduce night hours proportionally by break', () => {
            // 22:00 - 05:00 (7 hours total). Break 60 min (1/7 of time).
            // Night hours should be 7 - 1 = 6.
            expect(calculateNightHours('22:00', '05:00', 60)).toBeCloseTo(6);
        });

        it('should handle complex overlap with break', () => {
            // 18:00 - 24:00 (6 hours). Night 22:00-24:00 (2 hours).
            // Break 60 min (1 hour). Ratio = 1/6.
            // Night hours = 2 * (1 - 1/6) = 2 * 5/6 = 1.666...
            expect(calculateNightHours('18:00', '24:00', 60)).toBeCloseTo(1.6666666666666667);
        });
    });

    describe('calculateAutoBreak', () => {
        const rules = [
            { id: '1', minHours: 6, breakMinutes: 45 },
            { id: '2', minHours: 8, breakMinutes: 60 },
        ];

        it('should return correct break for hours >= 8', () => {
            // 09:00 - 18:00 = 9 hours
            expect(calculateAutoBreak('09:00', '18:00', rules)).toBe(60);
        });

        it('should return correct break for 6 <= hours < 8', () => {
            // 09:00 - 16:00 = 7 hours
            expect(calculateAutoBreak('09:00', '16:00', rules)).toBe(45);
        });

        it('should return 0 for hours < 6', () => {
            // 09:00 - 14:00 = 5 hours
            expect(calculateAutoBreak('09:00', '14:00', rules)).toBe(0);
        });
    });

    describe('calculateShiftIncome', () => {
        const settings: Settings = {
            id: 1,
            defaultBreakRules: [],
            transportationCost: 1000,
            nightShiftMultiplier: 1.25,
            nightShiftStart: '22:00',
            nightShiftEnd: '05:00',
            standardShiftStart: '09:00',
            standardShiftEnd: '18:00',
            standardShiftBreak: 60,
        };

        const shift: Shift = {
            id: '1',
            date: '2025-01-01',
            startTime: '09:00',
            endTime: '17:00',
            breakMinutes: 60,
            hourlyRate: 1000,
            note: null,
            createdAt: '',
            updatedAt: '',
        };

        it('should calculate regular income correctly', () => {
            // 7 hours work * 1000
            const result = calculateShiftIncome(shift, settings);
            expect(result.total).toBe(7000);
            expect(result.hours).toBe(7);
            expect(result.nightHours).toBe(0);
        });

        it('should calculate night shift income correctly', () => {
            const nightShift: Shift = {
                ...shift,
                startTime: '22:00',
                endTime: '05:00',
                breakMinutes: 0,
            };
            // 7 hours * 1000 * 1.25
            const result = calculateShiftIncome(nightShift, settings);
            expect(result.total).toBe(8750);
            expect(result.hours).toBe(7);
            expect(result.nightHours).toBe(7);
        });
    });
});
