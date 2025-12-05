/**
 * Task Timeline Component - Redmine-style activity log
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Ionicons from '@expo/vector-icons/Ionicons';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { TaskActivity } from '@/types';
import { customColors } from '@/theme';

interface TaskTimelineProps {
  activities: TaskActivity[];
}

export function TaskTimeline({ activities }: TaskTimelineProps) {
  const theme = useTheme();

  const getActivityConfig = (type: TaskActivity['type']) => {
    switch (type) {
      case 'created':
        return { icon: 'add-circle' as const, color: theme.colors.primary };
      case 'comment':
        return { icon: 'chatbubble' as const, color: theme.colors.secondary };
      case 'status_change':
        return { icon: 'swap-horizontal' as const, color: customColors.status.in_progress };
      case 'priority_change':
        return { icon: 'flag' as const, color: customColors.priority.medium };
      case 'updated':
        return { icon: 'create' as const, color: theme.colors.onSurfaceVariant };
      default:
        return { icon: 'ellipse' as const, color: theme.colors.onSurfaceVariant };
    }
  };

  if (activities.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          アクティビティはありません
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {activities.map((activity, index) => {
        const config = getActivityConfig(activity.type);
        const isLast = index === activities.length - 1;

        return (
          <View key={activity.id} style={styles.item}>
            {/* Timeline line */}
            {!isLast && (
              <View
                style={[
                  styles.line,
                  { backgroundColor: theme.colors.outlineVariant },
                ]}
              />
            )}

            {/* Icon */}
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: config.color + '20' },
              ]}
            >
              <Ionicons name={config.icon} size={16} color={config.color} />
            </View>

            {/* Content */}
            <View style={styles.content}>
              <Text variant="bodyMedium">{activity.content}</Text>
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {format(parseISO(activity.createdAt), 'yyyy/MM/dd HH:mm', {
                  locale: ja,
                })}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
  },
  item: {
    flexDirection: 'row',
    position: 'relative',
    paddingBottom: 20,
  },
  line: {
    position: 'absolute',
    left: 15,
    top: 32,
    bottom: 0,
    width: 2,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
    gap: 4,
  },
});

