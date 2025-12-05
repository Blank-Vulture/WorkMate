/**
 * Shift Detail Screen
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { Text, useTheme, Button, Divider, Portal, Modal } from 'react-native-paper';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Card } from '@/components/ui';
import { ShiftForm } from '@/components/shift';
import { useShiftStore, useSettingsStore, useHourlyRateStore } from '@/stores';
import { calculateShiftIncome, formatCurrency, formatHours } from '@/utils';
import type { Shift } from '@/types';
import { getShiftById } from '@/db';

export default function ShiftDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const [shift, setShift] = useState<Shift | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  const { updateShift, deleteShift } = useShiftStore();
  const { settings, loadSettings } = useSettingsStore();
  const { currentRate, loadRates } = useHourlyRateStore();

  useEffect(() => {
    loadSettings();
    loadRates();
    loadShift();
  }, [id]);

  const loadShift = async () => {
    if (id) {
      const data = await getShiftById(id);
      setShift(data);
    }
  };

  const handleUpdate = async (input: import('@/types').ShiftInput) => {
    if (id) {
      await updateShift(id, input);
      setShowEditForm(false);
      loadShift();
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'シフトを削除',
      'このシフトを削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            if (id) {
              await deleteShift(id);
              router.back();
            }
          },
        },
      ]
    );
  };

  if (!shift) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text variant="bodyMedium">読み込み中...</Text>
      </View>
    );
  }

  const defaultSettings = settings ?? {
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
  const date = parseISO(shift.date);

  return (
    <>
      <Stack.Screen
        options={{
          title: format(date, 'M月d日(E)', { locale: ja }) + 'のシフト',
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.onSurface,
        }}
      />

      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* Time Card */}
          <Card>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              勤務時間
            </Text>
            <Text variant="headlineMedium" style={styles.time}>
              {shift.startTime} - {shift.endTime}
            </Text>
            {shift.breakMinutes > 0 && (
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                休憩 {shift.breakMinutes}分
              </Text>
            )}
          </Card>

          {/* Income Card */}
          <Card>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              給与
            </Text>
            <Text variant="headlineMedium" style={styles.amount}>
              {formatCurrency(income.total)}
            </Text>

            <Divider style={styles.divider} />

            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  勤務時間
                </Text>
                <Text variant="bodyMedium">{formatHours(income.hours)}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  時給
                </Text>
                <Text variant="bodyMedium">¥{shift.hourlyRate.toLocaleString()}</Text>
              </View>
              {income.nightHours > 0 && (
                <>
                  <View style={styles.detailItem}>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      深夜時間
                    </Text>
                    <Text variant="bodyMedium">{formatHours(income.nightHours)}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      深夜手当
                    </Text>
                    <Text variant="bodyMedium">{formatCurrency(income.night)}</Text>
                  </View>
                </>
              )}
            </View>
          </Card>

          {/* Note Card */}
          {shift.note && (
            <Card>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                メモ
              </Text>
              <Text variant="bodyMedium" style={styles.note}>
                {shift.note}
              </Text>
            </Card>
          )}

          {/* Meta Info */}
          <Card>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              登録日時: {format(parseISO(shift.createdAt), 'yyyy/MM/dd HH:mm', { locale: ja })}
            </Text>
            {shift.updatedAt !== shift.createdAt && (
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                更新日時: {format(parseISO(shift.updatedAt), 'yyyy/MM/dd HH:mm', { locale: ja })}
              </Text>
            )}
          </Card>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              mode="outlined"
              icon="pencil"
              onPress={() => setShowEditForm(true)}
              style={styles.actionButton}
            >
              編集
            </Button>
            <Button
              mode="outlined"
              icon="delete"
              onPress={handleDelete}
              style={styles.actionButton}
              textColor={theme.colors.error}
            >
              削除
            </Button>
          </View>
        </ScrollView>

        {/* Edit Form Modal */}
        <Portal>
          <Modal
            visible={showEditForm}
            onDismiss={() => setShowEditForm(false)}
            contentContainerStyle={styles.modalContent}
          >
            <View style={[styles.modalInner, { backgroundColor: theme.colors.surface }]}>
              <ShiftForm
                shift={shift}
                settings={settings}
                currentHourlyRate={currentRate}
                onSubmit={handleUpdate}
                onCancel={() => setShowEditForm(false)}
              />
            </View>
          </Modal>
        </Portal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  time: {
    fontWeight: '600',
    marginVertical: 4,
  },
  amount: {
    fontWeight: '700',
    marginVertical: 4,
  },
  divider: {
    marginVertical: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  detailItem: {
    width: '45%',
  },
  note: {
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalInner: {
    borderRadius: 16,
    maxHeight: '85%',
    overflow: 'hidden',
  },
});

