/**
 * Salary calculation utilities
 */

import { differenceInMinutes, parse, isWithinInterval, setHours, setMinutes } from 'date-fns';
import type { Shift, Settings, MonthlyIncome, BreakRule } from '@/types';

/**
 * Parse time string (HH:mm) to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Calculate working hours for a shift (excluding break time)
 */
export function calculateWorkingHours(
  startTime: string,
  endTime: string,
  breakMinutes: number
): number {
  const startMinutes = timeToMinutes(startTime);
  let endMinutes = timeToMinutes(endTime);

  // Handle overnight shifts
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }

  const totalMinutes = endMinutes - startMinutes - breakMinutes;
  return Math.max(0, totalMinutes / 60);
}

/**
 * Calculate night shift hours (between 22:00-05:00)
 */
export function calculateNightHours(
  startTime: string,
  endTime: string,
  breakMinutes: number,
  nightStart: string = '22:00',
  nightEnd: string = '05:00'
): number {
  const startMinutes = timeToMinutes(startTime);
  let endMinutes = timeToMinutes(endTime);
  const nightStartMinutes = timeToMinutes(nightStart);
  const nightEndMinutes = timeToMinutes(nightEnd);

  // Handle overnight shifts
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }

  let nightMinutes = 0;

  // Night period is 22:00-05:00 (next day)
  // First night period: 22:00-24:00 (1320-1440 minutes)
  const nightPeriod1Start = nightStartMinutes; // 22:00 = 1320
  const nightPeriod1End = 24 * 60; // 24:00 = 1440

  // Second night period: 00:00-05:00 (0-300 minutes, or 1440-1740 for overnight)
  const nightPeriod2Start = 0;
  const nightPeriod2End = nightEndMinutes; // 05:00 = 300

  // Calculate overlap with first night period (22:00-24:00)
  if (startMinutes < nightPeriod1End && endMinutes > nightPeriod1Start) {
    const overlapStart = Math.max(startMinutes, nightPeriod1Start);
    const overlapEnd = Math.min(endMinutes, nightPeriod1End);
    nightMinutes += Math.max(0, overlapEnd - overlapStart);
  }

  // Calculate overlap with second night period (00:00-05:00)
  // For overnight shifts, the end time extends past midnight
  if (endMinutes > 24 * 60) {
    // Shift extends past midnight
    const adjustedEndMinutes = endMinutes - 24 * 60;
    if (adjustedEndMinutes > nightPeriod2Start) {
      const overlapEnd = Math.min(adjustedEndMinutes, nightPeriod2End);
      nightMinutes += Math.max(0, overlapEnd - nightPeriod2Start);
    }
  } else if (startMinutes < nightPeriod2End) {
    // Shift starts early morning
    const overlapStart = Math.max(startMinutes, nightPeriod2Start);
    const overlapEnd = Math.min(endMinutes, nightPeriod2End);
    nightMinutes += Math.max(0, overlapEnd - overlapStart);
  }

  // Proportionally reduce night hours by break time
  const totalWorkMinutes = endMinutes - startMinutes;
  if (totalWorkMinutes > 0 && breakMinutes > 0) {
    const breakRatio = breakMinutes / totalWorkMinutes;
    nightMinutes = nightMinutes * (1 - breakRatio);
  }

  return nightMinutes / 60;
}

/**
 * Calculate automatic break time based on rules
 */
export function calculateAutoBreak(
  startTime: string,
  endTime: string,
  breakRules: BreakRule[]
): number {
  const workingHours = calculateWorkingHours(startTime, endTime, 0);

  // Sort rules by minHours descending to apply the highest applicable rule
  const sortedRules = [...breakRules].sort((a, b) => b.minHours - a.minHours);

  for (const rule of sortedRules) {
    if (workingHours >= rule.minHours) {
      return rule.breakMinutes;
    }
  }

  return 0;
}

/**
 * Calculate gross income for a single shift
 */
export function calculateShiftIncome(
  shift: Shift,
  settings: Settings
): { regular: number; night: number; total: number; hours: number; nightHours: number } {
  const hours = calculateWorkingHours(shift.startTime, shift.endTime, shift.breakMinutes);
  const nightHours = calculateNightHours(
    shift.startTime,
    shift.endTime,
    shift.breakMinutes,
    settings.nightShiftStart,
    settings.nightShiftEnd
  );
  const regularHours = hours - nightHours;

  const regular = regularHours * shift.hourlyRate;
  const night = nightHours * shift.hourlyRate * settings.nightShiftMultiplier;
  const total = regular + night;

  return { regular, night, total, hours, nightHours };
}

/**
 * Calculate monthly income from shifts
 */
export function calculateMonthlyIncome(
  shifts: Shift[],
  settings: Settings,
  year: number,
  month: number
): MonthlyIncome {
  let totalHours = 0;
  let regularHours = 0;
  let nightHours = 0;
  let grossIncome = 0;

  for (const shift of shifts) {
    const income = calculateShiftIncome(shift, settings);
    totalHours += income.hours;
    regularHours += income.hours - income.nightHours;
    nightHours += income.nightHours;
    grossIncome += income.total;
  }

  return {
    year,
    month,
    totalHours,
    regularHours,
    nightHours,
    grossIncome,
    transportationCost: settings.transportationCost,
    shiftCount: shifts.length,
  };
}

/**
 * Format currency in Japanese Yen
 */
export function formatCurrency(amount: number): string {
  return `¥${Math.floor(amount).toLocaleString('ja-JP')}`;
}

/**
 * Format hours with one decimal place
 */
export function formatHours(hours: number): string {
  return `${hours.toFixed(1)}時間`;
}

