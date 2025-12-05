/**
 * Shifts Screen - Calendar view with shift management
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, useTheme, FAB, Portal, Modal, IconButton, Button } from 'react-native-paper';
import { useFocusEffect } from 'expo-router';
import { Calendar, DateData } from 'react-native-calendars';
import { format, addMonths, subMonths } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ShiftCard, ShiftForm, MonthlySummary } from '@/components';
import { EmptyState, Card } from '@/components/ui';
import { useShiftStore, useSettingsStore, useHourlyRateStore } from '@/stores';
import { calculateMonthlyIncome } from '@/utils';
import type { Shift, MonthlyIncome } from '@/types';
import { colors } from '@/theme';

export default function ShiftsScreen() {
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [monthlyIncome, setMonthlyIncome] = useState<MonthlyIncome | null>(null);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  const { shifts, selectedMonth, loadShifts, setSelectedMonth, createShift, updateShift, deleteShift, bulkUpsertShifts } = useShiftStore();
  const { settings, loadSettings } = useSettingsStore();
  const { currentRate, loadRates, getCurrentRate } = useHourlyRateStore();

  const currentMonthStr = `${selectedMonth.year}-${String(selectedMonth.month).padStart(2, '0')}`;

  useFocusEffect(
    useCallback(() => {
      loadSettings();
      loadRates();
      loadShifts(selectedMonth.year, selectedMonth.month);
    }, [selectedMonth.year, selectedMonth.month, loadSettings, loadRates, loadShifts])
  );

  useEffect(() => {
    if (settings && shifts.length >= 0) {
      const income = calculateMonthlyIncome(shifts, settings, selectedMonth.year, selectedMonth.month);
      setMonthlyIncome(income);
    }
  }, [shifts, settings, selectedMonth]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadShifts(selectedMonth.year, selectedMonth.month);
    setRefreshing(false);
  };

  // Create marked dates for calendar
  const markedDates = useMemo(() => {
    const marks: Record<string, { marked: boolean; dotColor: string; selected?: boolean; selectedColor?: string }> = {};

    for (const shift of shifts) {
      marks[shift.date] = {
        marked: true,
        dotColor: colors.primary,
      };
    }

    if (isBulkMode) {
      for (const date of selectedDates) {
        marks[date] = {
          ...marks[date],
          selected: true,
          selectedColor: colors.secondary,
        };
      }
    } else if (selectedDate) {
      marks[selectedDate] = {
        ...marks[selectedDate],
        selected: true,
        selectedColor: colors.primary,
      };
    }

    return marks;
  }, [shifts, selectedDate, isBulkMode, selectedDates]);

  const handleMonthChange = (date: DateData) => {
    setSelectedMonth(date.year, date.month);
    setSelectedDate(null);
  };

  const handleDayPress = (date: DateData) => {
    if (isBulkMode) {
      const dateStr = date.dateString;
      setSelectedDates(prev => {
        if (prev.includes(dateStr)) {
          return prev.filter(d => d !== dateStr);
        } else {
          return [...prev, dateStr];
        }
      });
    } else {
      setSelectedDate(date.dateString);
      const existingShift = shifts.find(s => s.date === date.dateString);
      if (existingShift) {
        setEditingShift(existingShift);
        setShowForm(true);
      }
    }
  };

  const handleAddShift = () => {
    setEditingShift(null);
    setShowForm(true);
  };

  const toggleBulkMode = () => {
    setIsBulkMode(!isBulkMode);
    setSelectedDates([]);
    setSelectedDate(null);
  };

  const handleBulkSubmit = async () => {
    if (selectedDates.length === 0) return;

    const { standardShiftStart, standardShiftEnd, standardShiftBreak } = settings || {};

    if (!standardShiftStart || !standardShiftEnd) {
      Alert.alert('設定エラー', '平常勤務時刻が設定されていません。\n設定画面で「平常勤務の開始・終了時刻」を設定してください。');
      return;
    }

    // Confirmation
    const confirmed = await new Promise<boolean>(resolve => {
      // We can use Alert.alert here, but since we are in a loop of tools, 
      // we'll assume the user wants to proceed if they clicked the button.
      // In a real app, we'd show an Alert.
      // For this implementation, I'll add the Alert logic.
      // Note: Alert.alert is async on some platforms but callback based on RN.
      // We'll just proceed for now or use a custom modal if needed.
      // Let's use standard Alert.
      resolve(true);
    });

    if (!confirmed) return;

    // Create shifts
    // We'll do this sequentially to ensure DB consistency
    // Prepare bulk operations
    const operations = selectedDates.map(date => {
      const existing = shifts.find(s => s.date === date);
      const input = {
        date,
        startTime: standardShiftStart,
        endTime: standardShiftEnd,
        breakMinutes: standardShiftBreak ?? 60,
      };

      if (existing) {
        return { type: 'update' as const, id: existing.id, data: input };
      } else {
        return { type: 'create' as const, data: input };
      }
    });

    try {
      await bulkUpsertShifts(operations);

      Alert.alert('完了', 'シフトを一括登録しました');
      setIsBulkMode(false);
      setSelectedDates([]);
    } catch (error) {
      console.error('Bulk insert error:', error);
      Alert.alert('エラー', 'シフトの登録に失敗しました');
    }
  };

  const handleSubmit = async (input: import('@/types').ShiftInput) => {
    if (editingShift) {
      await updateShift(editingShift.id, input);
    } else {
      await createShift(input);
    }
    setShowForm(false);
    setEditingShift(null);
    setSelectedDate(null);
  };

  const handleDeleteShift = async (id: string) => {
    await deleteShift(id);
  };

  const goToPreviousMonth = () => {
    const date = new Date(selectedMonth.year, selectedMonth.month - 1, 1);
    const prev = subMonths(date, 1);
    setSelectedMonth(prev.getFullYear(), prev.getMonth() + 1);
    setSelectedDate(null);
    setSelectedDates([]);
  };

  const goToNextMonth = () => {
    const date = new Date(selectedMonth.year, selectedMonth.month - 1, 1);
    const next = addMonths(date, 1);
    setSelectedMonth(next.getFullYear(), next.getMonth() + 1);
    setSelectedDate(null);
    setSelectedDates([]);
  };

  const selectedDateShift = selectedDate ? shifts.find(s => s.date === selectedDate) : null;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <IconButton icon="chevron-left" onPress={goToPreviousMonth} />
          <Text variant="titleLarge">
            {format(new Date(selectedMonth.year, selectedMonth.month - 1), 'yyyy年M月', { locale: ja })}
          </Text>
          <IconButton icon="chevron-right" onPress={goToNextMonth} />
        </View>

        {/* Bulk Mode Toggle */}
        <View style={styles.bulkToggle}>
          <Button
            mode={isBulkMode ? "contained" : "outlined"}
            onPress={toggleBulkMode}
            icon="calendar-multiselect"
            compact
          >
            {isBulkMode ? "一括入力を終了" : "一括入力モード"}
          </Button>
          {isBulkMode && (
            <Text variant="bodySmall" style={{ marginLeft: 8, alignSelf: 'center' }}>
              {selectedDates.length}日選択中
            </Text>
          )}
        </View>

        {/* Calendar */}
        <Calendar
          key={currentMonthStr}
          current={currentMonthStr + '-01'}
          markedDates={markedDates}
          onDayPress={handleDayPress}
          onMonthChange={handleMonthChange}
          hideArrows
          hideExtraDays
          disableMonthChange
          theme={{
            calendarBackground: theme.colors.surface,
            textSectionTitleColor: theme.colors.onSurfaceVariant,
            selectedDayBackgroundColor: isBulkMode ? colors.secondary : colors.primary,
            selectedDayTextColor: '#ffffff',
            todayTextColor: colors.primary,
            dayTextColor: theme.colors.onSurface,
            textDisabledColor: theme.colors.onSurfaceVariant,
            dotColor: colors.primary,
            monthTextColor: theme.colors.onSurface,
            arrowColor: colors.primary,
          }}
          style={styles.calendar}
        />

        {/* Bulk Action */}
        {isBulkMode && selectedDates.length > 0 && (
          <Card style={styles.bulkActionCard}>
            <Text variant="bodyMedium" style={{ marginBottom: 12 }}>
              選択した{selectedDates.length}日間に、平常勤務（{settings?.standardShiftStart}〜{settings?.standardShiftEnd}）を一括入力します。
            </Text>
            <Button mode="contained" onPress={() => {
              // Show confirmation alert
              // Since Alert is not available in Node environment for testing, we wrap it
              // But here we are in the app code.
              // We'll use a simple confirm dialog approach if possible, or just the button.
              // The user requirement asked for a modal.
              // We can use the existing Portal/Modal or RN Alert.
              // Let's use RN Alert for simplicity as it's standard.
              Alert.alert(
                '一括入力の確認',
                `選択した${selectedDates.length}日間に平常勤務時間を入力しますか？\n既存のシフトは上書きされます。`,
                [
                  { text: 'キャンセル', style: 'cancel' },
                  { text: '決定', onPress: handleBulkSubmit }
                ]
              );
            }}>
              一括入力する
            </Button>
          </Card>
        )}

        {/* Monthly Summary */}
        {!isBulkMode && <MonthlySummary income={monthlyIncome} />}

        {/* Selected Date Shift */}
        {!isBulkMode && selectedDate && (
          <View style={styles.selectedDateSection}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {format(new Date(selectedDate), 'M月d日のシフト', { locale: ja })}
            </Text>
            {selectedDateShift ? (
              <ShiftCard
                shift={selectedDateShift}
                settings={settings}
                onPress={() => {
                  setEditingShift(selectedDateShift);
                  setShowForm(true);
                }}
                onDelete={() => handleDeleteShift(selectedDateShift.id)}
              />
            ) : (
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                この日のシフトはありません
              </Text>
            )}
          </View>
        )}

        {/* Shifts List */}
        {!isBulkMode && (
          <View style={styles.shiftsSection}>
            <Text variant="titleMedium" style={styles.sectionTitle}>今月のシフト一覧</Text>
            {shifts.length > 0 ? (
              shifts.map((shift) => (
                <ShiftCard
                  key={shift.id}
                  shift={shift}
                  settings={settings}
                  onPress={() => {
                    setEditingShift(shift);
                    setShowForm(true);
                  }}
                  onDelete={() => handleDeleteShift(shift.id)}
                />
              ))
            ) : (
              <EmptyState
                icon="calendar-outline"
                title="シフトがありません"
                description="＋ボタンからシフトを追加しましょう"
              />
            )}
          </View>
        )}
      </ScrollView>

      {/* FAB for adding shift */}
      {!isBulkMode && (
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={handleAddShift}
          color="#fff"
        />
      )}

      {/* Shift Form Modal */}
      <Portal>
        <Modal
          visible={showForm}
          onDismiss={() => {
            setShowForm(false);
            setEditingShift(null);
          }}
          contentContainerStyle={styles.modalContent}
        >
          <View style={[styles.modalInner, { backgroundColor: theme.colors.surface }]}>
            <ShiftForm
              initialDate={selectedDate ?? undefined}
              shift={editingShift}
              settings={settings}
              currentHourlyRate={currentRate}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingShift(null);
              }}
            />
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  bulkToggle: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  calendar: {
    borderRadius: 12,
    marginBottom: 16,
  },
  bulkActionCard: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: colors.surface,
  },
  selectedDateSection: {
    marginTop: 8,
  },
  shiftsSection: {
    marginTop: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalInner: {
    borderRadius: 16,
    height: '80%',
    width: '90%',
    alignSelf: 'center',
    overflow: 'hidden',
  },
});

