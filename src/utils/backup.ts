/**
 * Data backup and restore utilities
 */

import { Paths, File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';
import { getDatabase } from '@/db';

export interface BackupData {
  version: number;
  exportedAt: string;
  shifts: unknown[];
  hourlyRates: unknown[];
  tasks: unknown[];
  taskActivities: unknown[];
  settings: unknown;
}

const BACKUP_VERSION = 1;

/**
 * Export all data to JSON
 */
export async function exportData(): Promise<BackupData> {
  const db = await getDatabase();
  
  const shifts = await db.getAllAsync('SELECT * FROM shifts');
  const hourlyRates = await db.getAllAsync('SELECT * FROM hourly_rate_history');
  const tasks = await db.getAllAsync('SELECT * FROM tasks');
  const taskActivities = await db.getAllAsync('SELECT * FROM task_activities');
  const settings = await db.getFirstAsync('SELECT * FROM settings WHERE id = 1');
  
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    shifts,
    hourlyRates,
    tasks,
    taskActivities,
    settings,
  };
}

/**
 * Import data from JSON backup
 */
export async function importData(data: BackupData): Promise<{ success: boolean; error?: string }> {
  if (data.version !== BACKUP_VERSION) {
    return { success: false, error: `未対応のバックアップバージョンです: ${data.version}` };
  }
  
  const db = await getDatabase();
  
  try {
    await db.execAsync('BEGIN TRANSACTION;');
    
    // Clear existing data
    await db.execAsync('DELETE FROM task_activities;');
    await db.execAsync('DELETE FROM tasks;');
    await db.execAsync('DELETE FROM shifts;');
    await db.execAsync('DELETE FROM hourly_rate_history;');
    
    // Import shifts
    for (const shift of data.shifts as Record<string, unknown>[]) {
      await db.runAsync(
        `INSERT INTO shifts (id, date, start_time, end_time, break_minutes, hourly_rate, note, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          shift.id as string,
          shift.date as string,
          shift.start_time as string,
          shift.end_time as string,
          shift.break_minutes as number,
          shift.hourly_rate as number,
          shift.note as string | null,
          shift.created_at as string,
          shift.updated_at as string,
        ]
      );
    }
    
    // Import hourly rates
    for (const rate of data.hourlyRates as Record<string, unknown>[]) {
      await db.runAsync(
        `INSERT INTO hourly_rate_history (id, rate, effective_from, created_at)
         VALUES (?, ?, ?, ?)`,
        [
          rate.id as string,
          rate.rate as number,
          rate.effective_from as string,
          rate.created_at as string,
        ]
      );
    }
    
    // Import tasks
    for (const task of data.tasks as Record<string, unknown>[]) {
      await db.runAsync(
        `INSERT INTO tasks (id, title, description, status, priority, due_date, created_at, updated_at, completed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          task.id as string,
          task.title as string,
          task.description as string | null,
          task.status as string,
          task.priority as string,
          task.due_date as string | null,
          task.created_at as string,
          task.updated_at as string,
          task.completed_at as string | null,
        ]
      );
    }
    
    // Import task activities
    for (const activity of data.taskActivities as Record<string, unknown>[]) {
      await db.runAsync(
        `INSERT INTO task_activities (id, task_id, type, content, previous_value, new_value, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          activity.id as string,
          activity.task_id as string,
          activity.type as string,
          activity.content as string,
          activity.previous_value as string | null,
          activity.new_value as string | null,
          activity.created_at as string,
        ]
      );
    }
    
    // Import settings
    if (data.settings) {
      const settings = data.settings as Record<string, unknown>;
      await db.runAsync(
        `UPDATE settings SET 
          default_break_rules = ?,
          transportation_cost = ?,
          night_shift_multiplier = ?,
          night_shift_start = ?,
          night_shift_end = ?
         WHERE id = 1`,
        [
          settings.default_break_rules as string,
          settings.transportation_cost as number,
          settings.night_shift_multiplier as number,
          settings.night_shift_start as string,
          settings.night_shift_end as string,
        ]
      );
    }
    
    await db.execAsync('COMMIT;');
    return { success: true };
  } catch (error) {
    await db.execAsync('ROLLBACK;');
    return { success: false, error: error instanceof Error ? error.message : '不明なエラー' };
  }
}

/**
 * Save backup to file and share
 */
export async function saveAndShareBackup(): Promise<{ success: boolean; error?: string }> {
  try {
    const data = await exportData();
    const json = JSON.stringify(data, null, 2);
    const filename = `workmate-backup-${format(new Date(), 'yyyyMMdd-HHmmss')}.json`;
    const file = new File(Paths.cache, filename);
    
    await file.write(json);
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/json',
        dialogTitle: 'バックアップファイルを保存',
      });
      return { success: true };
    } else {
      return { success: false, error: '共有機能が利用できません' };
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : '不明なエラー' };
  }
}
