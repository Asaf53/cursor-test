// ==========================================
// GymTrack Pro - Helper Utilities
// ==========================================

import { Workout, MuscleGroup, ExerciseSet } from '../types';

/**
 * Format seconds into a human-readable duration string
 */
export const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

/**
 * Format large numbers with k/M suffixes
 */
export const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
};

/**
 * Format weight with unit
 */
export const formatWeight = (weight: number, units: 'metric' | 'imperial' = 'metric'): string => {
  if (units === 'imperial') {
    return `${(weight * 2.205).toFixed(1)} lbs`;
  }
  return `${weight} kg`;
};

/**
 * Convert kg to lbs
 */
export const kgToLbs = (kg: number): number => kg * 2.205;

/**
 * Convert lbs to kg
 */
export const lbsToKg = (lbs: number): number => lbs / 2.205;

/**
 * Convert cm to feet/inches
 */
export const cmToFeetInches = (cm: number): string => {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}'${inches}"`;
};

/**
 * Calculate estimated one-rep max (Epley formula)
 */
export const calculateOneRepMax = (weight: number, reps: number): number => {
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
};

/**
 * Calculate total workout volume
 */
export const calculateWorkoutVolume = (workout: Workout): number => {
  return workout.exercises.reduce((total, exercise) => {
    return total + exercise.sets.reduce((setTotal, set) => {
      if (set.isCompleted && set.weight && set.reps) {
        return setTotal + set.weight * set.reps;
      }
      return setTotal;
    }, 0);
  }, 0);
};

/**
 * Get muscle groups worked in a workout
 */
export const getWorkoutMuscleGroups = (workout: Workout): MuscleGroup[] => {
  return [...new Set(workout.exercises.map(e => e.muscleGroup))];
};

/**
 * Calculate estimated calories burned
 * Based on MET values for resistance training
 */
export const estimateCaloriesBurned = (
  durationMinutes: number,
  bodyWeightKg: number = 70,
  intensity: 'light' | 'moderate' | 'vigorous' = 'moderate'
): number => {
  const metValues = {
    light: 3.5,
    moderate: 5.0,
    vigorous: 6.0,
  };
  const met = metValues[intensity];
  // Calories = MET × weight(kg) × duration(hours)
  return Math.round(met * bodyWeightKg * (durationMinutes / 60));
};

/**
 * Get greeting based on time of day
 */
export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

/**
 * Generate a date range string
 */
export const getWeekRange = (date: Date = new Date()): { start: Date; end: Date } => {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

/**
 * Format a date relative to today
 */
export const formatRelativeDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * Calculate workout streak
 */
export const calculateStreak = (workouts: Workout[]): number => {
  const completedDates = new Set(
    workouts
      .filter(w => w.isCompleted)
      .map(w => w.date)
  );

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];

    if (completedDates.has(dateStr)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return streak;
};

/**
 * Get a motivational message based on streak
 */
export const getMotivationalMessage = (streak: number): string => {
  if (streak === 0) return "Let's get started! Today is day one.";
  if (streak < 3) return "Great start! Keep the momentum going!";
  if (streak < 7) return "You're building a habit! Stay consistent!";
  if (streak < 14) return "Impressive dedication! You're on fire!";
  if (streak < 30) return "Incredible consistency! You're unstoppable!";
  return "You're a legend! Nothing can stop you now!";
};
