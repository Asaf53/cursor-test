// ==========================================
// GymTrack Pro - Theme Configuration
// ==========================================

import { ThemeColors } from '../types';

export const COLORS = {
  primary: '#1E90FF',
  secondary: '#111111',
  accent: '#FF6B00',
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  red: '#EF4444',
  green: '#10B981',
  yellow: '#F59E0B',
  blue: '#3B82F6',
};

export const lightTheme: ThemeColors = {
  primary: COLORS.primary,
  secondary: COLORS.secondary,
  accent: COLORS.accent,
  background: '#F5F5F7',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  border: '#E5E7EB',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  card: '#FFFFFF',
  tabBar: '#FFFFFF',
  tabBarInactive: '#9CA3AF',
  inputBackground: '#F3F4F6',
  shadow: 'rgba(0, 0, 0, 0.08)',
};

export const darkTheme: ThemeColors = {
  primary: COLORS.primary,
  secondary: '#F5F5F7',
  accent: COLORS.accent,
  background: '#0A0A0F',
  surface: '#16161E',
  surfaceElevated: '#1E1E2A',
  text: '#F5F5F7',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',
  border: '#2A2A3A',
  error: '#F87171',
  success: '#34D399',
  warning: '#FBBF24',
  card: '#16161E',
  tabBar: '#0F0F17',
  tabBarInactive: '#6B7280',
  inputBackground: '#1E1E2A',
  shadow: 'rgba(0, 0, 0, 0.3)',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const FONT_SIZE = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  xxxl: 28,
  display: 34,
  hero: 42,
};

export const FONT_WEIGHT = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};
