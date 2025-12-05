/**
 * WorkMate - Type Definitions
 */

// Shift Types
export interface Shift {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  breakMinutes: number;
  hourlyRate: number; // The hourly rate at the time of this shift
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftInput {
  date: string;
  startTime: string;
  endTime: string;
  breakMinutes?: number;
  note?: string;
}

// Hourly Rate History
export interface HourlyRateHistory {
  id: string;
  rate: number;
  effectiveFrom: string; // YYYY-MM-DD
  createdAt: string;
}

export interface HourlyRateInput {
  rate: number;
  effectiveFrom: string;
}

// Task Types
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'on_hold';
export type TaskPriority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface TaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
}

// Task Activity Types
export type TaskActivityType = 'comment' | 'status_change' | 'priority_change' | 'created' | 'updated';

export interface TaskActivity {
  id: string;
  taskId: string;
  type: TaskActivityType;
  content: string;
  previousValue: string | null;
  newValue: string | null;
  createdAt: string;
}

export interface TaskActivityInput {
  taskId: string;
  type: TaskActivityType;
  content: string;
  previousValue?: string;
  newValue?: string;
}

// Break Rule Types
export interface BreakRule {
  minHours: number; // If working hours exceed this
  breakMinutes: number; // Apply this break duration
}

// Settings Types
export interface Settings {
  id: number;
  defaultBreakRules: BreakRule[];
  transportationCost: number; // Monthly transportation cost (non-taxable)
  nightShiftMultiplier: number; // Default: 1.25 for 22:00-05:00
  nightShiftStart: string; // HH:mm format, default "22:00"
  nightShiftEnd: string; // HH:mm format, default "05:00"
  standardShiftStart: string; // HH:mm format, default "09:00"
  standardShiftEnd: string; // HH:mm format, default "18:00"
  standardShiftBreak: number; // minutes, default 60
}

// Income Calculation Types
export interface MonthlyIncome {
  year: number;
  month: number;
  totalHours: number;
  regularHours: number;
  nightHours: number;
  grossIncome: number;
  transportationCost: number;
  shiftCount: number;
}

export interface YearlyIncomeStats {
  year: number;
  totalGrossIncome: number;
  totalTransportationCost: number;
  totalHours: number;
  remainingTo103Man: number; // Remaining amount until 103万円
  projectedYearEndIncome: number;
  isOver103Man: boolean;
  willExceed103Man: boolean;
  monthlyBreakdown: MonthlyIncome[];
}

// Tax Related
export const TAX_THRESHOLD = 1030000; // 103万円
export const BASIC_DEDUCTION = 480000; // 基礎控除 48万円
export const EMPLOYMENT_INCOME_DEDUCTION = 550000; // 給与所得控除 55万円

// Calendar Export
export interface CalendarEvent {
  uid: string;
  summary: string;
  dtstart: string;
  dtend: string;
  description?: string;
}

// UI Types
export interface TabItem {
  name: string;
  icon: string;
  label: string;
}

// Filter Types
export interface TaskFilter {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  search?: string;
}

