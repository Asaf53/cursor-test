// ==========================================
// GymTrack Pro - Default Exercise Library
// ==========================================

import { Exercise, MuscleGroup } from '../types';

export const DEFAULT_EXERCISES: Exercise[] = [
  // Chest
  { id: 'ex_1', name: 'Bench Press', muscleGroup: 'chest', category: 'barbell', isCustom: false, description: 'Classic chest exercise with barbell' },
  { id: 'ex_2', name: 'Incline Bench Press', muscleGroup: 'chest', category: 'barbell', isCustom: false, description: 'Upper chest focused press' },
  { id: 'ex_3', name: 'Dumbbell Chest Press', muscleGroup: 'chest', category: 'dumbbell', isCustom: false, description: 'Dumbbell variation of bench press' },
  { id: 'ex_4', name: 'Incline Dumbbell Press', muscleGroup: 'chest', category: 'dumbbell', isCustom: false, description: 'Incline dumbbell chest press' },
  { id: 'ex_5', name: 'Cable Chest Fly', muscleGroup: 'chest', category: 'cable', isCustom: false, description: 'Cable crossover fly for chest' },
  { id: 'ex_6', name: 'Dumbbell Fly', muscleGroup: 'chest', category: 'dumbbell', isCustom: false, description: 'Flat dumbbell fly for chest isolation' },
  { id: 'ex_7', name: 'Push-Ups', muscleGroup: 'chest', category: 'bodyweight', isCustom: false, description: 'Bodyweight chest exercise' },
  { id: 'ex_8', name: 'Chest Dips', muscleGroup: 'chest', category: 'bodyweight', isCustom: false, description: 'Dips targeting chest muscles' },
  { id: 'ex_9', name: 'Machine Chest Press', muscleGroup: 'chest', category: 'machine', isCustom: false, description: 'Machine based chest press' },
  { id: 'ex_10', name: 'Pec Deck', muscleGroup: 'chest', category: 'machine', isCustom: false, description: 'Machine fly for chest isolation' },

  // Back
  { id: 'ex_11', name: 'Deadlift', muscleGroup: 'back', category: 'barbell', isCustom: false, description: 'Full body compound lift' },
  { id: 'ex_12', name: 'Barbell Row', muscleGroup: 'back', category: 'barbell', isCustom: false, description: 'Bent over barbell row' },
  { id: 'ex_13', name: 'Pull-Ups', muscleGroup: 'back', category: 'bodyweight', isCustom: false, description: 'Bodyweight pull-up exercise' },
  { id: 'ex_14', name: 'Lat Pulldown', muscleGroup: 'back', category: 'cable', isCustom: false, description: 'Cable lat pulldown' },
  { id: 'ex_15', name: 'Seated Cable Row', muscleGroup: 'back', category: 'cable', isCustom: false, description: 'Seated cable row for back' },
  { id: 'ex_16', name: 'Dumbbell Row', muscleGroup: 'back', category: 'dumbbell', isCustom: false, description: 'One arm dumbbell row' },
  { id: 'ex_17', name: 'T-Bar Row', muscleGroup: 'back', category: 'barbell', isCustom: false, description: 'T-bar row for mid back' },
  { id: 'ex_18', name: 'Face Pulls', muscleGroup: 'back', category: 'cable', isCustom: false, description: 'Cable face pulls for rear delts/upper back' },
  { id: 'ex_19', name: 'Chin-Ups', muscleGroup: 'back', category: 'bodyweight', isCustom: false, description: 'Underhand grip pull-ups' },

  // Shoulders
  { id: 'ex_20', name: 'Overhead Press', muscleGroup: 'shoulders', category: 'barbell', isCustom: false, description: 'Standing barbell overhead press' },
  { id: 'ex_21', name: 'Dumbbell Shoulder Press', muscleGroup: 'shoulders', category: 'dumbbell', isCustom: false, description: 'Seated dumbbell shoulder press' },
  { id: 'ex_22', name: 'Lateral Raises', muscleGroup: 'shoulders', category: 'dumbbell', isCustom: false, description: 'Dumbbell lateral raises' },
  { id: 'ex_23', name: 'Front Raises', muscleGroup: 'shoulders', category: 'dumbbell', isCustom: false, description: 'Dumbbell front raises' },
  { id: 'ex_24', name: 'Rear Delt Fly', muscleGroup: 'shoulders', category: 'dumbbell', isCustom: false, description: 'Rear deltoid fly' },
  { id: 'ex_25', name: 'Arnold Press', muscleGroup: 'shoulders', category: 'dumbbell', isCustom: false, description: 'Rotating dumbbell press' },
  { id: 'ex_26', name: 'Cable Lateral Raise', muscleGroup: 'shoulders', category: 'cable', isCustom: false, description: 'Cable lateral raises' },

  // Biceps
  { id: 'ex_27', name: 'Barbell Curl', muscleGroup: 'biceps', category: 'barbell', isCustom: false, description: 'Standing barbell bicep curl' },
  { id: 'ex_28', name: 'Dumbbell Curl', muscleGroup: 'biceps', category: 'dumbbell', isCustom: false, description: 'Standing dumbbell bicep curl' },
  { id: 'ex_29', name: 'Hammer Curl', muscleGroup: 'biceps', category: 'dumbbell', isCustom: false, description: 'Neutral grip dumbbell curl' },
  { id: 'ex_30', name: 'Preacher Curl', muscleGroup: 'biceps', category: 'barbell', isCustom: false, description: 'Preacher bench bicep curl' },
  { id: 'ex_31', name: 'Cable Curl', muscleGroup: 'biceps', category: 'cable', isCustom: false, description: 'Cable bicep curl' },
  { id: 'ex_32', name: 'Incline Dumbbell Curl', muscleGroup: 'biceps', category: 'dumbbell', isCustom: false, description: 'Incline bench dumbbell curl' },

  // Triceps
  { id: 'ex_33', name: 'Tricep Pushdown', muscleGroup: 'triceps', category: 'cable', isCustom: false, description: 'Cable tricep pushdown' },
  { id: 'ex_34', name: 'Overhead Tricep Extension', muscleGroup: 'triceps', category: 'dumbbell', isCustom: false, description: 'Overhead dumbbell tricep extension' },
  { id: 'ex_35', name: 'Skull Crushers', muscleGroup: 'triceps', category: 'barbell', isCustom: false, description: 'Lying tricep extension' },
  { id: 'ex_36', name: 'Close Grip Bench Press', muscleGroup: 'triceps', category: 'barbell', isCustom: false, description: 'Close grip barbell bench press' },
  { id: 'ex_37', name: 'Tricep Dips', muscleGroup: 'triceps', category: 'bodyweight', isCustom: false, description: 'Bodyweight tricep dips' },
  { id: 'ex_38', name: 'Cable Overhead Extension', muscleGroup: 'triceps', category: 'cable', isCustom: false, description: 'Cable overhead tricep extension' },

  // Legs
  { id: 'ex_39', name: 'Squat', muscleGroup: 'legs', category: 'barbell', isCustom: false, description: 'Barbell back squat' },
  { id: 'ex_40', name: 'Front Squat', muscleGroup: 'legs', category: 'barbell', isCustom: false, description: 'Barbell front squat' },
  { id: 'ex_41', name: 'Leg Press', muscleGroup: 'legs', category: 'machine', isCustom: false, description: 'Machine leg press' },
  { id: 'ex_42', name: 'Romanian Deadlift', muscleGroup: 'legs', category: 'barbell', isCustom: false, description: 'Romanian deadlift for hamstrings' },
  { id: 'ex_43', name: 'Leg Extension', muscleGroup: 'legs', category: 'machine', isCustom: false, description: 'Machine leg extension' },
  { id: 'ex_44', name: 'Leg Curl', muscleGroup: 'legs', category: 'machine', isCustom: false, description: 'Machine leg curl' },
  { id: 'ex_45', name: 'Lunges', muscleGroup: 'legs', category: 'dumbbell', isCustom: false, description: 'Walking or stationary lunges' },
  { id: 'ex_46', name: 'Bulgarian Split Squat', muscleGroup: 'legs', category: 'dumbbell', isCustom: false, description: 'Bulgarian split squat' },
  { id: 'ex_47', name: 'Calf Raises', muscleGroup: 'legs', category: 'machine', isCustom: false, description: 'Machine calf raises' },
  { id: 'ex_48', name: 'Hack Squat', muscleGroup: 'legs', category: 'machine', isCustom: false, description: 'Machine hack squat' },

  // Glutes
  { id: 'ex_49', name: 'Hip Thrust', muscleGroup: 'glutes', category: 'barbell', isCustom: false, description: 'Barbell hip thrust' },
  { id: 'ex_50', name: 'Glute Bridge', muscleGroup: 'glutes', category: 'bodyweight', isCustom: false, description: 'Bodyweight glute bridge' },
  { id: 'ex_51', name: 'Cable Kickback', muscleGroup: 'glutes', category: 'cable', isCustom: false, description: 'Cable glute kickback' },
  { id: 'ex_52', name: 'Sumo Deadlift', muscleGroup: 'glutes', category: 'barbell', isCustom: false, description: 'Sumo stance deadlift' },

  // Abs
  { id: 'ex_53', name: 'Crunches', muscleGroup: 'abs', category: 'bodyweight', isCustom: false, description: 'Basic crunches' },
  { id: 'ex_54', name: 'Plank', muscleGroup: 'abs', category: 'bodyweight', isCustom: false, description: 'Plank hold for core stability' },
  { id: 'ex_55', name: 'Hanging Leg Raise', muscleGroup: 'abs', category: 'bodyweight', isCustom: false, description: 'Hanging leg raises for lower abs' },
  { id: 'ex_56', name: 'Cable Crunch', muscleGroup: 'abs', category: 'cable', isCustom: false, description: 'Cable crunch for abs' },
  { id: 'ex_57', name: 'Russian Twist', muscleGroup: 'abs', category: 'bodyweight', isCustom: false, description: 'Russian twist for obliques' },
  { id: 'ex_58', name: 'Ab Wheel Rollout', muscleGroup: 'abs', category: 'other', isCustom: false, description: 'Ab wheel rollout' },

  // Cardio
  { id: 'ex_59', name: 'Treadmill Running', muscleGroup: 'cardio', category: 'cardio', isCustom: false, description: 'Running on treadmill' },
  { id: 'ex_60', name: 'Cycling', muscleGroup: 'cardio', category: 'cardio', isCustom: false, description: 'Stationary bike cycling' },
  { id: 'ex_61', name: 'Rowing Machine', muscleGroup: 'cardio', category: 'cardio', isCustom: false, description: 'Rowing machine cardio' },
  { id: 'ex_62', name: 'Stair Climber', muscleGroup: 'cardio', category: 'cardio', isCustom: false, description: 'Stair climber machine' },
  { id: 'ex_63', name: 'Jump Rope', muscleGroup: 'cardio', category: 'cardio', isCustom: false, description: 'Jump rope cardio' },
  { id: 'ex_64', name: 'Elliptical', muscleGroup: 'cardio', category: 'cardio', isCustom: false, description: 'Elliptical trainer' },
];

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  legs: 'Legs',
  glutes: 'Glutes',
  abs: 'Abs',
  cardio: 'Cardio',
  full_body: 'Full Body',
  other: 'Other',
};

export const MUSCLE_GROUP_ICONS: Record<MuscleGroup, string> = {
  chest: 'fitness',
  back: 'body',
  shoulders: 'man',
  biceps: 'arm-flex',
  triceps: 'arm-flex-outline',
  legs: 'walk',
  glutes: 'human',
  abs: 'shield-half-full',
  cardio: 'heart-pulse',
  full_body: 'human-handsup',
  other: 'dumbbell',
};

export const MUSCLE_GROUP_COLORS: Record<MuscleGroup, string> = {
  chest: '#EF4444',
  back: '#3B82F6',
  shoulders: '#8B5CF6',
  biceps: '#F97316',
  triceps: '#EC4899',
  legs: '#10B981',
  glutes: '#F59E0B',
  abs: '#14B8A6',
  cardio: '#EF4444',
  full_body: '#6366F1',
  other: '#6B7280',
};
