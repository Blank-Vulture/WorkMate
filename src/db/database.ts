/**
 * Database initialization and connection management
 */

import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL, INSERT_DEFAULT_SETTINGS_SQL, INSERT_SCHEMA_VERSION_SQL, SCHEMA_VERSION } from './schema';

const DB_NAME = 'workmate.db';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) {
    return db;
  }

  db = await SQLite.openDatabaseAsync(DB_NAME);
  await initializeDatabase(db);
  return db;
}

async function initializeDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  // Enable foreign keys
  await database.execAsync('PRAGMA foreign_keys = ON;');

  // Create all tables
  await database.execAsync(CREATE_TABLES_SQL);

  // Insert default settings
  await database.execAsync(INSERT_DEFAULT_SETTINGS_SQL);

  // Update schema version
  await database.runAsync(INSERT_SCHEMA_VERSION_SQL, [SCHEMA_VERSION]);

  // Migrations
  try {
    await database.execAsync('ALTER TABLE settings ADD COLUMN standard_shift_start TEXT DEFAULT "09:00";');
  } catch (e) { /* Column likely exists */ }
  try {
    await database.execAsync('ALTER TABLE settings ADD COLUMN standard_shift_end TEXT DEFAULT "18:00";');
  } catch (e) { /* Column likely exists */ }
  try {
    await database.execAsync('ALTER TABLE settings ADD COLUMN standard_shift_break INTEGER DEFAULT 60;');
  } catch (e) { /* Column likely exists */ }

  // Task Migrations
  try {
    await database.execAsync('ALTER TABLE tasks ADD COLUMN description TEXT;');
  } catch (e) { /* Column likely exists */ }
  try {
    await database.execAsync('ALTER TABLE tasks ADD COLUMN status TEXT DEFAULT "todo";');
  } catch (e) { /* Column likely exists */ }
  try {
    await database.execAsync('ALTER TABLE tasks ADD COLUMN priority TEXT DEFAULT "medium";');
  } catch (e) { /* Column likely exists */ }
  try {
    await database.execAsync('ALTER TABLE tasks ADD COLUMN due_date TEXT;');
  } catch (e) { /* Column likely exists */ }
  try {
    await database.execAsync('ALTER TABLE tasks ADD COLUMN completed_at TEXT;');
  } catch (e) { /* Column likely exists */ }
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}

// Helper function for transactions
export async function runTransaction<T>(
  callback: (db: SQLite.SQLiteDatabase) => Promise<T>
): Promise<T> {
  const database = await getDatabase();
  try {
    await database.execAsync('BEGIN TRANSACTION;');
    const result = await callback(database);
    await database.execAsync('COMMIT;');
    return result;
  } catch (error) {
    await database.execAsync('ROLLBACK;');
    throw error;
  }
}

