import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export class NotificationService {
    static async requestPermissions(): Promise<boolean> {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        return finalStatus === 'granted';
    }

    static async scheduleShiftReminder(
        shiftId: string,
        date: string,
        startTime: string,
        minutesBefore: number = 60
    ): Promise<string | null> {
        const hasPermission = await this.requestPermissions();
        if (!hasPermission) return null;

        const shiftDate = new Date(`${date}T${startTime}`);
        const triggerDate = new Date(shiftDate.getTime() - minutesBefore * 60000);

        if (triggerDate <= new Date()) return null;

        const identifier = await Notifications.scheduleNotificationAsync({
            content: {
                title: 'シフトのリマインダー',
                body: `${startTime}からシフトがあります`,
                data: { shiftId },
            },
            trigger: triggerDate as any,
        });

        return identifier;
    }

    static async cancelNotification(identifier: string): Promise<void> {
        await Notifications.cancelScheduledNotificationAsync(identifier);
    }

    static async cancelAllNotifications(): Promise<void> {
        await Notifications.cancelAllScheduledNotificationsAsync();
    }
}
