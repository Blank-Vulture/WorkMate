/**
 * Income Tracker - 103万円 Dashboard Component
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme, IconButton } from 'react-native-paper';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Card, ProgressBar } from '@/components/ui';
import { customColors } from '@/theme';
import type { YearlyIncomeStats } from '@/types';
import { TAX_THRESHOLD } from '@/types';
import { formatCurrency } from '@/utils/salary';
import { getTaxStatusMessage } from '@/utils/tax';

interface IncomeTrackerProps {
  stats: YearlyIncomeStats | null;
  onInfoPress?: () => void;
}

export function IncomeTracker({ stats, onInfoPress }: IncomeTrackerProps) {
  const theme = useTheme();

  if (!stats) {
    return (
      <Card>
        <Text variant="titleMedium">年間収入トラッカー</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          データがありません
        </Text>
      </Card>
    );
  }

  const progress = stats.totalGrossIncome / TAX_THRESHOLD;
  const statusInfo = getTaxStatusMessage(stats);

  const getStatusColor = () => {
    switch (statusInfo.status) {
      case 'danger':
        return customColors.income.danger;
      case 'warning':
        return customColors.income.warning;
      default:
        return customColors.income.safe;
    }
  };

  const getStatusIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (statusInfo.status) {
      case 'danger':
        return 'alert-circle';
      case 'warning':
        return 'warning';
      default:
        return 'checkmark-circle';
    }
  };

  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text variant="titleMedium">年間収入トラッカー</Text>
          <IconButton
            icon="information-outline"
            size={20}
            onPress={onInfoPress}
          />
        </View>
        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {stats.year}年
        </Text>
      </View>

      <View style={styles.amountContainer}>
        <Text variant="displaySmall" style={styles.amount}>
          {formatCurrency(stats.totalGrossIncome)}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          / {formatCurrency(TAX_THRESHOLD)}
        </Text>
      </View>

      <ProgressBar
        progress={progress}
        height={12}
        showWarningColors
        style={styles.progressBar}
      />

      <View style={[styles.statusContainer, { backgroundColor: getStatusColor() + '15' }]}>
        <Ionicons
          name={getStatusIcon()}
          size={20}
          color={getStatusColor()}
          style={styles.statusIcon}
        />
        <View style={styles.statusText}>
          <Text variant="titleSmall" style={{ color: getStatusColor() }}>
            {statusInfo.message}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            残り枠: {formatCurrency(stats.remainingTo103Man)}
          </Text>
        </View>
      </View>

      {stats.willExceed103Man && !stats.isOver103Man && (
        <View style={styles.projectionContainer}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            予測年間収入: {formatCurrency(stats.projectedYearEndIncome)}
          </Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  amount: {
    fontWeight: '700',
  },
  progressBar: {
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  statusIcon: {
    marginRight: 12,
  },
  statusText: {
    flex: 1,
  },
  projectionContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
});

