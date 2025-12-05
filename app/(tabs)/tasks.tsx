/**
 * Tasks Screen - Task management with filtering
 */

import React, { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl } from 'react-native';
import { Text, useTheme, FAB, Portal, Modal, Chip, Searchbar, SegmentedButtons } from 'react-native-paper';
import { useFocusEffect, router } from 'expo-router';
import { TaskCard, TaskForm } from '@/components';
import { EmptyState } from '@/components/ui';
import { useTaskStore } from '@/stores';
import type { Task, TaskFilter, TaskStatus } from '@/types';
import { customColors } from '@/theme';

export default function TasksScreen() {
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'done'>('active');

  const { tasks, loadTasks, createTask, updateTask, stats } = useTaskStore();

  useFocusEffect(
    useCallback(() => {
      loadTasksWithFilter();
    }, [statusFilter])
  );

  const loadTasksWithFilter = async () => {
    const filter: TaskFilter = {};

    if (statusFilter === 'active') {
      filter.status = ['todo', 'in_progress', 'on_hold'];
    } else if (statusFilter === 'done') {
      filter.status = ['done'];
    }

    if (searchQuery) {
      filter.search = searchQuery;
    }

    await loadTasks(filter);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasksWithFilter();
    setRefreshing(false);
  };

  const handleSubmit = async (input: import('@/types').TaskInput) => {
    await createTask(input);
    setShowForm(false);
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    await updateTask(taskId, { status: newStatus });
  };

  const handleSearch = () => {
    loadTasksWithFilter();
  };

  // Group tasks by status for display
  const groupedTasks = {
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    todo: tasks.filter(t => t.status === 'todo'),
    on_hold: tasks.filter(t => t.status === 'on_hold'),
    done: tasks.filter(t => t.status === 'done'),
  };

  const renderTaskGroup = (title: string, taskList: Task[], color: string) => {
    if (taskList.length === 0) return null;

    return (
      <View style={styles.taskGroup}>
        <View style={styles.groupHeader}>
          <View style={[styles.groupIndicator, { backgroundColor: color }]} />
          <Text variant="titleSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {title} ({taskList.length})
          </Text>
        </View>
        {taskList.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onPress={() => router.push(`/task/${task.id}`)}
            onStatusChange={(status) => handleStatusChange(task.id, status)}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header with search and filter */}
      <View style={styles.header}>
        <Searchbar
          placeholder="タスクを検索..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          style={styles.searchbar}
        />
        <SegmentedButtons
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
          buttons={[
            { value: 'active', label: '未完了' },
            { value: 'done', label: '完了' },
            { value: 'all', label: 'すべて' },
          ]}
          style={styles.filterButtons}
        />
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <Chip
          compact
          style={[styles.statChip, { backgroundColor: customColors.status.in_progress + '20' }]}
          textStyle={{ color: customColors.status.in_progress }}
        >
          進行中 {stats.inProgress}
        </Chip>
        <Chip
          compact
          style={[styles.statChip, { backgroundColor: customColors.status.todo + '20' }]}
          textStyle={{ color: customColors.status.todo }}
        >
          未着手 {stats.todo}
        </Chip>
        <Chip
          compact
          style={[styles.statChip, { backgroundColor: customColors.status.on_hold + '20' }]}
          textStyle={{ color: customColors.status.on_hold }}
        >
          保留 {stats.onHold}
        </Chip>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {tasks.length > 0 ? (
          <>
            {renderTaskGroup('進行中', groupedTasks.in_progress, customColors.status.in_progress)}
            {renderTaskGroup('未着手', groupedTasks.todo, customColors.status.todo)}
            {renderTaskGroup('保留', groupedTasks.on_hold, customColors.status.on_hold)}
            {renderTaskGroup('完了', groupedTasks.done, customColors.status.done)}
          </>
        ) : (
          <EmptyState
            icon="checkbox-outline"
            title="タスクがありません"
            description="＋ボタンからタスクを追加しましょう"
            actionLabel="タスクを追加"
            onAction={() => setShowForm(true)}
          />
        )}
      </ScrollView>

      {/* FAB for adding task */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => setShowForm(true)}
        color="#fff"
      />

      {/* Task Form Modal */}
      <Portal>
        <Modal
          visible={showForm}
          onDismiss={() => setShowForm(false)}
          contentContainerStyle={styles.modalContent}
        >
          <View style={[styles.modalInner, { backgroundColor: theme.colors.surface }]}>
            <TaskForm
              onSubmit={handleSubmit}
              onCancel={() => setShowForm(false)}
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
  header: {
    padding: 16,
    paddingBottom: 8,
    gap: 12,
  },
  searchbar: {
    elevation: 0,
  },
  filterButtons: {
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  statChip: {
    height: 28,
  },
  content: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 100,
  },
  taskGroup: {
    marginBottom: 24,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  groupIndicator: {
    width: 4,
    height: 16,
    borderRadius: 2,
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

