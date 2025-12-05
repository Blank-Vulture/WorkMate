/**
 * Settings store using Zustand
 */

import { create } from 'zustand';
import type { Settings } from '@/types';
import * as db from '@/db';

interface SettingsState {
  settings: Settings | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadSettings: () => Promise<void>;
  updateSettings: (input: Partial<Omit<Settings, 'id'>>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  isLoading: false,
  error: null,
  
  loadSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const settings = await db.getSettings();
      set({ settings, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '設定の読み込みに失敗しました',
        isLoading: false 
      });
    }
  },
  
  updateSettings: async (input: Partial<Omit<Settings, 'id'>>) => {
    set({ isLoading: true, error: null });
    try {
      const settings = await db.updateSettings(input);
      set({ settings, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '設定の更新に失敗しました',
        isLoading: false 
      });
      throw error;
    }
  },
}));

