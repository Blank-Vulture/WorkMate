import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportData, importData } from '../../src/utils/backup';

// Mock database
const mocks = vi.hoisted(() => ({
    runAsync: vi.fn(),
    getFirstAsync: vi.fn(),
    getAllAsync: vi.fn(),
    execAsync: vi.fn(),
}));

vi.mock('../../src/db', () => ({
    getDatabase: vi.fn().mockResolvedValue({
        runAsync: mocks.runAsync,
        getFirstAsync: mocks.getFirstAsync,
        getAllAsync: mocks.getAllAsync,
        execAsync: mocks.execAsync,
    }),
}));

// Mock expo-file-system and expo-sharing
vi.mock('expo-file-system', () => ({
    Paths: { cache: '/cache' },
    File: vi.fn(),
}));

vi.mock('expo-sharing', () => ({
    isAvailableAsync: vi.fn().mockResolvedValue(true),
    shareAsync: vi.fn(),
}));

describe('Backup Utils', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('exportData', () => {
        it('should export all data', async () => {
            mocks.getAllAsync.mockResolvedValue([]);
            mocks.getFirstAsync.mockResolvedValue({});

            const data = await exportData();

            expect(data.version).toBe(1);
            expect(data.shifts).toEqual([]);
            expect(data.hourlyRates).toEqual([]);
            expect(mocks.getAllAsync).toHaveBeenCalledTimes(4); // shifts, rates, tasks, activities
            expect(mocks.getFirstAsync).toHaveBeenCalledTimes(1); // settings
        });
    });

    describe('importData', () => {
        it('should fail if version is mismatch', async () => {
            const result = await importData({ version: 999 } as any);
            expect(result.success).toBe(false);
            expect(result.error).toContain('未対応のバックアップバージョン');
        });

        it('should import data successfully', async () => {
            const backupData = {
                version: 1,
                exportedAt: '2025-01-01',
                shifts: [{ id: 's1', date: '2025-01-01' }],
                hourlyRates: [],
                tasks: [],
                taskActivities: [],
                settings: { transportation_cost: 1000 },
            };

            const result = await importData(backupData as any);

            expect(result.success).toBe(true);
            expect(mocks.execAsync).toHaveBeenCalledWith('BEGIN TRANSACTION;');
            expect(mocks.execAsync).toHaveBeenCalledWith('COMMIT;');
            // Check if insert was called for shift
            expect(mocks.runAsync).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO shifts'),
                expect.any(Array)
            );
        });

        it('should rollback on error', async () => {
            mocks.runAsync.mockRejectedValue(new Error('DB Error'));

            const backupData = {
                version: 1,
                exportedAt: '2025-01-01',
                shifts: [{ id: 's1' }],
                hourlyRates: [],
                tasks: [],
                taskActivities: [],
                settings: {},
            };

            const result = await importData(backupData as any);

            expect(result.success).toBe(false);
            expect(mocks.execAsync).toHaveBeenCalledWith('ROLLBACK;');
        });
    });
});
