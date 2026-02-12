// ==========================================
// GymTrack Pro - Type Definitions
// ==========================================

// User & Authentication
export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
  profile: UserProfile;
  subscription: SubscriptionPlan;
}

export interface UserProfile {
  name: string;
  age: number | null;
  height: number | null; // in cm
  weight: number | null; // in kg
  goal: FitnessGoal;
  experienceLevel: ExperienceLevel;
  units: 'metric' | 'imperial';
}

export type FitnessGoal = 'weight_loss' | 'muscle_gain' | 'maintenance' | 'custom';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export type SubscriptionPlan = 'free' | 'premium_monthly' | 'premium_yearly';

// Workout Tracking
export interface Workout {
  id: string;
  userId: string;
  name: string;
  date: string;
  startTime: string;
  endTime?: string;
  duration?: number; // in seconds
  exercises: WorkoutExercise[];
  notes?: string;
  caloriesEstimate?: number;
  isCompleted: boolean;
  createdAt: string;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  sets: ExerciseSet[];
  notes?: string;
  restTimerSeconds: number;
  order: number;
}

export interface ExerciseSet {
  id: string;
  setNumber: number;
  reps: number | null;
  weight: number | null; // in kg
  isCompleted: boolean;
  type: SetType;
  rpe?: number; // Rate of Perceived Exertion (1-10)
}

export type SetType = 'normal' | 'warmup' | 'dropset' | 'failure';

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'legs'
  | 'glutes'
  | 'abs'
  | 'cardio'
  | 'full_body'
  | 'other';

// Exercise Library
export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  category: ExerciseCategory;
  isCustom: boolean;
  description?: string;
  instructions?: string[];
}

export type ExerciseCategory = 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight' | 'cardio' | 'other';

// Progress Tracking
export interface BodyWeight {
  id: string;
  userId: string;
  weight: number; // in kg
  date: string;
  notes?: string;
}

export interface BodyMeasurement {
  id: string;
  userId: string;
  date: string;
  chest?: number; // in cm
  arms?: number;
  waist?: number;
  legs?: number;
  notes?: string;
}

export interface ProgressPhoto {
  id: string;
  userId: string;
  uri: string;
  date: string;
  category: 'front' | 'side' | 'back';
  notes?: string;
}

// Personal Records
export interface PersonalRecord {
  id: string;
  userId: string;
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  date: string;
  oneRepMax?: number;
}

// Analytics
export interface WeeklySummary {
  weekStart: string;
  weekEnd: string;
  totalWorkouts: number;
  totalDuration: number; // in seconds
  totalVolume: number; // total weight lifted
  totalSets: number;
  totalReps: number;
  caloriesBurned: number;
  muscleGroupBreakdown: Record<MuscleGroup, number>;
}

export interface MonthlySummary {
  month: string; // YYYY-MM
  totalWorkouts: number;
  totalDuration: number;
  totalVolume: number;
  personalRecords: number;
  averageWorkoutDuration: number;
  consistencyPercentage: number;
}

// Goals
export interface Goal {
  id: string;
  userId: string;
  type: FitnessGoal;
  title: string;
  description?: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  deadline?: string;
  isCompleted: boolean;
  createdAt: string;
}

// Notifications
export interface NotificationSettings {
  workoutReminders: boolean;
  reminderTime: string; // HH:MM
  reminderDays: number[]; // 0-6 (Sun-Sat)
  goalProgressAlerts: boolean;
  personalRecordAlerts: boolean;
}

// Workout Template
export interface WorkoutTemplate {
  id: string;
  userId: string;
  name: string;
  exercises: WorkoutTemplateExercise[];
  createdAt: string;
  lastUsed?: string;
  timesUsed: number;
}

export interface WorkoutTemplateExercise {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  targetSets: number;
  targetReps: number;
  restTimerSeconds: number;
  order: number;
}

// Theme
export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  card: string;
  tabBar: string;
  tabBarInactive: string;
  inputBackground: string;
  shadow: string;
}
