/**
 * Settings database operations
 */

import { getDatabase } from './database';
import type { Settings, BreakRule } from '@/types';

export async function getSettings(): Promise<Settings> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<{
    id: number;
    default_break_rules: string;
    transportation_cost: number;
    night_shift_multiplier: number;
    night_shift_start: string;
    night_shift_end: string;
  }>('SELECT * FROM settings WHERE id = 1');

  if (!row) {
    // Return default settings if not found
    return {
      id: 1,
      defaultBreakRules: [
        { minHours: 6, breakMinutes: 45 },
        { minHours: 8, breakMinutes: 60 },
      ],
      transportationCost: 0,
      nightShiftMultiplier: 1.25,
      nightShiftStart: '22:00',
      nightShiftEnd: '05:00',
      standardShiftStart: '09:00',
      standardShiftEnd: '18:00',
      standardShiftBreak: 60,
    };
  }

  return {
    id: row.id,
    defaultBreakRules: JSON.parse(row.default_break_rules) as BreakRule[],
    transportationCost: row.transportation_cost,
    nightShiftMultiplier: row.night_shift_multiplier,
    nightShiftStart: row.night_shift_start,
    nightShiftEnd: row.night_shift_end,
    standardShiftStart: (row as any).standard_shift_start ?? '09:00',
    standardShiftEnd: (row as any).standard_shift_end ?? '18:00',
    standardShiftBreak: (row as any).standard_shift_break ?? 60,
  };
}

export async function updateSettings(input: Partial<Omit<Settings, 'id'>>): Promise<Settings> {
  const db = await getDatabase();
  const current = await getSettings();

  const updated: Settings = {
    ...current,
    defaultBreakRules: input.defaultBreakRules ?? current.defaultBreakRules,
    transportationCost: input.transportationCost ?? current.transportationCost,
    nightShiftMultiplier: input.nightShiftMultiplier ?? current.nightShiftMultiplier,
    nightShiftStart: input.nightShiftStart ?? current.nightShiftStart,
    nightShiftEnd: input.nightShiftEnd ?? current.nightShiftEnd,
    standardShiftStart: input.standardShiftStart ?? current.standardShiftStart,
    standardShiftEnd: input.standardShiftEnd ?? current.standardShiftEnd,
    standardShiftBreak: input.standardShiftBreak ?? current.standardShiftBreak,
  };

  await db.runAsync(
    `UPDATE settings SET 
      default_break_rules = ?,
      transportation_cost = ?,
      night_shift_multiplier = ?,
      night_shift_start = ?,
      night_shift_end = ?,
      standard_shift_start = ?,
      standard_shift_end = ?,
      standard_shift_break = ?
     WHERE id = 1`,
    [
      JSON.stringify(updated.defaultBreakRules),
      updated.transportationCost,
      updated.nightShiftMultiplier,
      updated.nightShiftStart,
      updated.nightShiftEnd,
      updated.standardShiftStart,
      updated.standardShiftEnd,
      updated.standardShiftBreak,
    ]
  );

  return updated;
}

