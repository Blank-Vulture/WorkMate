/**
 * Task Card Component
 */

import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Text, useTheme, Chip } from 'react-native-paper';
import Ionicons from '@expo/vector-icons/Ionicons';
import { format, parseISO, isPast, isToday } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { Task } from '@/types';
import { customColors } from '@/theme';

interface TaskCardProps {
  task: Task;
  onPress?: () => void;
  onStatusChange?: (status: Task['status']) => void;
}

export function TaskCard({ task, onPress, onStatusChange }: TaskCardProps) {
  const theme = useTheme();

  const getStatusConfig = (status: Task['status']) => {
    switch (status) {
      case 'todo':
        return { icon: 'ellipse-outline' as const, color: customColors.status.todo, label: '未着手' };
      case 'in_progress':
        return { icon: 'play-circle' as const, color: customColors.status.in_progress, label: '進行中' };
      case 'done':
        return { icon: 'checkmark-circle' as const, color: customColors.status.done, label: '完了' };
      case 'on_hold':
        return { icon: 'pause-circle' as const, color: customColors.status.on_hold, label: '保留' };
    }
  };

  const getPriorityConfig = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return { color: customColors.priority.high, label: '高' };
      case 'medium':
        return { color: customColors.priority.medium, label: '中' };
      case 'low':
        return { color: customColors.priority.low, label: '低' };
    }
  };

  const statusConfig = getStatusConfig(task.status);
  const priorityConfig = getPriorityConfig(task.priority);

  const isOverdue = task.dueDate && isPast(parseISO(task.dueDate)) && task.status !== 'done';
  const isDueToday = task.dueDate && isToday(parseISO(task.dueDate));

  const handleStatusToggle = () => {
    if (!onStatusChange) return;
    
    // Cycle through statuses
    const statusOrder: Task['status'][] = ['todo', 'in_progress', 'done'];
    const currentIndex = statusOrder.indexOf(task.status);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    onStatusChange(statusOrder[nextIndex]);
  };

  return (
    <Pressable
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
      onPress={onPress}
      android_ripple={{ color: theme.colors.primaryContainer }}
    >
      <Pressable onPress={handleStatusToggle} style={styles.statusButton}>
        <Ionicons
          name={statusConfig.icon}
          size={24}
          color={statusConfig.color}
        />
      </Pressable>

      <View style={styles.content}>
        <Text
          variant="titleMedium"
          style={[
            styles.title,
            task.status === 'done' && styles.completedTitle,
          ]}
          numberOfLines={2}
        >
          {task.title}
        </Text>

        <View style={styles.metaRow}>
          <Chip
            compact
            style={[styles.priorityChip, { backgroundColor: priorityConfig.color + '20' }]}
            textStyle={{ color: priorityConfig.color, fontSize: 10 }}
          >
            {priorityConfig.label}
          </Chip>

          {task.dueDate && (
            <Text
              variant="labelSmall"
              style={[
                styles.dueDate,
                { color: theme.colors.onSurfaceVariant },
                isOverdue && styles.overdue,
                isDueToday && styles.dueToday,
              ]}
            >
              {isOverdue ? '期限超過: ' : isDueToday ? '今日: ' : ''}
              {format(parseISO(task.dueDate), 'M/d', { locale: ja })}
            </Text>
          )}
        </View>
      </View>

      <Ionicons
        name="chevron-forward"
        size={20}
        color={theme.colors.onSurfaceVariant}
      />
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
  statusButton: {
    padding: 4,
    marginRight: 12,
  },
  content: {
    flex: 1,
    gap: 8,
  },
  title: {
    fontWeight: '500',
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityChip: {
    height: 24,
  },
  dueDate: {
    fontSize: 12,
  },
  overdue: {
    color: customColors.priority.high,
  },
  dueToday: {
    color: customColors.priority.medium,
  },
});

