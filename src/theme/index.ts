/**
 * WorkMate Theme Configuration
 * Clean, medical-inspired design with blue-green tones
 */

import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';

// Color palette - Medical/Clean aesthetic
const colors = {
  // Primary - Teal/Cyan
  primary: '#0D7377',
  primaryLight: '#14919B',
  primaryDark: '#095456',
  
  // Secondary - Warm accent
  secondary: '#FF9A3C',
  secondaryLight: '#FFB366',
  secondaryDark: '#E67E00',
  
  // Success - Green
  success: '#10B981',
  successLight: '#34D399',
  successDark: '#059669',
  
  // Warning - Orange/Yellow
  warning: '#F59E0B',
  warningLight: '#FBBF24',
  warningDark: '#D97706',
  
  // Danger - Red
  danger: '#EF4444',
  dangerLight: '#F87171',
  dangerDark: '#DC2626',
  
  // Neutral
  background: '#F8FAFB',
  surface: '#FFFFFF',
  surfaceVariant: '#F1F5F9',
  text: '#1E293B',
  textSecondary: '#64748B',
  textDisabled: '#94A3B8',
  border: '#E2E8F0',
  
  // Dark mode variants
  backgroundDark: '#0F172A',
  surfaceDark: '#1E293B',
  surfaceVariantDark: '#334155',
  textDark: '#F8FAFC',
  textSecondaryDark: '#94A3B8',
  textDisabledDark: '#64748B',
  borderDark: '#334155',
};

// Font configuration
const fontConfig = {
  displayLarge: {
    fontFamily: 'System',
    fontSize: 57,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 64,
  },
  displayMedium: {
    fontFamily: 'System',
    fontSize: 45,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 52,
  },
  displaySmall: {
    fontFamily: 'System',
    fontSize: 36,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 44,
  },
  headlineLarge: {
    fontFamily: 'System',
    fontSize: 32,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 40,
  },
  headlineMedium: {
    fontFamily: 'System',
    fontSize: 28,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 36,
  },
  headlineSmall: {
    fontFamily: 'System',
    fontSize: 24,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 32,
  },
  titleLarge: {
    fontFamily: 'System',
    fontSize: 22,
    fontWeight: '500' as const,
    letterSpacing: 0,
    lineHeight: 28,
  },
  titleMedium: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '500' as const,
    letterSpacing: 0.15,
    lineHeight: 24,
  },
  titleSmall: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  labelLarge: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  labelMedium: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  labelSmall: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  bodyLarge: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '400' as const,
    letterSpacing: 0.5,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '400' as const,
    letterSpacing: 0.25,
    lineHeight: 20,
  },
  bodySmall: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '400' as const,
    letterSpacing: 0.4,
    lineHeight: 16,
  },
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    primaryContainer: colors.primaryLight,
    secondary: colors.secondary,
    secondaryContainer: colors.secondaryLight,
    background: colors.background,
    surface: colors.surface,
    surfaceVariant: colors.surfaceVariant,
    error: colors.danger,
    errorContainer: colors.dangerLight,
    onPrimary: '#FFFFFF',
    onPrimaryContainer: colors.primaryDark,
    onSecondary: '#FFFFFF',
    onSecondaryContainer: colors.secondaryDark,
    onBackground: colors.text,
    onSurface: colors.text,
    onSurfaceVariant: colors.textSecondary,
    onError: '#FFFFFF',
    onErrorContainer: colors.dangerDark,
    outline: colors.border,
    outlineVariant: colors.surfaceVariant,
  },
  fonts: configureFonts({ config: fontConfig }),
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primaryLight,
    primaryContainer: colors.primaryDark,
    secondary: colors.secondaryLight,
    secondaryContainer: colors.secondaryDark,
    background: colors.backgroundDark,
    surface: colors.surfaceDark,
    surfaceVariant: colors.surfaceVariantDark,
    error: colors.dangerLight,
    errorContainer: colors.dangerDark,
    onPrimary: colors.backgroundDark,
    onPrimaryContainer: colors.primaryLight,
    onSecondary: colors.backgroundDark,
    onSecondaryContainer: colors.secondaryLight,
    onBackground: colors.textDark,
    onSurface: colors.textDark,
    onSurfaceVariant: colors.textSecondaryDark,
    onError: colors.backgroundDark,
    onErrorContainer: colors.dangerLight,
    outline: colors.borderDark,
    outlineVariant: colors.surfaceVariantDark,
  },
  fonts: configureFonts({ config: fontConfig }),
};

// Custom colors for specific features
export const customColors = {
  income: {
    safe: colors.success,
    warning: colors.warning,
    danger: colors.danger,
  },
  priority: {
    high: colors.danger,
    medium: colors.warning,
    low: colors.success,
  },
  status: {
    todo: colors.textSecondary,
    in_progress: colors.primary,
    done: colors.success,
    on_hold: colors.warning,
  },
};

export { colors };

