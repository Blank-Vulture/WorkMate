import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationService } from '../../src/services/notification';
import * as Notifications from 'expo-notifications';

// Mock expo-notifications
vi.mock('expo-notifications', () => ({
    getPermissionsAsync: vi.fn(),
    requestPermissionsAsync: vi.fn(),
    scheduleNotificationAsync: vi.fn(),
    cancelScheduledNotificationAsync: vi.fn(),
    cancelAllScheduledNotificationsAsync: vi.fn(),
}));

describe('NotificationService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('requestPermissions', () => {
        it('should return true if already granted', async () => {
            vi.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ status: 'granted' } as any);
            const result = await NotificationService.requestPermissions();
            expect(result).toBe(true);
            expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
        });

        it('should request permissions if not granted', async () => {
            vi.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ status: 'undetermined' } as any);
            vi.mocked(Notifications.requestPermissionsAsync).mockResolvedValue({ status: 'granted' } as any);

            const result = await NotificationService.requestPermissions();
            expect(result).toBe(true);
            expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
        });

        it('should return false if denied', async () => {
            vi.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ status: 'undetermined' } as any);
            vi.mocked(Notifications.requestPermissionsAsync).mockResolvedValue({ status: 'denied' } as any);

            const result = await NotificationService.requestPermissions();
            expect(result).toBe(false);
        });
    });

    describe('scheduleShiftReminder', () => {
        it('should schedule notification if permission granted', async () => {
            vi.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ status: 'granted' } as any);
            vi.mocked(Notifications.scheduleNotificationAsync).mockResolvedValue('notification-id');

            // Future date
            const futureDate = new Date();
            futureDate.setHours(futureDate.getHours() + 2);
            const dateStr = futureDate.toISOString().split('T')[0];
            const timeStr = futureDate.toTimeString().slice(0, 5);

            const id = await NotificationService.scheduleShiftReminder('s1', dateStr, timeStr);

            expect(id).toBe('notification-id');
            expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
                expect.objectContaining({
                    content: expect.objectContaining({
                        title: 'シフトのリマインダー',
                    }),
                })
            );
        });

        it('should not schedule if permission denied', async () => {
            vi.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ status: 'denied' } as any);
            vi.mocked(Notifications.requestPermissionsAsync).mockResolvedValue({ status: 'denied' } as any);

            const id = await NotificationService.scheduleShiftReminder('s1', '2025-01-01', '09:00');

            expect(id).toBeNull();
            expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
        });

        it('should not schedule if time is in past', async () => {
            vi.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ status: 'granted' } as any);

            // Past date
            const id = await NotificationService.scheduleShiftReminder('s1', '2000-01-01', '09:00');

            expect(id).toBeNull();
            expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
        });
    });

    describe('cancelNotification', () => {
        it('should cancel notification', async () => {
            await NotificationService.cancelNotification('id-1');
            expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('id-1');
        });
    });
});
