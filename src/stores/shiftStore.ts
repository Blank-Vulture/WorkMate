/**
 * Shift store using Zustand
 */

import { create } from 'zustand';
import type { Shift, ShiftInput } from '@/types';
import * as db from '@/db';

interface ShiftState {
  shifts: Shift[];
  selectedMonth: { year: number; month: number };
  isLoading: boolean;
  error: string | null;

  // Actions
  loadShifts: (year: number, month: number) => Promise<void>;
  loadShiftsByYear: (year: number) => Promise<Shift[]>;
  createShift: (input: ShiftInput) => Promise<Shift>;
  updateShift: (id: string, input: Partial<ShiftInput>) => Promise<Shift | null>;
  deleteShift: (id: string) => Promise<boolean>;
  setSelectedMonth: (year: number, month: number) => void;
  getRecentShifts: () => Promise<Shift[]>;
  bulkUpsertShifts: (inputs: { type: 'create' | 'update'; id?: string; data: ShiftInput }[]) => Promise<void>;
}

export const useShiftStore = create<ShiftState>((set, get) => ({
  shifts: [],
  selectedMonth: {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  },
  isLoading: false,
  error: null,

  loadShifts: async (year: number, month: number) => {
    set({ isLoading: true, error: null });
    try {
      const shifts = await db.getShiftsByMonth(year, month);
      set({ shifts, selectedMonth: { year, month }, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'シフトの読み込みに失敗しました',
        isLoading: false
      });
    }
  },

  loadShiftsByYear: async (year: number) => {
    try {
      return await db.getShiftsByYear(year);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'シフトの読み込みに失敗しました' });
      return [];
    }
  },

  createShift: async (input: ShiftInput) => {
    set({ isLoading: true, error: null });
    try {
      const shift = await db.createShift(input);
      const { selectedMonth } = get();

      // Reload if the new shift is in the selected month
      const shiftMonth = parseInt(input.date.split('-')[1], 10);
      const shiftYear = parseInt(input.date.split('-')[0], 10);
      if (shiftYear === selectedMonth.year && shiftMonth === selectedMonth.month) {
        await get().loadShifts(selectedMonth.year, selectedMonth.month);
      }

      set({ isLoading: false });
      return shift;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'シフトの作成に失敗しました',
        isLoading: false
      });
      throw error;
    }
  },

  updateShift: async (id: string, input: Partial<ShiftInput>) => {
    set({ isLoading: true, error: null });
    try {
      const shift = await db.updateShift(id, input);
      if (shift) {
        const { selectedMonth } = get();
        await get().loadShifts(selectedMonth.year, selectedMonth.month);
      }
      set({ isLoading: false });
      return shift;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'シフトの更新に失敗しました',
        isLoading: false
      });
      throw error;
    }
  },

  deleteShift: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const success = await db.deleteShift(id);
      if (success) {
        const { selectedMonth } = get();
        await get().loadShifts(selectedMonth.year, selectedMonth.month);
      }
      set({ isLoading: false });
      return success;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'シフトの削除に失敗しました',
        isLoading: false
      });
      throw error;
    }
  },

  bulkUpsertShifts: async (inputs) => {
    set({ isLoading: true, error: null });
    try {
      // Perform all DB operations
      for (const op of inputs) {
        if (op.type === 'create') {
          await db.createShift(op.data);
        } else if (op.type === 'update' && op.id) {
          await db.updateShift(op.id, op.data);
        }
      }

      // Determine the month to reload based on input dates
      // Use the first input's date to determine the target month
      if (inputs.length > 0) {
        const firstDate = inputs[0].data.date;
        const [year, month] = firstDate.split('-').map(Number);

        // Update selectedMonth to match the input dates and reload
        set({ selectedMonth: { year, month } });
        await get().loadShifts(year, month);
      }

      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '一括登録に失敗しました',
        isLoading: false
      });
      throw error;
    }
  },

  setSelectedMonth: (year: number, month: number) => {
    set({ selectedMonth: { year, month } });
    get().loadShifts(year, month);
  },

  getRecentShifts: async () => {
    try {
      return await db.getRecentShifts(5);
    } catch (error) {
      return [];
    }
  },
}));

