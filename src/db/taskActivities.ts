/**
 * Task activity database operations
 */

import * as Crypto from 'expo-crypto';
import { getDatabase } from './database';
import type { TaskActivity, TaskActivityInput } from '@/types';

export async function createTaskActivity(input: TaskActivityInput): Promise<TaskActivity> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const id = Crypto.randomUUID();

  await db.runAsync(
    `INSERT INTO task_activities (id, task_id, type, content, previous_value, new_value, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.taskId,
      input.type,
      input.content,
      input.previousValue ?? null,
      input.newValue ?? null,
      now,
    ]
  );

  return {
    id,
    taskId: input.taskId,
    type: input.type,
    content: input.content,
    previousValue: input.previousValue ?? null,
    newValue: input.newValue ?? null,
    createdAt: now,
  };
}

export async function getActivitiesByTaskId(taskId: string): Promise<TaskActivity[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<{
    id: string;
    task_id: string;
    type: TaskActivity['type'];
    content: string;
    previous_value: string | null;
    new_value: string | null;
    created_at: string;
  }>(
    'SELECT * FROM task_activities WHERE task_id = ? ORDER BY created_at DESC',
    [taskId]
  );

  return rows.map(mapRowToTaskActivity);
}

export async function deleteActivitiesByTaskId(taskId: string): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.runAsync('DELETE FROM task_activities WHERE task_id = ?', [taskId]);
  return result.changes > 0;
}

export async function addComment(taskId: string, content: string): Promise<TaskActivity> {
  return createTaskActivity({
    taskId,
    type: 'comment',
    content,
  });
}

function mapRowToTaskActivity(row: {
  id: string;
  task_id: string;
  type: TaskActivity['type'];
  content: string;
  previous_value: string | null;
  new_value: string | null;
  created_at: string;
}): TaskActivity {
  return {
    id: row.id,
    taskId: row.task_id,
    type: row.type,
    content: row.content,
    previousValue: row.previous_value,
    newValue: row.new_value,
    createdAt: row.created_at,
  };
}

