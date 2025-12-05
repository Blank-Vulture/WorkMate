/**
 * Hourly rate store using Zustand
 */

import { create } from 'zustand';
import type { HourlyRateHistory, HourlyRateInput } from '@/types';
import * as db from '@/db';

interface HourlyRateState {
  rates: HourlyRateHistory[];
  currentRate: number;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadRates: () => Promise<void>;
  createRate: (input: HourlyRateInput) => Promise<HourlyRateHistory>;
  updateRate: (id: string, input: Partial<HourlyRateInput>) => Promise<HourlyRateHistory | null>;
  deleteRate: (id: string) => Promise<boolean>;
  getCurrentRate: (date?: string) => Promise<number>;
}

export const useHourlyRateStore = create<HourlyRateState>((set, get) => ({
  rates: [],
  currentRate: 0,
  isLoading: false,
  error: null,
  
  loadRates: async () => {
    set({ isLoading: true, error: null });
    try {
      const rates = await db.getAllHourlyRates();
      const currentRate = await db.getCurrentHourlyRate();
      set({ rates, currentRate, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '時給データの読み込みに失敗しました',
        isLoading: false 
      });
    }
  },
  
  createRate: async (input: HourlyRateInput) => {
    set({ isLoading: true, error: null });
    try {
      const rate = await db.createHourlyRate(input);
      await get().loadRates();
      set({ isLoading: false });
      return rate;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '時給の登録に失敗しました',
        isLoading: false 
      });
      throw error;
    }
  },
  
  updateRate: async (id: string, input: Partial<HourlyRateInput>) => {
    set({ isLoading: true, error: null });
    try {
      const rate = await db.updateHourlyRate(id, input);
      if (rate) {
        await get().loadRates();
      }
      set({ isLoading: false });
      return rate;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '時給の更新に失敗しました',
        isLoading: false 
      });
      throw error;
    }
  },
  
  deleteRate: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const success = await db.deleteHourlyRate(id);
      if (success) {
        await get().loadRates();
      }
      set({ isLoading: false });
      return success;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '時給の削除に失敗しました',
        isLoading: false 
      });
      throw error;
    }
  },
  
  getCurrentRate: async (date?: string) => {
    try {
      return await db.getCurrentHourlyRate(date);
    } catch (error) {
      return 0;
    }
  },
}));

