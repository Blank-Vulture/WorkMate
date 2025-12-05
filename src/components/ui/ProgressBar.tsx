/**
 * Custom Progress Bar with gradient support
 */

import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';
import { customColors } from '@/theme';

interface ProgressBarProps {
  progress: number; // 0-1
  height?: number;
  style?: ViewStyle;
  showWarningColors?: boolean;
}

export function ProgressBar({
  progress,
  height = 8,
  style,
  showWarningColors = false,
}: ProgressBarProps) {
  const theme = useTheme();
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  
  let backgroundColor = theme.colors.primary;
  if (showWarningColors) {
    if (clampedProgress >= 1) {
      backgroundColor = customColors.income.danger;
    } else if (clampedProgress >= 0.8) {
      backgroundColor = customColors.income.warning;
    } else {
      backgroundColor = customColors.income.safe;
    }
  }

  return (
    <View style={[styles.container, { height }, style]}>
      <View style={[styles.track, { backgroundColor: theme.colors.surfaceVariant }]} />
      <View
        style={[
          styles.fill,
          {
            width: `${clampedProgress * 100}%`,
            backgroundColor,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  track: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 4,
  },
});

