/**
 * Shift Form Component
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { Text, TextInput, Button, useTheme, SegmentedButtons } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parse } from 'date-fns';
import type { Shift, ShiftInput, Settings, BreakRule } from '@/types';
import { calculateAutoBreak } from '@/utils/salary';

interface ShiftFormProps {
  initialDate?: string;
  shift?: Shift | null;
  settings: Settings | null;
  currentHourlyRate: number;
  onSubmit: (input: ShiftInput) => Promise<void>;
  onCancel: () => void;
}

export function ShiftForm({
  initialDate,
  shift,
  settings,
  currentHourlyRate,
  onSubmit,
  onCancel,
}: ShiftFormProps) {
  const theme = useTheme();
  const [date, setDate] = useState(
    shift?.date ?? initialDate ?? format(new Date(), 'yyyy-MM-dd')
  );
  const [startTime, setStartTime] = useState(shift?.startTime ?? '09:00');
  const [endTime, setEndTime] = useState(shift?.endTime ?? '17:00');
  const [breakMinutes, setBreakMinutes] = useState(shift?.breakMinutes ?? 0);
  const [breakMode, setBreakMode] = useState<'auto' | 'manual'>(
    shift?.breakMinutes ? 'manual' : 'auto'
  );
  const [note, setNote] = useState(shift?.note ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Auto-calculate break time when mode is auto
  useEffect(() => {
    if (breakMode === 'auto' && settings) {
      const autoBreak = calculateAutoBreak(startTime, endTime, settings.defaultBreakRules);
      setBreakMinutes(autoBreak);
    }
  }, [breakMode, startTime, endTime, settings]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        date,
        startTime,
        endTime,
        breakMinutes,
        note: note.trim() || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateChange = (_: unknown, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(format(selectedDate, 'yyyy-MM-dd'));
    }
  };

  const handleStartTimeChange = (_: unknown, selectedTime?: Date) => {
    setShowStartTimePicker(false);
    if (selectedTime) {
      setStartTime(format(selectedTime, 'HH:mm'));
    }
  };

  const handleEndTimeChange = (_: unknown, selectedTime?: Date) => {
    setShowEndTimePicker(false);
    if (selectedTime) {
      setEndTime(format(selectedTime, 'HH:mm'));
    }
  };

  const parsedDate = parse(date, 'yyyy-MM-dd', new Date());
  const parsedStartTime = parse(startTime, 'HH:mm', new Date());
  const parsedEndTime = parse(endTime, 'HH:mm', new Date());

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="titleLarge" style={styles.title}>
          {shift ? 'シフトを編集' : 'シフトを追加'}
        </Text>

        {currentHourlyRate > 0 && (
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16 }}>
            現在の時給: ¥{currentHourlyRate.toLocaleString()}
          </Text>
        )}

        {/* Date Picker */}
        <View style={styles.fieldContainer}>
          <Text variant="labelLarge">日付</Text>
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
        </View>

        {/* Start Time Picker */}
        <View style={styles.fieldContainer}>
          <Text variant="labelLarge">開始時刻</Text>
          <Button
            mode="outlined"
            onPress={() => setShowStartTimePicker(true)}
            style={styles.pickerButton}
          >
            {startTime}
          </Button>
          {showStartTimePicker && (
            <DateTimePicker
              value={parsedStartTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleStartTimeChange}
              is24Hour={true}
            />
          )}
        </View>

        {/* End Time Picker */}
        <View style={styles.fieldContainer}>
          <Text variant="labelLarge">終了時刻</Text>
          <Button
            mode="outlined"
            onPress={() => setShowEndTimePicker(true)}
            style={styles.pickerButton}
          >
            {endTime}
          </Button>
          {showEndTimePicker && (
            <DateTimePicker
              value={parsedEndTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleEndTimeChange}
              is24Hour={true}
            />
          )}
        </View>

        {/* Break Time */}
        <View style={styles.fieldContainer}>
          <Text variant="labelLarge">休憩時間</Text>
          <SegmentedButtons
            value={breakMode}
            onValueChange={(value) => setBreakMode(value as 'auto' | 'manual')}
            buttons={[
              { value: 'auto', label: '自動' },
              { value: 'manual', label: '手動' },
            ]}
            style={styles.segmentedButtons}
          />
          {breakMode === 'manual' ? (
            <TextInput
              mode="outlined"
              value={breakMinutes.toString()}
              onChangeText={(text) => setBreakMinutes(parseInt(text, 10) || 0)}
              keyboardType="number-pad"
              right={<TextInput.Affix text="分" />}
              style={styles.breakInput}
            />
          ) : (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {breakMinutes}分（自動計算）
            </Text>
          )}
        </View>

        {/* Note */}
        <View style={styles.fieldContainer}>
          <Text variant="labelLarge">メモ（任意）</Text>
          <TextInput
            mode="outlined"
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
            placeholder="メモを入力..."
          />
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
          disabled={isSubmitting}
          style={styles.button}
        >
          {shift ? '更新' : '追加'}
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
  pickerButton: {
    alignSelf: 'flex-start',
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  breakInput: {
    width: 120,
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

