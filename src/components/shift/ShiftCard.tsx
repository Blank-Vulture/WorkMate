/**
 * Shift Card Component
 */

import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Text, useTheme, IconButton } from 'react-native-paper';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { Shift, Settings } from '@/types';
import { calculateShiftIncome, formatCurrency, formatHours } from '@/utils/salary';

interface ShiftCardProps {
  shift: Shift;
  settings: Settings | null;
  onPress?: () => void;
  onDelete?: () => void;
}

export function ShiftCard({ shift, settings, onPress, onDelete }: ShiftCardProps) {
  const theme = useTheme();
  const date = parseISO(shift.date);
  const dayOfWeek = format(date, 'E', { locale: ja });

  const defaultSettings: Settings = settings ?? {
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

  const income = calculateShiftIncome(shift, defaultSettings);

  return (
    <Pressable
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
      onPress={onPress}
      android_ripple={{ color: theme.colors.primaryContainer }}
    >
      <View style={styles.dateContainer}>
        <Text variant="titleLarge" style={styles.dayNumber}>
          {format(date, 'd')}
        </Text>
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {dayOfWeek}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.timeRow}>
          <Text variant="titleMedium">
            {shift.startTime} - {shift.endTime}
          </Text>
          {shift.breakMinutes > 0 && (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              （休憩{shift.breakMinutes}分）
            </Text>
          )}
        </View>
        <View style={styles.detailRow}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {formatHours(income.hours)} / {formatCurrency(income.total)}
          </Text>
        </View>
        {shift.note && (
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant }}
            numberOfLines={1}
          >
            {shift.note}
          </Text>
        )}
      </View>

      {onDelete && (
        <IconButton
          icon="delete-outline"
          size={20}
          onPress={(e) => {
            e.stopPropagation?.();
            onDelete();
          }}
          style={styles.deleteButton}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginVertical: 4,
  },
  dateContainer: {
    alignItems: 'center',
    width: 48,
    marginRight: 12,
  },
  dayNumber: {
    fontWeight: '700',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    margin: 0,
  },
});

