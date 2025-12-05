/**
 * Task Form Component
 */

import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { Text, TextInput, Button, useTheme, SegmentedButtons, Switch } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parse } from 'date-fns';
import type { Task, TaskInput, TaskPriority, TaskStatus } from '@/types';

interface TaskFormProps {
  task?: Task | null;
  onSubmit: (input: TaskInput) => Promise<void>;
  onCancel: () => void;
}

export function TaskForm({ task, onSubmit, onCancel }: TaskFormProps) {
  const theme = useTheme();
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'todo');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'medium');
  const [hasDueDate, setHasDueDate] = useState(!!task?.dueDate);
  const [dueDate, setDueDate] = useState(
    task?.dueDate ?? format(new Date(), 'yyyy-MM-dd')
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        dueDate: hasDueDate ? dueDate : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateChange = (_: unknown, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDueDate(format(selectedDate, 'yyyy-MM-dd'));
    }
  };

  const parsedDate = parse(dueDate, 'yyyy-MM-dd', new Date());

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        <Text variant="titleLarge" style={styles.title}>
          {task ? 'タスクを編集' : 'タスクを追加'}
        </Text>

        {/* Title */}
        <View style={styles.fieldContainer}>
          <Text variant="labelLarge">タイトル *</Text>
          <TextInput
            mode="outlined"
            value={title}
            onChangeText={setTitle}
            placeholder="タスク名を入力..."
          />
        </View>

        {/* Description */}
        <View style={styles.fieldContainer}>
          <Text variant="labelLarge">説明（任意）</Text>
          <TextInput
            mode="outlined"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            placeholder="詳細を入力..."
          />
        </View>

        {/* Status */}
        {task && (
          <View style={styles.fieldContainer}>
            <Text variant="labelLarge">ステータス</Text>
            <SegmentedButtons
              value={status}
              onValueChange={(value) => setStatus(value as TaskStatus)}
              buttons={[
                { value: 'todo', label: '未着手' },
                { value: 'in_progress', label: '進行中' },
                { value: 'done', label: '完了' },
                { value: 'on_hold', label: '保留' },
              ]}
              style={styles.segmentedButtons}
            />
          </View>
        )}

        {/* Priority */}
        <View style={styles.fieldContainer}>
          <Text variant="labelLarge">優先度</Text>
          <SegmentedButtons
            value={priority}
            onValueChange={(value) => setPriority(value as TaskPriority)}
            buttons={[
              { value: 'high', label: '高' },
              { value: 'medium', label: '中' },
              { value: 'low', label: '低' },
            ]}
          />
        </View>

        {/* Due Date */}
        <View style={styles.fieldContainer}>
          <View style={styles.switchRow}>
            <Text variant="labelLarge">期限を設定</Text>
            <Switch value={hasDueDate} onValueChange={setHasDueDate} />
          </View>
          {hasDueDate && (
            <>
              <Button
                mode="outlined"
                onPress={() => setShowDatePicker(true)}
                style={styles.pickerButton}
              >
                {format(parsedDate, 'yyyy年M月d日')}
              </Button>
              {showDatePicker && (
                <DateTimePicker
                  value={parsedDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  locale="ja"
                />
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={[styles.actions, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outlineVariant }]}>
        <Button
          mode="outlined"
          onPress={onCancel}
          style={styles.button}
        >
          キャンセル
        </Button>
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting || !title.trim()}
          style={styles.button}
        >
          {task ? '更新' : '追加'}
        </Button>
      </View>
    </KeyboardAvoidingView>
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
    marginBottom: 24,
    fontWeight: '600',
  },
  fieldContainer: {
    marginBottom: 20,
    gap: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  segmentedButtons: {
    flexWrap: 'wrap',
  },
  pickerButton: {
    alignSelf: 'flex-start',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
  },
  button: {
    minWidth: 100,
  },
});

