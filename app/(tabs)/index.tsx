/**
 * Home Screen - Dashboard with income tracker and recent items
 */

import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl } from 'react-native';
import { Text, useTheme, FAB, Portal, Modal, Button } from 'react-native-paper';
import { useFocusEffect, router } from 'expo-router';
import { IncomeTracker, MonthlySummary, ShiftCard, TaskCard } from '@/components';
import { Card } from '@/components/ui';
import { useShiftStore, useTaskStore, useSettingsStore, useHourlyRateStore } from '@/stores';
import { calculateMonthlyIncome, calculateYearlyStats, get103ManExplanation } from '@/utils';
import type { MonthlyIncome, YearlyIncomeStats, Shift, Task } from '@/types';

export default function HomeScreen() {
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [monthlyIncome, setMonthlyIncome] = useState<MonthlyIncome | null>(null);
  const [yearlyStats, setYearlyStats] = useState<YearlyIncomeStats | null>(null);
  const [recentShifts, setRecentShifts] = useState<Shift[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const { loadShifts, loadShiftsByYear, getRecentShifts } = useShiftStore();
  const { getRecentTasks, stats: taskStats, loadStats } = useTaskStore();
  const { settings, loadSettings } = useSettingsStore();
  const { loadRates, currentRate } = useHourlyRateStore();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const loadData = useCallback(async () => {
    await Promise.all([
      loadSettings(),
      loadRates(),
      loadShifts(currentYear, currentMonth),
      loadStats(),
    ]);

    // Get recent items
    const shifts = await getRecentShifts();
    const tasks = await getRecentTasks();
    setRecentShifts(shifts);
    setRecentTasks(tasks);

    // Load all shifts for the year to calculate stats
    const yearShifts = await loadShiftsByYear(currentYear);
    
    if (settings) {
      // Calculate monthly income
      const monthShifts = yearShifts.filter((s) => {
        const [y, m] = s.date.split('-').map(Number);
        return y === currentYear && m === currentMonth;
      });
      const monthly = calculateMonthlyIncome(monthShifts, settings, currentYear, currentMonth);
      setMonthlyIncome(monthly);

      // Calculate yearly stats
      const monthlyIncomes: MonthlyIncome[] = [];
      for (let m = 1; m <= 12; m++) {
        const mShifts = yearShifts.filter((s) => {
          const [y, month] = s.date.split('-').map(Number);
          return y === currentYear && month === m;
        });
        monthlyIncomes.push(calculateMonthlyIncome(mShifts, settings, currentYear, m));
      }
      const stats = calculateYearlyStats(monthlyIncomes, currentMonth);
      setYearlyStats(stats);
    }
  }, [currentYear, currentMonth, settings, loadSettings, loadRates, loadShifts, loadStats, getRecentShifts, getRecentTasks, loadShiftsByYear]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Income Tracker */}
        <IncomeTracker stats={yearlyStats} onInfoPress={() => setShowInfoModal(true)} />

        {/* Monthly Summary */}
        <MonthlySummary income={monthlyIncome} />

        {/* Quick Stats */}
        <Card>
          <Text variant="titleMedium" style={styles.sectionTitle}>タスク状況</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text variant="headlineMedium" style={{ color: theme.colors.primary }}>
                {taskStats.inProgress}
              </Text>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                進行中
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineMedium" style={{ color: theme.colors.onSurface }}>
                {taskStats.todo}
              </Text>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                未着手
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineMedium" style={{ color: theme.colors.tertiary }}>
                {taskStats.done}
              </Text>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                完了
              </Text>
            </View>
          </View>
        </Card>

        {/* Recent Shifts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium">直近のシフト</Text>
            <Button compact onPress={() => router.push('/shifts')}>
              すべて見る
            </Button>
          </View>
          {recentShifts.length > 0 ? (
            recentShifts.slice(0, 3).map((shift) => (
              <ShiftCard
                key={shift.id}
                shift={shift}
                settings={settings}
                onPress={() => router.push(`/shift/${shift.id}`)}
              />
            ))
          ) : (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, padding: 16 }}>
              シフトはまだ登録されていません
            </Text>
          )}
        </View>

        {/* Recent Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium">最近のタスク</Text>
            <Button compact onPress={() => router.push('/tasks')}>
              すべて見る
            </Button>
          </View>
          {recentTasks.length > 0 ? (
            recentTasks.slice(0, 3).map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onPress={() => router.push(`/task/${task.id}`)}
              />
            ))
          ) : (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, padding: 16 }}>
              タスクはまだ登録されていません
            </Text>
          )}
        </View>

        {/* Hourly Rate Info */}
        {currentRate > 0 && (
          <Card>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              現在の時給
            </Text>
            <Text variant="titleLarge">¥{currentRate.toLocaleString()}</Text>
          </Card>
        )}
      </ScrollView>

      {/* 103万円説明モーダル */}
      <Portal>
        <Modal
          visible={showInfoModal}
          onDismiss={() => setShowInfoModal(false)}
          contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>103万円の壁について</Text>
          <ScrollView style={styles.modalScroll}>
            <Text variant="bodyMedium" style={{ lineHeight: 24 }}>
              {get103ManExplanation()}
            </Text>
          </ScrollView>
          <Button mode="contained" onPress={() => setShowInfoModal(false)} style={styles.modalButton}>
            閉じる
          </Button>
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
  sectionTitle: {
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  section: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalContent: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    maxHeight: '80%',
  },
  modalTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalButton: {
    marginTop: 16,
  },
});

