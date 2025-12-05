/**
 * Task store using Zustand
 */

import { create } from 'zustand';
import type { Task, TaskInput, TaskFilter, TaskActivity } from '@/types';
import * as db from '@/db';

interface TaskState {
  tasks: Task[];
  filter: TaskFilter;
  selectedTask: Task | null;
  activities: TaskActivity[];
  isLoading: boolean;
  error: string | null;
  stats: { todo: number; inProgress: number; done: number; onHold: number };
  
  // Actions
  loadTasks: (filter?: TaskFilter) => Promise<void>;
  createTask: (input: TaskInput) => Promise<Task>;
  updateTask: (id: string, input: Partial<TaskInput>) => Promise<Task | null>;
  deleteTask: (id: string) => Promise<boolean>;
  setFilter: (filter: TaskFilter) => void;
  selectTask: (id: string) => Promise<void>;
  clearSelection: () => void;
  loadActivities: (taskId: string) => Promise<void>;
  addComment: (taskId: string, content: string) => Promise<void>;
  getRecentTasks: () => Promise<Task[]>;
  loadStats: () => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  filter: {},
  selectedTask: null,
  activities: [],
  isLoading: false,
  error: null,
  stats: { todo: 0, inProgress: 0, done: 0, onHold: 0 },
  
  loadTasks: async (filter?: TaskFilter) => {
    set({ isLoading: true, error: null });
    try {
      const currentFilter = filter ?? get().filter;
      const tasks = await db.getAllTasks(currentFilter);
      set({ tasks, filter: currentFilter, isLoading: false });
      await get().loadStats();
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'タスクの読み込みに失敗しました',
        isLoading: false 
      });
    }
  },
  
  createTask: async (input: TaskInput) => {
    set({ isLoading: true, error: null });
    try {
      const task = await db.createTask(input);
      await get().loadTasks();
      set({ isLoading: false });
      return task;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'タスクの作成に失敗しました',
        isLoading: false 
      });
      throw error;
    }
  },
  
  updateTask: async (id: string, input: Partial<TaskInput>) => {
    set({ isLoading: true, error: null });
    try {
      const task = await db.updateTask(id, input);
      if (task) {
        await get().loadTasks();
        // Update selected task if it was the one modified
        if (get().selectedTask?.id === id) {
          set({ selectedTask: task });
          await get().loadActivities(id);
        }
      }
      set({ isLoading: false });
      return task;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'タスクの更新に失敗しました',
        isLoading: false 
      });
      throw error;
    }
  },
  
  deleteTask: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const success = await db.deleteTask(id);
      if (success) {
        await get().loadTasks();
        if (get().selectedTask?.id === id) {
          set({ selectedTask: null, activities: [] });
        }
      }
      set({ isLoading: false });
      return success;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'タスクの削除に失敗しました',
        isLoading: false 
      });
      throw error;
    }
  },
  
  setFilter: (filter: TaskFilter) => {
    set({ filter });
    get().loadTasks(filter);
  },
  
  selectTask: async (id: string) => {
    try {
      const task = await db.getTaskById(id);
      if (task) {
        set({ selectedTask: task });
        await get().loadActivities(id);
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'タスクの読み込みに失敗しました' });
    }
  },
  
  clearSelection: () => {
    set({ selectedTask: null, activities: [] });
  },
  
  loadActivities: async (taskId: string) => {
    try {
      const activities = await db.getActivitiesByTaskId(taskId);
      set({ activities });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'アクティビティの読み込みに失敗しました' });
    }
  },
  
  addComment: async (taskId: string, content: string) => {
    try {
      await db.addComment(taskId, content);
      await get().loadActivities(taskId);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'コメントの追加に失敗しました' });
      throw error;
    }
  },
  
  getRecentTasks: async () => {
    try {
      return await db.getRecentTasks(5);
    } catch (error) {
      return [];
    }
  },
  
  loadStats: async () => {
    try {
      const stats = await db.getTaskStats();
      set({ stats });
    } catch (error) {
      // Ignore stats loading errors
    }
  },
}));

