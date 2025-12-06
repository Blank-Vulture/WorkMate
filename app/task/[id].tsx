/**
 * Task Detail Screen with Timeline
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { Text, useTheme, Button, Chip, Divider, TextInput } from 'react-native-paper';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Card } from '@/components/ui';
import { TaskForm, TaskTimeline } from '@/components/task';
import { useTaskStore } from '@/stores';
import { customColors } from '@/theme';
import type { Task, TaskActivity } from '@/types';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const [showEditForm, setShowEditForm] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);

  const { selectedTask, activities, selectTask, updateTask, deleteTask, addComment, clearSelection } = useTaskStore();

  useEffect(() => {
    if (id) {
      selectTask(id);
    }
    return () => clearSelection();
  }, [id]);

  const handleUpdate = async (input: import('@/types').TaskInput) => {
    if (id) {
      await updateTask(id, input);
      setShowEditForm(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'タスクを削除',
      'このタスクを削除しますか？すべてのコメントも削除されます。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            if (id) {
              await deleteTask(id);
              router.back();
            }
          },
        },
      ]
    );
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !id) return;

    setIsAddingComment(true);
    try {
      await addComment(id, newComment.trim());
      setNewComment('');
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleStatusChange = async (status: Task['status']) => {
    if (id) {
      await updateTask(id, { status });
    }
  };

  if (!selectedTask) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text variant="bodyMedium">読み込み中...</Text>
      </View>
    );
  }

  const getStatusConfig = (status: Task['status']) => {
    switch (status) {
      case 'todo':
        return { color: customColors.status.todo, label: '未着手' };
      case 'in_progress':
        return { color: customColors.status.in_progress, label: '進行中' };
      case 'done':
        return { color: customColors.status.done, label: '完了' };
      case 'on_hold':
        return { color: customColors.status.on_hold, label: '保留' };
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

  const statusConfig = getStatusConfig(selectedTask.status);
  const priorityConfig = getPriorityConfig(selectedTask.priority);

  if (showEditForm) {
    return (
      <>
        <Stack.Screen options={{ title: 'タスクを編集' }} />
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <TaskForm
            task={selectedTask}
            onSubmit={handleUpdate}
            onCancel={() => setShowEditForm(false)}
          />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'タスク詳細',
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.onSurface,
        }}
      />

      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* Task Info Card */}
          <Card>
            <Text variant="headlineSmall" style={styles.title}>
              {selectedTask.title}
            </Text>

            <View style={styles.badges}>
              <Chip
                style={[styles.badge, { backgroundColor: statusConfig.color + '20' }]}
                textStyle={{ color: statusConfig.color }}
              >
                {statusConfig.label}
              </Chip>
              <Chip
                style={[styles.badge, { backgroundColor: priorityConfig.color + '20' }]}
                textStyle={{ color: priorityConfig.color }}
              >
                優先度: {priorityConfig.label}
              </Chip>
            </View>

            {selectedTask.description && (
              <>
                <Divider style={styles.divider} />
                <Text variant="bodyMedium">{selectedTask.description}</Text>
              </>
            )}

            {selectedTask.dueDate && (
              <>
                <Divider style={styles.divider} />
                <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  期限: {format(parseISO(selectedTask.dueDate), 'yyyy年M月d日', { locale: ja })}
                </Text>
              </>
            )}
          </Card>

          {/* Status Actions */}
          <Card>
            <Text variant="titleSmall" style={styles.sectionTitle}>ステータスを変更</Text>
            <View style={styles.statusButtons}>
              {(['todo', 'in_progress', 'done', 'on_hold'] as const).map((status) => {
                const config = getStatusConfig(status);
                const isActive = selectedTask.status === status;
                return (
                  <Button
                    key={status}
                    mode={isActive ? 'contained' : 'outlined'}
                    onPress={() => handleStatusChange(status)}
                    style={styles.statusButton}
                    buttonColor={isActive ? config.color : undefined}
                    textColor={isActive ? '#fff' : config.color}
                    compact
                  >
                    {config.label}
                  </Button>
                );
              })}
            </View>
          </Card>

          {/* Add Comment */}
          <Card>
            <Text variant="titleSmall" style={styles.sectionTitle}>コメントを追加</Text>
            <TextInput
              mode="outlined"
              value={newComment}
              onChangeText={setNewComment}
              placeholder="コメントを入力..."
              multiline
              numberOfLines={3}
            />
            <Button
              mode="contained"
              onPress={handleAddComment}
              loading={isAddingComment}
              disabled={!newComment.trim() || isAddingComment}
              style={styles.addCommentButton}
            >
              コメントを追加
            </Button>
          </Card>

          {/* Timeline */}
          <Card>
            <Text variant="titleSmall" style={styles.sectionTitle}>アクティビティ</Text>
            <TaskTimeline activities={activities} />
          </Card>

          {/* Meta Info */}
          <Card>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              作成日時: {format(parseISO(selectedTask.createdAt), 'yyyy/MM/dd HH:mm', { locale: ja })}
            </Text>
            {selectedTask.completedAt && (
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                完了日時: {format(parseISO(selectedTask.completedAt), 'yyyy/MM/dd HH:mm', { locale: ja })}
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
    paddingBottom: 32,
  },
  title: {
    fontWeight: '600',
    marginBottom: 12,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    height: 28,
  },
  divider: {
    marginVertical: 12,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    minWidth: 80,
  },
  addCommentButton: {
    marginTop: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
  },
});

