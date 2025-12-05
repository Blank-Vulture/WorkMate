/**
 * Task database operations
 */

import * as Crypto from 'expo-crypto';
import { getDatabase } from './database';
import type { Task, TaskInput, TaskFilter, TaskStatus, TaskPriority } from '@/types';
import { createTaskActivity } from './taskActivities';

export async function createTask(input: TaskInput): Promise<Task> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const id = Crypto.randomUUID();

  await db.runAsync(
    `INSERT INTO tasks (id, title, description, status, priority, due_date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.title,
      input.description ?? null,
      input.status ?? 'todo',
      input.priority ?? 'medium',
      input.dueDate ?? null,
      now,
      now,
    ]
  );

  const task: Task = {
    id,
    title: input.title,
    description: input.description ?? null,
    status: input.status ?? 'todo',
    priority: input.priority ?? 'medium',
    dueDate: input.dueDate ?? null,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  };

  // Create activity for task creation
  await createTaskActivity({
    taskId: id,
    type: 'created',
    content: `タスク「${input.title}」を作成しました`,
  });

  return task;
}

export async function updateTask(
  id: string,
  input: Partial<TaskInput>
): Promise<Task | null> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const existing = await getTaskById(id);
  if (!existing) {
    return null;
  }

  // Track status change
  if (input.status && input.status !== existing.status) {
    await createTaskActivity({
      taskId: id,
      type: 'status_change',
      content: `ステータスを「${getStatusLabel(existing.status)}」から「${getStatusLabel(input.status)}」に変更しました`,
      previousValue: existing.status,
      newValue: input.status,
    });
  }

  // Track priority change
  if (input.priority && input.priority !== existing.priority) {
    await createTaskActivity({
      taskId: id,
      type: 'priority_change',
      content: `優先度を「${getPriorityLabel(existing.priority)}」から「${getPriorityLabel(input.priority)}」に変更しました`,
      previousValue: existing.priority,
      newValue: input.priority,
    });
  }

  const completedAt = input.status === 'done' && existing.status !== 'done'
    ? now
    : input.status !== 'done'
      ? null
      : existing.completedAt;

  const updated: Task = {
    ...existing,
    title: input.title ?? existing.title,
    description: input.description !== undefined ? (input.description ?? null) : existing.description,
    status: input.status ?? existing.status,
    priority: input.priority ?? existing.priority,
    dueDate: input.dueDate !== undefined ? (input.dueDate ?? null) : existing.dueDate,
    updatedAt: now,
    completedAt,
  };

  await db.runAsync(
    `UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?, due_date = ?, updated_at = ?, completed_at = ?
     WHERE id = ?`,
    [
      updated.title,
      updated.description,
      updated.status,
      updated.priority,
      updated.dueDate,
      updated.updatedAt,
      updated.completedAt,
      id,
    ]
  );

  return updated;
}

export async function deleteTask(id: string): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.runAsync('DELETE FROM tasks WHERE id = ?', [id]);
  return result.changes > 0;
}

export async function getTaskById(id: string): Promise<Task | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    due_date: string | null;
    created_at: string;
    updated_at: string;
    completed_at: string | null;
  }>('SELECT * FROM tasks WHERE id = ?', [id]);

  if (!row) {
    return null;
  }

  return mapRowToTask(row);
}

export async function getAllTasks(filter?: TaskFilter): Promise<Task[]> {
  const db = await getDatabase();

  let query = 'SELECT * FROM tasks WHERE 1=1';
  const params: (string | number)[] = [];

  if (filter?.status && filter.status.length > 0) {
    query += ` AND status IN (${filter.status.map(() => '?').join(',')})`;
    params.push(...filter.status);
  }

  if (filter?.priority && filter.priority.length > 0) {
    query += ` AND priority IN (${filter.priority.map(() => '?').join(',')})`;
    params.push(...filter.priority);
  }

  if (filter?.search) {
    query += ' AND (title LIKE ? OR description LIKE ?)';
    const searchPattern = `%${filter.search}%`;
    params.push(searchPattern, searchPattern);
  }

  query += ' ORDER BY CASE status WHEN "in_progress" THEN 1 WHEN "todo" THEN 2 WHEN "on_hold" THEN 3 WHEN "done" THEN 4 END, CASE priority WHEN "high" THEN 1 WHEN "medium" THEN 2 WHEN "low" THEN 3 END, created_at DESC';

  const rows = await db.getAllAsync<{
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    due_date: string | null;
    created_at: string;
    updated_at: string;
    completed_at: string | null;
  }>(query, params);

  return rows.map(mapRowToTask);
}

export async function getRecentTasks(limit: number = 5): Promise<Task[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<{
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    due_date: string | null;
    created_at: string;
    updated_at: string;
    completed_at: string | null;
  }>(
    `SELECT * FROM tasks 
     WHERE status != 'done' 
     ORDER BY CASE status WHEN 'in_progress' THEN 1 WHEN 'todo' THEN 2 WHEN 'on_hold' THEN 3 END, 
              CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END
     LIMIT ?`,
    [limit]
  );

  return rows.map(mapRowToTask);
}

export async function getTaskStats(): Promise<{ todo: number; inProgress: number; done: number; onHold: number }> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<{ status: TaskStatus; count: number }>(
    `SELECT status, COUNT(*) as count FROM tasks GROUP BY status`
  );

  const stats = { todo: 0, inProgress: 0, done: 0, onHold: 0 };

  for (const row of rows) {
    switch (row.status) {
      case 'todo':
        stats.todo = row.count;
        break;
      case 'in_progress':
        stats.inProgress = row.count;
        break;
      case 'done':
        stats.done = row.count;
        break;
      case 'on_hold':
        stats.onHold = row.count;
        break;
    }
  }

  return stats;
}

function mapRowToTask(row: {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  };
}

function getStatusLabel(status: TaskStatus): string {
  switch (status) {
    case 'todo':
      return '未着手';
    case 'in_progress':
      return '進行中';
    case 'done':
      return '完了';
    case 'on_hold':
      return '保留';
  }
}

function getPriorityLabel(priority: TaskPriority): string {
  switch (priority) {
    case 'high':
      return '高';
    case 'medium':
      return '中';
    case 'low':
      return '低';
  }
}

