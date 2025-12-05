/**
 * Hourly rate history database operations
 */

import * as Crypto from 'expo-crypto';
import { getDatabase } from './database';
import type { HourlyRateHistory, HourlyRateInput } from '@/types';

export async function createHourlyRate(input: HourlyRateInput): Promise<HourlyRateHistory> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const id = Crypto.randomUUID();

  await db.runAsync(
    `INSERT INTO hourly_rate_history (id, rate, effective_from, created_at)
     VALUES (?, ?, ?, ?)`,
    [id, input.rate, input.effectiveFrom, now]
  );

  await syncShiftsHourlyRate(db);

  return {
    id,
    rate: input.rate,
    effectiveFrom: input.effectiveFrom,
    createdAt: now,
  };
}

export async function updateHourlyRate(id: string, input: Partial<HourlyRateInput>): Promise<HourlyRateHistory | null> {
  const db = await getDatabase();

  const existing = await getHourlyRateById(id);
  if (!existing) {
    return null;
  }

  const updated = {
    ...existing,
    ...input,
  };

  await db.runAsync(
    `UPDATE hourly_rate_history SET rate = ?, effective_from = ? WHERE id = ?`,
    [updated.rate, updated.effectiveFrom, id]
  );

  await syncShiftsHourlyRate(db);

  return updated;
}

export async function deleteHourlyRate(id: string): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.runAsync('DELETE FROM hourly_rate_history WHERE id = ?', [id]);
  await syncShiftsHourlyRate(db);
  return result.changes > 0;
}

export async function getHourlyRateById(id: string): Promise<HourlyRateHistory | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    id: string;
    rate: number;
    effective_from: string;
    created_at: string;
  }>('SELECT * FROM hourly_rate_history WHERE id = ?', [id]);

  if (!row) {
    return null;
  }

  return mapRowToHourlyRate(row);
}

export async function getAllHourlyRates(): Promise<HourlyRateHistory[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<{
    id: string;
    rate: number;
    effective_from: string;
    created_at: string;
  }>('SELECT * FROM hourly_rate_history ORDER BY effective_from DESC');

  return rows.map(mapRowToHourlyRate);
}

export async function getCurrentHourlyRate(date?: string): Promise<number> {
  const db = await getDatabase();
  const targetDate = date ?? new Date().toISOString().split('T')[0];

  const row = await db.getFirstAsync<{ rate: number }>(
    `SELECT rate FROM hourly_rate_history 
     WHERE effective_from <= ? 
     ORDER BY effective_from DESC 
     LIMIT 1`,
    [targetDate]
  );

  return row?.rate ?? 0;
}

export async function getHourlyRateForDate(date: string): Promise<HourlyRateHistory | null> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<{
    id: string;
    rate: number;
    effective_from: string;
    created_at: string;
  }>(
    `SELECT * FROM hourly_rate_history 
     WHERE effective_from <= ? 
     ORDER BY effective_from DESC 
     LIMIT 1`,
    [date]
  );

  if (!row) {
    return null;
  }

  return mapRowToHourlyRate(row);
}

function mapRowToHourlyRate(row: {
  id: string;
  rate: number;
  effective_from: string;
  created_at: string;
}): HourlyRateHistory {
  return {
    id: row.id,
    rate: row.rate,
    effectiveFrom: row.effective_from,
    createdAt: row.created_at,
  };
}

/**
 * Synchronize hourly rates for all shifts based on current history
 */
async function syncShiftsHourlyRate(db: any): Promise<void> {
  await db.runAsync(
    `UPDATE shifts
     SET hourly_rate = COALESCE((
       SELECT rate
       FROM hourly_rate_history
       WHERE effective_from <= shifts.date
       ORDER BY effective_from DESC
       LIMIT 1
     ), 0)`
  );
}

