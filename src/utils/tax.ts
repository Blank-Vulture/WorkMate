/**
 * Tax calculation utilities
 */

import type { MonthlyIncome, YearlyIncomeStats } from '@/types';
import { TAX_THRESHOLD, BASIC_DEDUCTION, EMPLOYMENT_INCOME_DEDUCTION } from '@/types';

/**
 * Calculate yearly income statistics
 */
export function calculateYearlyStats(
  monthlyIncomes: MonthlyIncome[],
  currentMonth: number
): YearlyIncomeStats {
  const year = monthlyIncomes[0]?.year ?? new Date().getFullYear();
  
  // Calculate totals from actual data
  let totalGrossIncome = 0;
  let totalTransportationCost = 0;
  let totalHours = 0;
  
  for (const income of monthlyIncomes) {
    totalGrossIncome += income.grossIncome;
    totalTransportationCost += income.transportationCost;
    totalHours += income.totalHours;
  }
  
  // Calculate projection for remaining months
  const monthsWithData = monthlyIncomes.filter(m => m.shiftCount > 0).length;
  const averageMonthlyIncome = monthsWithData > 0 
    ? totalGrossIncome / monthsWithData 
    : 0;
  
  const remainingMonths = 12 - currentMonth;
  const projectedYearEndIncome = totalGrossIncome + (averageMonthlyIncome * remainingMonths);
  
  // Calculate remaining to 103万円
  const remainingTo103Man = Math.max(0, TAX_THRESHOLD - totalGrossIncome);
  
  return {
    year,
    totalGrossIncome,
    totalTransportationCost,
    totalHours,
    remainingTo103Man,
    projectedYearEndIncome,
    isOver103Man: totalGrossIncome > TAX_THRESHOLD,
    willExceed103Man: projectedYearEndIncome > TAX_THRESHOLD,
    monthlyBreakdown: monthlyIncomes,
  };
}

/**
 * Calculate how many hours can be worked to stay under 103万円
 */
export function calculateRemainingWorkableHours(
  currentIncome: number,
  hourlyRate: number
): number {
  if (hourlyRate <= 0) return 0;
  const remaining = TAX_THRESHOLD - currentIncome;
  if (remaining <= 0) return 0;
  return remaining / hourlyRate;
}

/**
 * Calculate monthly target to stay under 103万円
 */
export function calculateMonthlyTarget(
  currentIncome: number,
  currentMonth: number
): number {
  const remainingMonths = 12 - currentMonth + 1; // Include current month
  if (remainingMonths <= 0) return 0;
  
  const remaining = TAX_THRESHOLD - currentIncome;
  if (remaining <= 0) return 0;
  
  return remaining / remainingMonths;
}

/**
 * Get tax status message
 */
export function getTaxStatusMessage(stats: YearlyIncomeStats): {
  status: 'safe' | 'warning' | 'danger';
  message: string;
  detail: string;
} {
  if (stats.isOver103Man) {
    return {
      status: 'danger',
      message: '103万円を超過しています',
      detail: `現在の年間収入: ${formatYen(stats.totalGrossIncome)}\n超過額: ${formatYen(stats.totalGrossIncome - TAX_THRESHOLD)}`,
    };
  }
  
  if (stats.willExceed103Man) {
    return {
      status: 'warning',
      message: 'このペースだと103万円を超える見込みです',
      detail: `予測年間収入: ${formatYen(stats.projectedYearEndIncome)}\n残り枠: ${formatYen(stats.remainingTo103Man)}`,
    };
  }
  
  const percentage = (stats.totalGrossIncome / TAX_THRESHOLD) * 100;
  
  if (percentage >= 80) {
    return {
      status: 'warning',
      message: '103万円まで残りわずかです',
      detail: `残り枠: ${formatYen(stats.remainingTo103Man)} (${(100 - percentage).toFixed(1)}%)`,
    };
  }
  
  return {
    status: 'safe',
    message: '103万円以内に収まっています',
    detail: `残り枠: ${formatYen(stats.remainingTo103Man)} (${(100 - percentage).toFixed(1)}%)`,
  };
}

/**
 * Get explanation of 103万円 threshold
 */
export function get103ManExplanation(): string {
  return `103万円の壁について

パート収入が年間103万円（月約8.6万円）を超えると、所得税がかかり始めます。

【内訳】
・基礎控除: ${formatYen(BASIC_DEDUCTION)}
・給与所得控除: ${formatYen(EMPLOYMENT_INCOME_DEDUCTION)}
・合計: ${formatYen(TAX_THRESHOLD)}

※交通費は非課税のため、この計算には含まれません。
※配偶者控除の関係で、家庭によっては103万円以内に抑えることが有利な場合があります。`;
}

/**
 * Format yen amount
 */
function formatYen(amount: number): string {
  return `¥${Math.floor(amount).toLocaleString('ja-JP')}`;
}

/**
 * Calculate tax if income exceeds threshold
 * Simplified calculation for reference only
 */
export function estimateTax(grossIncome: number): number {
  if (grossIncome <= TAX_THRESHOLD) {
    return 0;
  }
  
  // Taxable income = Gross income - Basic deduction - Employment income deduction
  const taxableIncome = grossIncome - BASIC_DEDUCTION - EMPLOYMENT_INCOME_DEDUCTION;
  
  if (taxableIncome <= 0) {
    return 0;
  }
  
  // Simplified tax calculation (5% for income up to 195万円)
  // This is a rough estimate for reference
  return Math.floor(taxableIncome * 0.05);
}

