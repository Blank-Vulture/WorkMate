/**
 * Monthly Summary Component
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Card } from '@/components/ui';
import type { MonthlyIncome } from '@/types';
import { formatCurrency, formatHours } from '@/utils/salary';

interface MonthlySummaryProps {
  income: MonthlyIncome | null;
}

export function MonthlySummary({ income }: MonthlySummaryProps) {
  const theme = useTheme();

  const monthName = income 
    ? `${income.year}年${income.month}月` 
    : `${new Date().getFullYear()}年${new Date().getMonth() + 1}月`;

  return (
    <Card>
      <Text variant="titleMedium" style={styles.title}>
        {monthName}の給与
      </Text>

      {income && income.shiftCount > 0 ? (
        <>
          <Text variant="displaySmall" style={styles.amount}>
            {formatCurrency(income.grossIncome)}
          </Text>

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                勤務時間
              </Text>
              <Text variant="bodyMedium">{formatHours(income.totalHours)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                シフト数
              </Text>
              <Text variant="bodyMedium">{income.shiftCount}回</Text>
            </View>
            {income.nightHours > 0 && (
              <View style={styles.detailRow}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  深夜時間
                </Text>
                <Text variant="bodyMedium">{formatHours(income.nightHours)}</Text>
              </View>
            )}
            {income.transportationCost > 0 && (
              <View style={styles.detailRow}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  交通費（非課税）
                </Text>
                <Text variant="bodyMedium">{formatCurrency(income.transportationCost)}</Text>
              </View>
            )}
          </View>
        </>
      ) : (
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          シフトデータがありません
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: 8,
  },
  amount: {
    fontWeight: '700',
    marginBottom: 16,
  },
  detailsContainer: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

