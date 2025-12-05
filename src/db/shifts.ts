/**
 * Shift database operations
 */

import * as Crypto from 'expo-crypto';
import { getDatabase } from './database';
import type { Shift, ShiftInput } from '@/types';
import { getCurrentHourlyRate } from './hourlyRates';

export async function createShift(input: ShiftInput): Promise<Shift> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const id = Crypto.randomUUID();

  // Get the hourly rate effective on the shift date
  const hourlyRate = await getCurrentHourlyRate(input.date);

  await db.runAsync(
    `INSERT INTO shifts (id, date, start_time, end_time, break_minutes, hourly_rate, note, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.date,
      input.startTime,
      input.endTime,
      input.breakMinutes ?? 0,
      hourlyRate,
      input.note ?? null,
      now,
      now,
    ]
  );

  return {
    id,
    date: input.date,
    startTime: input.startTime,
    endTime: input.endTime,
    breakMinutes: input.breakMinutes ?? 0,
    hourlyRate,
    note: input.note ?? null,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateShift(id: string, input: Partial<ShiftInput>): Promise<Shift | null> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const existing = await getShiftById(id);
  if (!existing) {
    return null;
  }

  // If date changes, we might need to update the hourly rate
  let hourlyRate = existing.hourlyRate;
  if (input.date && input.date !== existing.date) {
    hourlyRate = await getCurrentHourlyRate(input.date);
  }

  const updated = {
    ...existing,
    ...input,
    hourlyRate,
    updatedAt: now,
  };

  await db.runAsync(
    `UPDATE shifts SET date = ?, start_time = ?, end_time = ?, break_minutes = ?, hourly_rate = ?, note = ?, updated_at = ?
     WHERE id = ?`,
    [
      updated.date,
      updated.startTime,
      updated.endTime,
      updated.breakMinutes,
      updated.hourlyRate,
      updated.note,
      updated.updatedAt,
      id,
    ]
  );

  return updated;
}

export async function deleteShift(id: string): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.runAsync('DELETE FROM shifts WHERE id = ?', [id]);
  return result.changes > 0;
}

export async function getShiftById(id: string): Promise<Shift | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    break_minutes: number;
    hourly_rate: number;
    note: string | null;
    created_at: string;
    updated_at: string;
  }>('SELECT * FROM shifts WHERE id = ?', [id]);

  if (!row) {
    return null;
  }

  return mapRowToShift(row);
}

export async function getShiftsByMonth(year: number, month: number): Promise<Shift[]> {
  const db = await getDatabase();
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;

  const rows = await db.getAllAsync<{
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    break_minutes: number;
    hourly_rate: number;
    note: string | null;
    created_at: string;
    updated_at: string;
  }>(
    `SELECT * FROM shifts WHERE substr(date, 1, 7) = ? ORDER BY date ASC, start_time ASC`,
    [monthStr]
  );

  return rows.map(mapRowToShift);
}

export async function getShiftsByYear(year: number): Promise<Shift[]> {
  const db = await getDatabase();
  const yearStr = `${year}`;

  const rows = await db.getAllAsync<{
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    break_minutes: number;
    hourly_rate: number;
    note: string | null;
    created_at: string;
    updated_at: string;
  }>(
    `SELECT * FROM shifts WHERE substr(date, 1, 4) = ? ORDER BY date ASC, start_time ASC`,
    [yearStr]
  );

  return rows.map(mapRowToShift);
}

export async function getShiftsByDateRange(startDate: string, endDate: string): Promise<Shift[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<{
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    break_minutes: number;
    hourly_rate: number;
    note: string | null;
    created_at: string;
    updated_at: string;
  }>(
    `SELECT * FROM shifts WHERE date >= ? AND date <= ? ORDER BY date ASC, start_time ASC`,
    [startDate, endDate]
  );

  return rows.map(mapRowToShift);
}

export async function getRecentShifts(limit: number = 5): Promise<Shift[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<{
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    break_minutes: number;
    hourly_rate: number;
    note: string | null;
    created_at: string;
    updated_at: string;
  }>(
    `SELECT * FROM shifts ORDER BY date DESC, start_time DESC LIMIT ?`,
    [limit]
  );

  return rows.map(mapRowToShift);
}

export async function getShiftByDate(date: string): Promise<Shift | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    break_minutes: number;
    hourly_rate: number;
    note: string | null;
    created_at: string;
    updated_at: string;
  }>('SELECT * FROM shifts WHERE date = ? LIMIT 1', [date]);

  if (!row) {
    return null;
  }

  return mapRowToShift(row);
}

function mapRowToShift(row: {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  hourly_rate: number;
  note: string | null;
  created_at: string;
  updated_at: string;
}): Shift {
  return {
    id: row.id,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    breakMinutes: row.break_minutes,
    hourlyRate: row.hourly_rate,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

