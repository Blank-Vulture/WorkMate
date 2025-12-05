import { describe, it, expect } from 'vitest';
import {
    calculateYearlyStats,
    calculateRemainingWorkableHours,
    calculateMonthlyTarget,
    getTaxStatusMessage,
    estimateTax,
} from '../../src/utils/tax';
import { TAX_THRESHOLD } from '../../src/types';

describe('Tax Utils', () => {
    describe('calculateYearlyStats', () => {
        it('should calculate stats correctly for empty data', () => {
            const stats = calculateYearlyStats([], 1);
            expect(stats.totalGrossIncome).toBe(0);
            expect(stats.isOver103Man).toBe(false);
        });

        it('should calculate stats correctly with data', () => {
            const incomes = [
                {
                    year: 2025,
                    month: 1,
                    totalHours: 10,
                    regularHours: 10,
                    nightHours: 0,
                    grossIncome: 10000,
                    transportationCost: 0,
                    shiftCount: 1,
                },
            ];
            const stats = calculateYearlyStats(incomes, 2); // Current month is Feb
            expect(stats.totalGrossIncome).toBe(10000);
            // Average is 10000. Remaining months = 10. Projected = 10000 + 10000*10 = 110000
            expect(stats.projectedYearEndIncome).toBe(110000);
        });
    });

    describe('calculateRemainingWorkableHours', () => {
        it('should calculate remaining hours', () => {
            // Threshold 1,030,000. Current 1,000,000. Remaining 30,000.
            // Hourly rate 1000. Workable = 30 hours.
            expect(calculateRemainingWorkableHours(1000000, 1000)).toBe(30);
        });

        it('should return 0 if over threshold', () => {
            expect(calculateRemainingWorkableHours(1040000, 1000)).toBe(0);
        });
    });

    describe('calculateMonthlyTarget', () => {
        it('should calculate monthly target', () => {
            // Threshold 1,030,000. Current 0. Remaining 1,030,000.
            // Current month 1. Remaining months 12.
            // Target = 1030000 / 12 = 85833.33...
            expect(calculateMonthlyTarget(0, 1)).toBeCloseTo(85833.33);
        });
    });

    describe('getTaxStatusMessage', () => {
        it('should return danger if over 103 man', () => {
            const stats = {
                isOver103Man: true,
                totalGrossIncome: 1040000,
            } as any;
            const msg = getTaxStatusMessage(stats);
            expect(msg.status).toBe('danger');
        });

        it('should return warning if projected to exceed', () => {
            const stats = {
                isOver103Man: false,
                willExceed103Man: true,
                totalGrossIncome: 500000,
            } as any;
            const msg = getTaxStatusMessage(stats);
            expect(msg.status).toBe('warning');
        });
    });

    describe('estimateTax', () => {
        it('should return 0 if under threshold', () => {
            expect(estimateTax(1000000)).toBe(0);
        });

        it('should calculate tax if over threshold', () => {
            // 1,030,000 + 10,000 = 1,040,000
            // Taxable = 10,000. Tax 5% = 500.
            expect(estimateTax(TAX_THRESHOLD + 10000)).toBe(500);
        });
    });
});
