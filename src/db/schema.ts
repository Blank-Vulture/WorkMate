/**
 * Database Schema Definitions
 */

export const SCHEMA_VERSION = 1;

export const CREATE_TABLES_SQL = `
-- Shifts table
CREATE TABLE IF NOT EXISTS shifts (
  id TEXT PRIMARY KEY NOT NULL,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  break_minutes INTEGER NOT NULL DEFAULT 0,
  hourly_rate REAL NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Hourly rate history table
CREATE TABLE IF NOT EXISTS hourly_rate_history (
  id TEXT PRIMARY KEY NOT NULL,
  rate REAL NOT NULL,
  effective_from TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT
);

-- Task activities table
CREATE TABLE IF NOT EXISTS task_activities (
  id TEXT PRIMARY KEY NOT NULL,
  task_id TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  previous_value TEXT,
  new_value TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Settings table (singleton)
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  default_break_rules TEXT NOT NULL DEFAULT '[]',
  transportation_cost REAL NOT NULL DEFAULT 0,
  night_shift_multiplier REAL NOT NULL DEFAULT 1.25,
  night_shift_start TEXT NOT NULL DEFAULT '22:00',
  night_shift_end TEXT NOT NULL DEFAULT '05:00',
  standard_shift_start TEXT NOT NULL DEFAULT '09:00',
  standard_shift_end TEXT NOT NULL DEFAULT '18:00',
  standard_shift_break INTEGER NOT NULL DEFAULT 60
);

-- Schema version tracking
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shifts_date ON shifts(date);
CREATE INDEX IF NOT EXISTS idx_shifts_year_month ON shifts(substr(date, 1, 7));
CREATE INDEX IF NOT EXISTS idx_hourly_rate_effective_from ON hourly_rate_history(effective_from);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_task_activities_task_id ON task_activities(task_id);
CREATE INDEX IF NOT EXISTS idx_task_activities_created_at ON task_activities(created_at);
`;

export const INSERT_DEFAULT_SETTINGS_SQL = `
INSERT OR IGNORE INTO settings (id, default_break_rules, transportation_cost, night_shift_multiplier, night_shift_start, night_shift_end, standard_shift_start, standard_shift_end, standard_shift_break)
VALUES (1, '[{"minHours": 6, "breakMinutes": 45}, {"minHours": 8, "breakMinutes": 60}]', 0, 1.25, '22:00', '05:00', '09:00', '18:00', 60);
`;

export const INSERT_SCHEMA_VERSION_SQL = `
INSERT OR REPLACE INTO schema_version (version) VALUES (?);
`;

