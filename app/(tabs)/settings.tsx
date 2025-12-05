/**
 * Settings Screen - App configuration
 */

import React, { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { Text, useTheme, List, Divider, TextInput, Button, Portal, Modal, IconButton } from 'react-native-paper';
import { useFocusEffect } from 'expo-router';
import { format } from 'date-fns';
import { Card } from '@/components/ui';
import { useSettingsStore, useHourlyRateStore, useShiftStore } from '@/stores';
import { saveAndShareBackup, generateShiftsICS } from '@/utils';
import { Paths, File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { HourlyRateHistory } from '@/types';

export default function SettingsScreen() {
  const theme = useTheme();
  const [showHourlyRateForm, setShowHourlyRateForm] = useState(false);
  const [newRate, setNewRate] = useState('');
  const [newRateDate, setNewRateDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [editingRate, setEditingRate] = useState<HourlyRateHistory | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const { settings, loadSettings, updateSettings } = useSettingsStore();
  const { rates, currentRate, loadRates, createRate, updateRate, deleteRate } = useHourlyRateStore();
  const { loadShiftsByYear } = useShiftStore();

  useFocusEffect(
    useCallback(() => {
      loadSettings();
      loadRates();
    }, [loadSettings, loadRates])
  );

  const handleAddHourlyRate = async () => {
    const rate = parseInt(newRate, 10);
    if (isNaN(rate) || rate <= 0) {
      Alert.alert('エラー', '正しい時給を入力してください');
      return;
    }

    if (editingRate) {
      await updateRate(editingRate.id, { rate, effectiveFrom: newRateDate });
    } else {
      await createRate({ rate, effectiveFrom: newRateDate });
    }

    setShowHourlyRateForm(false);
    setNewRate('');
    setEditingRate(null);
  };

  const handleDeleteRate = (id: string) => {
    Alert.alert(
      '時給を削除',
      'この時給設定を削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '削除', style: 'destructive', onPress: () => deleteRate(id) },
      ]
    );
  };

  const handleExportBackup = async () => {
    setIsExporting(true);
    const result = await saveAndShareBackup();
    setIsExporting(false);

    if (!result.success) {
      Alert.alert('エラー', result.error ?? 'バックアップの作成に失敗しました');
    }
  };

  const handleExportCalendar = async () => {
    setIsExporting(true);
    try {
      const year = new Date().getFullYear();
      const shifts = await loadShiftsByYear(year);

      if (shifts.length === 0) {
        Alert.alert('エラー', '今年のシフトデータがありません');
        setIsExporting(false);
        return;
      }

      const icsContent = generateShiftsICS(shifts);
      const filename = `workmate-shifts-${year}.ics`;
      const file = new File(Paths.cache, filename);

      await file.write(icsContent);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'text/calendar',
          dialogTitle: 'シフトをカレンダーにエクスポート',
        });
      }
    } catch (error) {
      Alert.alert('エラー', 'カレンダーエクスポートに失敗しました');
    }
    setIsExporting(false);
  };

  const handleUpdateTransportation = (value: string) => {
    const cost = parseInt(value, 10);
    if (!isNaN(cost) && cost >= 0) {
      updateSettings({ transportationCost: cost });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Hourly Rate Section */}
        <Card>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium">時給設定</Text>
            <IconButton
              icon="plus"
              size={20}
              onPress={() => {
                setEditingRate(null);
                setNewRate('');
                setNewRateDate(format(new Date(), 'yyyy-MM-dd'));
                setShowHourlyRateForm(true);
              }}
            />
          </View>

          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12 }}>
            時給が変更された場合は、変更日を指定して追加してください。
          </Text>

          {currentRate > 0 && (
            <View style={styles.currentRate}>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                現在の時給
              </Text>
              <Text variant="headlineMedium">¥{currentRate.toLocaleString()}</Text>
            </View>
          )}

          <Divider style={styles.divider} />

          <Text variant="labelLarge" style={{ marginBottom: 8 }}>時給履歴</Text>
          {rates.length > 0 ? (
            rates.map((rate) => (
              <List.Item
                key={rate.id}
                title={`¥${rate.rate.toLocaleString()}`}
                description={`${rate.effectiveFrom} から適用`}
                right={() => (
                  <View style={styles.rateActions}>
                    <IconButton
                      icon="pencil"
                      size={16}
                      onPress={() => {
                        setEditingRate(rate);
                        setNewRate(rate.rate.toString());
                        setNewRateDate(rate.effectiveFrom);
                        setShowHourlyRateForm(true);
                      }}
                    />
                    <IconButton
                      icon="delete"
                      size={16}
                      onPress={() => handleDeleteRate(rate.id)}
                    />
                  </View>
                )}
              />
            ))
          ) : (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              時給が設定されていません
            </Text>
          )}
        </Card>

        {/* Transportation Cost */}
        <Card>
          <Text variant="titleMedium" style={styles.sectionTitle}>交通費（月額）</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12 }}>
            交通費は非課税のため、103万円の計算には含まれません
          </Text>
          <TextInput
            mode="outlined"
            value={settings?.transportationCost?.toString() ?? '0'}
            onChangeText={handleUpdateTransportation}
            keyboardType="number-pad"
            left={<TextInput.Affix text="¥" />}
            right={<TextInput.Affix text="/月" />}
          />
        </Card>

        {/* Break Rules */}
        <Card>
          <Text variant="titleMedium" style={styles.sectionTitle}>休憩時間の自動計算</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
            労働基準法に基づく休憩時間の自動計算ルール
          </Text>
          {settings?.defaultBreakRules.map((rule, index) => (
            <Text key={index} variant="bodyMedium" style={styles.ruleText}>
              • {rule.minHours}時間以上 → {rule.breakMinutes}分休憩
            </Text>
          ))}
        </Card>



        {/* Standard Shift Settings */}
        <Card>
          <Text variant="titleMedium" style={styles.sectionTitle}>平常勤務時刻</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12 }}>
            一括入力で使用する標準的な勤務時間です
          </Text>

          <View style={styles.row}>
            <TextInput
              mode="outlined"
              label="開始"
              value={settings?.standardShiftStart ?? '09:00'}
              onChangeText={(text) => updateSettings({ standardShiftStart: text })}
              style={[styles.input, { flex: 1, marginRight: 8 }]}
              placeholder="09:00"
            />
            <TextInput
              mode="outlined"
              label="終了"
              value={settings?.standardShiftEnd ?? '18:00'}
              onChangeText={(text) => updateSettings({ standardShiftEnd: text })}
              style={[styles.input, { flex: 1, marginLeft: 8 }]}
              placeholder="18:00"
            />
          </View>

          <TextInput
            mode="outlined"
            label="休憩時間（分）"
            value={settings?.standardShiftBreak?.toString() ?? '60'}
            onChangeText={(text) => {
              const val = parseInt(text, 10);
              if (!isNaN(val)) updateSettings({ standardShiftBreak: val });
            }}
            keyboardType="number-pad"
            style={styles.input}
            right={<TextInput.Affix text="分" />}
          />
        </Card>

        {/* Night Shift Settings */}
        <Card>
          <Text variant="titleMedium" style={styles.sectionTitle}>深夜手当</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
            深夜時間帯（{settings?.nightShiftStart} 〜 {settings?.nightShiftEnd}）は
            {settings?.nightShiftMultiplier}倍で計算されます
          </Text>
        </Card>

        {/* Export Section */}
        <Card>
          <Text variant="titleMedium" style={styles.sectionTitle}>データ管理</Text>

          <Button
            mode="outlined"
            icon="download"
            onPress={handleExportBackup}
            loading={isExporting}
            style={styles.exportButton}
          >
            データをバックアップ（JSON）
          </Button>

          <Button
            mode="outlined"
            icon="calendar-export"
            onPress={handleExportCalendar}
            loading={isExporting}
            style={styles.exportButton}
          >
            シフトをカレンダーにエクスポート
          </Button>
        </Card>

        {/* App Info */}
        <Card>
          <Text variant="titleMedium" style={styles.sectionTitle}>アプリ情報</Text>
          <Text variant="bodyMedium">WorkMate v1.0.0</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            勤怠管理・タスク追跡アプリ
          </Text>
        </Card>
      </ScrollView>

      {/* Hourly Rate Form Modal */}
      <Portal>
        <Modal
          visible={showHourlyRateForm}
          onDismiss={() => setShowHourlyRateForm(false)}
          contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            {editingRate ? '時給を編集' : '時給を追加'}
          </Text>

          <TextInput
            mode="outlined"
            label="時給"
            value={newRate}
            onChangeText={setNewRate}
            keyboardType="number-pad"
            left={<TextInput.Affix text="¥" />}
            style={styles.input}
          />

          <TextInput
            mode="outlined"
            label="適用開始日"
            value={newRateDate}
            onChangeText={setNewRateDate}
            placeholder="YYYY-MM-DD"
            style={styles.input}
          />

          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={() => setShowHourlyRateForm(false)}>
              キャンセル
            </Button>
            <Button mode="contained" onPress={handleAddHourlyRate}>
              {editingRate ? '更新' : '追加'}
            </Button>
          </View>
        </Modal>
      </Portal>
    </View >
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    marginBottom: 8,
  },
  currentRate: {
    paddingVertical: 12,
  },
  divider: {
    marginVertical: 12,
  },
  rateActions: {
    flexDirection: 'row',
  },
  ruleText: {
    marginVertical: 4,
  },
  exportButton: {
    marginTop: 12,
  },
  modalContent: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  modalTitle: {
    marginBottom: 20,
    fontWeight: '600',
  },
  input: {
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
});

