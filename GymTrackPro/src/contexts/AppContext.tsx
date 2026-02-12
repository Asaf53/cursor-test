// ==========================================
// GymTrack Pro - App Data Context
// Supabase-integrated with AsyncStorage cache
// ==========================================

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import {
  User,
  UserProfile,
  Workout,
  WorkoutExercise,
  ExerciseSet,
  Exercise,
  BodyWeight,
  BodyMeasurement,
  ProgressPhoto,
  PersonalRecord,
  Goal,
  WorkoutTemplate,
  NotificationSettings,
  SubscriptionPlan,
} from '../types';
import { DEFAULT_EXERCISES } from '../constants/exercises';
import {
  authService,
  dbService,
  storageService,
  supabase,
  Session,
  SupabaseUser,
} from '../services/supabase';

// Local cache keys
const STORAGE_KEYS = {
  USER: '@gymtrack_user',
  WORKOUTS: '@gymtrack_workouts',
  EXERCISES: '@gymtrack_exercises',
  BODY_WEIGHTS: '@gymtrack_body_weights',
  MEASUREMENTS: '@gymtrack_measurements',
  PHOTOS: '@gymtrack_photos',
  RECORDS: '@gymtrack_records',
  GOALS: '@gymtrack_goals',
  TEMPLATES: '@gymtrack_templates',
  NOTIFICATIONS: '@gymtrack_notifications',
  HAS_ONBOARDED: '@gymtrack_has_onboarded',
};

interface AppContextType {
  // Auth
  isAuthenticated: boolean;
  hasOnboarded: boolean;
  user: User | null;
  supabaseUser: SupabaseUser | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, name: string) => Promise<'signed_in' | 'needs_confirmation' | 'error'>;
  signInWithGoogle: () => Promise<{ url: string } | null>;
  signInWithApple: () => Promise<{ url: string } | null>;
  handleOAuthCallback: (url: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<boolean>;
  completeOnboarding: (profile: Partial<UserProfile>) => Promise<void>;

  // User
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  updateSubscription: (plan: SubscriptionPlan) => Promise<void>;

  // Workouts
  workouts: Workout[];
  activeWorkout: Workout | null;
  startWorkout: (name: string, templateId?: string) => Workout;
  finishWorkout: (workoutId: string) => Promise<void>;
  cancelWorkout: () => void;
  addExerciseToWorkout: (workoutId: string, exercise: Exercise) => void;
  removeExerciseFromWorkout: (workoutId: string, exerciseId: string) => void;
  addSetToExercise: (workoutId: string, exerciseId: string) => void;
  removeSetFromExercise: (workoutId: string, exerciseId: string, setId: string) => void;
  updateSet: (workoutId: string, exerciseId: string, setId: string, updates: Partial<ExerciseSet>) => void;
  updateWorkoutNotes: (workoutId: string, notes: string) => void;
  deleteWorkout: (workoutId: string) => Promise<void>;

  // Exercises
  exercises: Exercise[];
  addCustomExercise: (exercise: Omit<Exercise, 'id' | 'isCustom'>) => Promise<Exercise>;

  // Body Weights
  bodyWeights: BodyWeight[];
  addBodyWeight: (weight: number, notes?: string) => Promise<void>;
  deleteBodyWeight: (id: string) => Promise<void>;

  // Measurements
  measurements: BodyMeasurement[];
  addMeasurement: (measurement: Omit<BodyMeasurement, 'id' | 'userId' | 'date'>) => Promise<void>;
  deleteMeasurement: (id: string) => Promise<void>;

  // Progress Photos
  progressPhotos: ProgressPhoto[];
  addProgressPhoto: (photo: Omit<ProgressPhoto, 'id' | 'userId' | 'date'>) => Promise<void>;
  deleteProgressPhoto: (id: string) => Promise<void>;

  // Personal Records
  personalRecords: PersonalRecord[];

  // Goals
  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'isCompleted'>) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  // Templates
  templates: WorkoutTemplate[];
  saveTemplate: (template: Omit<WorkoutTemplate, 'id' | 'userId' | 'createdAt' | 'timesUsed'>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;

  // Notifications
  notificationSettings: NotificationSettings;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => Promise<void>;

  // Loading
  isLoading: boolean;
}

const defaultNotificationSettings: NotificationSettings = {
  workoutReminders: true,
  reminderTime: '09:00',
  reminderDays: [1, 2, 3, 4, 5],
  goalProgressAlerts: true,
  personalRecordAlerts: true,
};

const AppContext = createContext<AppContextType>({} as AppContextType);

export const useApp = () => useContext(AppContext);

// Build app User from Supabase auth user + profile row
const buildUser = (sbUser: SupabaseUser, profile?: Record<string, any> | null): User => ({
  id: sbUser.id,
  email: sbUser.email || '',
  displayName: profile?.display_name || sbUser.user_metadata?.display_name || sbUser.email?.split('@')[0] || 'User',
  photoURL: profile?.photo_url || sbUser.user_metadata?.avatar_url,
  createdAt: sbUser.created_at || new Date().toISOString(),
  updatedAt: profile?.updated_at || new Date().toISOString(),
  profile: {
    name: profile?.display_name || sbUser.user_metadata?.display_name || sbUser.email?.split('@')[0] || 'User',
    age: profile?.age ?? null,
    height: profile?.height ?? null,
    weight: profile?.weight ?? null,
    goal: profile?.goal || 'muscle_gain',
    experienceLevel: profile?.experience_level || 'beginner',
    units: profile?.units || 'metric',
  },
  subscription: profile?.subscription || 'free',
});

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>(DEFAULT_EXERCISES);
  const [bodyWeights, setBodyWeights] = useState<BodyWeight[]>([]);
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [progressPhotos, setProgressPhotos] = useState<ProgressPhoto[]>([]);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(defaultNotificationSettings);

  // ========================================
  // Supabase Auth State Listener
  // ========================================
  useEffect(() => {
    // Check for existing session on mount
    authService.getSession().then((session) => {
      if (session?.user) {
        setSupabaseUser(session.user);
        setIsAuthenticated(true);
        handleUserLogin(session.user);
      }
      setIsLoading(false);
    }).catch(() => setIsLoading(false));

    // Listen for auth changes
    const subscription = authService.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setSupabaseUser(session.user);
        setIsAuthenticated(true);
        handleUserLogin(session.user);
      } else if (event === 'SIGNED_OUT') {
        setSupabaseUser(null);
        setIsAuthenticated(false);
        setUser(null);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        setSupabaseUser(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleUserLogin = async (sbUser: SupabaseUser) => {
    try {
      // Load local cache first
      await loadLocalCache();

      // Fetch Supabase profile
      let profile: Record<string, any> | null = null;
      try {
        profile = await dbService.getProfile(sbUser.id);
      } catch (err) {
        console.log('Profile fetch failed (offline?):', err);
      }

      const appUser = buildUser(sbUser, profile);
      setUser(appUser);
      setHasOnboarded(profile?.has_onboarded ?? false);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(appUser));
      await AsyncStorage.setItem(STORAGE_KEYS.HAS_ONBOARDED, JSON.stringify(profile?.has_onboarded ?? false));

      // Background sync
      syncFromSupabase(sbUser.id);
    } catch (error) {
      console.log('handleUserLogin error:', error);
    }
  };

  const loadLocalCache = async () => {
    try {
      const [
        storedUser, storedOnboarded, storedWorkouts, storedExercises,
        storedBodyWeights, storedMeasurements, storedPhotos, storedRecords,
        storedGoals, storedTemplates, storedNotifications,
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER),
        AsyncStorage.getItem(STORAGE_KEYS.HAS_ONBOARDED),
        AsyncStorage.getItem(STORAGE_KEYS.WORKOUTS),
        AsyncStorage.getItem(STORAGE_KEYS.EXERCISES),
        AsyncStorage.getItem(STORAGE_KEYS.BODY_WEIGHTS),
        AsyncStorage.getItem(STORAGE_KEYS.MEASUREMENTS),
        AsyncStorage.getItem(STORAGE_KEYS.PHOTOS),
        AsyncStorage.getItem(STORAGE_KEYS.RECORDS),
        AsyncStorage.getItem(STORAGE_KEYS.GOALS),
        AsyncStorage.getItem(STORAGE_KEYS.TEMPLATES),
        AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS),
      ]);

      if (storedUser) setUser(JSON.parse(storedUser));
      if (storedOnboarded) setHasOnboarded(JSON.parse(storedOnboarded));
      if (storedWorkouts) setWorkouts(JSON.parse(storedWorkouts));
      if (storedExercises) {
        const custom = JSON.parse(storedExercises) as Exercise[];
        setExercises([...DEFAULT_EXERCISES, ...custom]);
      }
      if (storedBodyWeights) setBodyWeights(JSON.parse(storedBodyWeights));
      if (storedMeasurements) setMeasurements(JSON.parse(storedMeasurements));
      if (storedPhotos) setProgressPhotos(JSON.parse(storedPhotos));
      if (storedRecords) setPersonalRecords(JSON.parse(storedRecords));
      if (storedGoals) setGoals(JSON.parse(storedGoals));
      if (storedTemplates) setTemplates(JSON.parse(storedTemplates));
      if (storedNotifications) setNotificationSettings(JSON.parse(storedNotifications));
    } catch (error) {
      console.log('loadLocalCache error:', error);
    }
  };

  const syncFromSupabase = async (userId: string) => {
    try {
      const results = await Promise.allSettled([
        dbService.getWorkouts(userId),
        dbService.getBodyWeights(userId),
        dbService.getMeasurements(userId),
        dbService.getPersonalRecords(userId),
        dbService.getGoals(userId),
        dbService.getTemplates(userId),
        dbService.getCustomExercises(userId),
      ]);

      const [rWorkouts, rWeights, rMeasures, rRecords, rGoals, rTemplates, rExercises] = results;

      if (rWorkouts.status === 'fulfilled' && rWorkouts.value.length > 0) {
        // Map snake_case DB rows to camelCase app types
        const mapped = rWorkouts.value.map(mapWorkoutFromDb);
        setWorkouts(mapped);
        await AsyncStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(mapped));
      }
      if (rWeights.status === 'fulfilled' && rWeights.value.length > 0) {
        const mapped = rWeights.value.map(mapBodyWeightFromDb);
        setBodyWeights(mapped);
        await AsyncStorage.setItem(STORAGE_KEYS.BODY_WEIGHTS, JSON.stringify(mapped));
      }
      if (rMeasures.status === 'fulfilled' && rMeasures.value.length > 0) {
        const mapped = rMeasures.value.map(mapMeasurementFromDb);
        setMeasurements(mapped);
        await AsyncStorage.setItem(STORAGE_KEYS.MEASUREMENTS, JSON.stringify(mapped));
      }
      if (rRecords.status === 'fulfilled' && rRecords.value.length > 0) {
        const mapped = rRecords.value.map(mapRecordFromDb);
        setPersonalRecords(mapped);
        await AsyncStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(mapped));
      }
      if (rGoals.status === 'fulfilled' && rGoals.value.length > 0) {
        const mapped = rGoals.value.map(mapGoalFromDb);
        setGoals(mapped);
        await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(mapped));
      }
      if (rTemplates.status === 'fulfilled' && rTemplates.value.length > 0) {
        const mapped = rTemplates.value.map(mapTemplateFromDb);
        setTemplates(mapped);
        await AsyncStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(mapped));
      }
      if (rExercises.status === 'fulfilled' && rExercises.value.length > 0) {
        const mapped = rExercises.value.map(mapExerciseFromDb);
        setExercises([...DEFAULT_EXERCISES, ...mapped]);
        await AsyncStorage.setItem(STORAGE_KEYS.EXERCISES, JSON.stringify(mapped));
      }
    } catch (error) {
      console.log('syncFromSupabase error (non-critical):', error);
    }
  };

  // ========================================
  // DB row <-> App type mappers
  // ========================================
  const mapWorkoutFromDb = (row: any): Workout => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    duration: row.duration,
    exercises: row.exercises || [],
    notes: row.notes,
    caloriesEstimate: row.calories_estimate,
    isCompleted: row.is_completed,
    createdAt: row.created_at,
  });

  const mapWorkoutToDb = (w: Workout) => ({
    id: w.id,
    user_id: w.userId,
    name: w.name,
    date: w.date,
    start_time: w.startTime,
    end_time: w.endTime,
    duration: w.duration,
    exercises: w.exercises,
    notes: w.notes,
    calories_estimate: w.caloriesEstimate,
    is_completed: w.isCompleted,
  });

  const mapBodyWeightFromDb = (row: any): BodyWeight => ({
    id: row.id, userId: row.user_id, weight: row.weight, date: row.date, notes: row.notes,
  });

  const mapMeasurementFromDb = (row: any): BodyMeasurement => ({
    id: row.id, userId: row.user_id, date: row.date,
    chest: row.chest, arms: row.arms, waist: row.waist, legs: row.legs, notes: row.notes,
  });

  const mapRecordFromDb = (row: any): PersonalRecord => ({
    id: row.id, userId: row.user_id, exerciseId: row.exercise_id,
    exerciseName: row.exercise_name, weight: row.weight, reps: row.reps,
    date: row.date, oneRepMax: row.one_rep_max,
  });

  const mapGoalFromDb = (row: any): Goal => ({
    id: row.id, userId: row.user_id, type: row.type, title: row.title,
    description: row.description, targetValue: row.target_value,
    currentValue: row.current_value, unit: row.unit, deadline: row.deadline,
    isCompleted: row.is_completed, createdAt: row.created_at,
  });

  const mapTemplateFromDb = (row: any): WorkoutTemplate => ({
    id: row.id, userId: row.user_id, name: row.name,
    exercises: row.exercises || [], createdAt: row.created_at,
    lastUsed: row.last_used, timesUsed: row.times_used,
  });

  const mapExerciseFromDb = (row: any): Exercise => ({
    id: row.id, name: row.name, muscleGroup: row.muscle_group,
    category: row.category, isCustom: true, description: row.description,
  });

  // ========================================
  // Authentication
  // ========================================

  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      await authService.signInWithEmail(email, password);
      return true;
    } catch (error: any) {
      console.log('Sign in error:', error.message);
      return false;
    }
  };

  const signUp = async (email: string, password: string, name: string): Promise<'signed_in' | 'needs_confirmation' | 'error'> => {
    try {
      const result = await authService.signUpWithEmail(email, password, name);
      if (result.needsConfirmation) {
        // User was created but needs to confirm their email
        return 'needs_confirmation';
      }
      // Session was created immediately (email confirmation disabled in Supabase)
      // onAuthStateChange will fire and handle the rest
      return 'signed_in';
    } catch (error: any) {
      console.log('Sign up error:', error.message);
      throw error; // Re-throw so the screen can show the right message
    }
  };

  const signInWithGoogle = async (): Promise<{ url: string } | null> => {
    try {
      const data = await authService.signInWithGoogle();
      if (data?.url) return { url: data.url };
      return null;
    } catch (error: any) {
      console.log('Google sign-in error:', error.message);
      return null;
    }
  };

  const signInWithApple = async (): Promise<{ url: string } | null> => {
    try {
      const data = await authService.signInWithApple();
      if (data?.url) return { url: data.url };
      return null;
    } catch (error: any) {
      console.log('Apple sign-in error:', error.message);
      return null;
    }
  };

  const handleOAuthCallback = async (url: string): Promise<boolean> => {
    try {
      await authService.setSessionFromUrl(url);
      return true;
    } catch (error: any) {
      console.log('OAuth callback error:', error.message);
      return false;
    }
  };

  const signOut = async () => {
    try { await authService.signOut(); } catch (e) { console.log('Sign out error:', e); }
    setIsAuthenticated(false);
    setHasOnboarded(false);
    setUser(null);
    setSupabaseUser(null);
    setWorkouts([]);
    setActiveWorkout(null);
    setBodyWeights([]);
    setMeasurements([]);
    setProgressPhotos([]);
    setPersonalRecords([]);
    setGoals([]);
    setTemplates([]);
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  };

  const sendPasswordReset = async (email: string): Promise<boolean> => {
    try { await authService.sendPasswordReset(email); return true; }
    catch { return false; }
  };

  const completeOnboarding = async (profile: Partial<UserProfile>) => {
    if (!user) return;
    const updatedUser = { ...user, profile: { ...user.profile, ...profile }, updatedAt: new Date().toISOString() };
    setUser(updatedUser);
    setHasOnboarded(true);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
    await AsyncStorage.setItem(STORAGE_KEYS.HAS_ONBOARDED, JSON.stringify(true));
    try {
      await dbService.upsertProfile({
        id: user.id,
        display_name: updatedUser.profile.name,
        age: updatedUser.profile.age,
        height: updatedUser.profile.height,
        weight: updatedUser.profile.weight,
        goal: updatedUser.profile.goal,
        experience_level: updatedUser.profile.experienceLevel,
        units: updatedUser.profile.units,
        has_onboarded: true,
        updated_at: new Date().toISOString(),
      });
    } catch (err) { console.log('Supabase onboarding update failed:', err); }
  };

  // ========================================
  // User Profile
  // ========================================

  const updateProfileFn = async (profile: Partial<UserProfile>) => {
    if (!user) return;
    const updatedUser = {
      ...user,
      profile: { ...user.profile, ...profile },
      displayName: profile.name || user.displayName,
      updatedAt: new Date().toISOString(),
    };
    setUser(updatedUser);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
    try {
      await dbService.upsertProfile({
        id: user.id,
        display_name: updatedUser.displayName,
        age: updatedUser.profile.age,
        height: updatedUser.profile.height,
        weight: updatedUser.profile.weight,
        goal: updatedUser.profile.goal,
        experience_level: updatedUser.profile.experienceLevel,
        units: updatedUser.profile.units,
        updated_at: new Date().toISOString(),
      });
    } catch (err) { console.log('Supabase profile update failed:', err); }
  };

  const updateSubscription = async (plan: SubscriptionPlan) => {
    if (!user) return;
    const updatedUser = { ...user, subscription: plan, updatedAt: new Date().toISOString() };
    setUser(updatedUser);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
    try { await dbService.upsertProfile({ id: user.id, subscription: plan }); }
    catch (err) { console.log('Supabase subscription update failed:', err); }
  };

  // ========================================
  // Workouts
  // ========================================

  const startWorkout = (name: string, _templateId?: string): Workout => {
    const now = new Date().toISOString();
    const workout: Workout = {
      id: uuidv4(), userId: user?.id || '', name, date: now.split('T')[0],
      startTime: now, exercises: [], isCompleted: false, createdAt: now,
    };
    setActiveWorkout(workout);
    return workout;
  };

  const finishWorkout = async (workoutId: string) => {
    if (!activeWorkout || activeWorkout.id !== workoutId) return;
    const now = new Date();
    const start = new Date(activeWorkout.startTime);
    const duration = Math.round((now.getTime() - start.getTime()) / 1000);
    const completedWorkout: Workout = {
      ...activeWorkout, endTime: now.toISOString(), duration,
      isCompleted: true, caloriesEstimate: estimateCalories(activeWorkout, duration),
    };
    const updatedWorkouts = [completedWorkout, ...workouts];
    setWorkouts(updatedWorkouts);
    setActiveWorkout(null);
    await AsyncStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(updatedWorkouts));
    try { if (user) await dbService.saveWorkout(mapWorkoutToDb(completedWorkout)); }
    catch (err) { console.log('Supabase workout save failed:', err); }
    await checkPersonalRecords(completedWorkout);
  };

  const cancelWorkout = () => { setActiveWorkout(null); };

  const addExerciseToWorkout = (workoutId: string, exercise: Exercise) => {
    if (!activeWorkout || activeWorkout.id !== workoutId) return;
    const we: WorkoutExercise = {
      id: uuidv4(), exerciseId: exercise.id, exerciseName: exercise.name,
      muscleGroup: exercise.muscleGroup,
      sets: [{ id: uuidv4(), setNumber: 1, reps: null, weight: null, isCompleted: false, type: 'normal' }],
      restTimerSeconds: 90, order: activeWorkout.exercises.length,
    };
    setActiveWorkout({ ...activeWorkout, exercises: [...activeWorkout.exercises, we] });
  };

  const removeExerciseFromWorkout = (workoutId: string, exerciseId: string) => {
    if (!activeWorkout || activeWorkout.id !== workoutId) return;
    setActiveWorkout({ ...activeWorkout, exercises: activeWorkout.exercises.filter(e => e.id !== exerciseId) });
  };

  const addSetToExercise = (workoutId: string, exerciseId: string) => {
    if (!activeWorkout || activeWorkout.id !== workoutId) return;
    setActiveWorkout({
      ...activeWorkout,
      exercises: activeWorkout.exercises.map(ex => {
        if (ex.id !== exerciseId) return ex;
        const last = ex.sets[ex.sets.length - 1];
        return { ...ex, sets: [...ex.sets, { id: uuidv4(), setNumber: ex.sets.length + 1, reps: last?.reps || null, weight: last?.weight || null, isCompleted: false, type: 'normal' as const }] };
      }),
    });
  };

  const removeSetFromExercise = (workoutId: string, exerciseId: string, setId: string) => {
    if (!activeWorkout || activeWorkout.id !== workoutId) return;
    setActiveWorkout({
      ...activeWorkout,
      exercises: activeWorkout.exercises.map(ex => {
        if (ex.id !== exerciseId) return ex;
        const filtered = ex.sets.filter(s => s.id !== setId);
        return { ...ex, sets: filtered.map((s, i) => ({ ...s, setNumber: i + 1 })) };
      }),
    });
  };

  const updateSet = (workoutId: string, exerciseId: string, setId: string, updates: Partial<ExerciseSet>) => {
    if (!activeWorkout || activeWorkout.id !== workoutId) return;
    setActiveWorkout({
      ...activeWorkout,
      exercises: activeWorkout.exercises.map(ex => {
        if (ex.id !== exerciseId) return ex;
        return { ...ex, sets: ex.sets.map(s => s.id === setId ? { ...s, ...updates } : s) };
      }),
    });
  };

  const updateWorkoutNotes = (workoutId: string, notes: string) => {
    if (activeWorkout?.id === workoutId) setActiveWorkout({ ...activeWorkout, notes });
  };

  const deleteWorkout = async (workoutId: string) => {
    const updated = workouts.filter(w => w.id !== workoutId);
    setWorkouts(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(updated));
    try { await dbService.deleteWorkout(workoutId); } catch (err) { console.log('Supabase delete workout failed:', err); }
  };

  // ========================================
  // Exercises
  // ========================================

  const addCustomExercise = async (data: Omit<Exercise, 'id' | 'isCustom'>): Promise<Exercise> => {
    const exercise: Exercise = { ...data, id: uuidv4(), isCustom: true };
    const custom = exercises.filter(e => e.isCustom);
    setExercises([...DEFAULT_EXERCISES, ...custom, exercise]);
    await AsyncStorage.setItem(STORAGE_KEYS.EXERCISES, JSON.stringify([...custom, exercise]));
    try {
      if (user) await dbService.saveCustomExercise({
        id: exercise.id, user_id: user.id, name: exercise.name,
        muscle_group: exercise.muscleGroup, category: exercise.category, description: exercise.description,
      });
    } catch (err) { console.log('Supabase exercise save failed:', err); }
    return exercise;
  };

  // ========================================
  // Body Weights
  // ========================================

  const addBodyWeight = async (weight: number, notes?: string) => {
    const entry: BodyWeight = { id: uuidv4(), userId: user?.id || '', weight, date: new Date().toISOString(), notes };
    const updated = [entry, ...bodyWeights];
    setBodyWeights(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.BODY_WEIGHTS, JSON.stringify(updated));
    if (user) {
      const updatedUser = { ...user, profile: { ...user.profile, weight }, updatedAt: new Date().toISOString() };
      setUser(updatedUser);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      try {
        await dbService.saveBodyWeight({ id: entry.id, user_id: user.id, weight, date: entry.date, notes });
        await dbService.upsertProfile({ id: user.id, weight });
      } catch (err) { console.log('Supabase body weight save failed:', err); }
    }
  };

  const deleteBodyWeight = async (id: string) => {
    const updated = bodyWeights.filter(bw => bw.id !== id);
    setBodyWeights(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.BODY_WEIGHTS, JSON.stringify(updated));
    try { await dbService.deleteBodyWeight(id); } catch (err) { console.log('Supabase delete body weight failed:', err); }
  };

  // ========================================
  // Measurements
  // ========================================

  const addMeasurement = async (measurement: Omit<BodyMeasurement, 'id' | 'userId' | 'date'>) => {
    const entry: BodyMeasurement = { ...measurement, id: uuidv4(), userId: user?.id || '', date: new Date().toISOString() };
    const updated = [entry, ...measurements];
    setMeasurements(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.MEASUREMENTS, JSON.stringify(updated));
    try {
      if (user) await dbService.saveMeasurement({
        id: entry.id, user_id: user.id, date: entry.date,
        chest: entry.chest, arms: entry.arms, waist: entry.waist, legs: entry.legs, notes: entry.notes,
      });
    } catch (err) { console.log('Supabase measurement save failed:', err); }
  };

  const deleteMeasurement = async (id: string) => {
    const updated = measurements.filter(m => m.id !== id);
    setMeasurements(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.MEASUREMENTS, JSON.stringify(updated));
    try { await dbService.deleteMeasurement(id); } catch (err) { console.log('Supabase delete measurement failed:', err); }
  };

  // ========================================
  // Progress Photos
  // ========================================

  const addProgressPhoto = async (photo: Omit<ProgressPhoto, 'id' | 'userId' | 'date'>) => {
    const photoId = uuidv4();
    let cloudUri = photo.uri;
    try { if (user) cloudUri = await storageService.uploadProgressPhoto(user.id, photo.uri, photoId); }
    catch (err) { console.log('Photo upload failed, keeping local URI:', err); }
    const entry: ProgressPhoto = { ...photo, id: photoId, uri: cloudUri, userId: user?.id || '', date: new Date().toISOString() };
    const updated = [entry, ...progressPhotos];
    setProgressPhotos(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(updated));
  };

  const deleteProgressPhoto = async (id: string) => {
    const updated = progressPhotos.filter(p => p.id !== id);
    setProgressPhotos(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(updated));
    try { if (user) await storageService.deleteProgressPhoto(user.id, id); } catch (err) { console.log('Photo delete failed:', err); }
  };

  // ========================================
  // Personal Records
  // ========================================

  const checkPersonalRecords = async (workout: Workout) => {
    const newRecords: PersonalRecord[] = [];
    for (const exercise of workout.exercises) {
      for (const set of exercise.sets) {
        if (set.isCompleted && set.weight && set.reps) {
          const existing = personalRecords.find(r => r.exerciseId === exercise.exerciseId);
          const oneRepMax = set.weight * (1 + set.reps / 30);
          if (!existing || (existing.oneRepMax && oneRepMax > existing.oneRepMax)) {
            newRecords.push({
              id: uuidv4(), userId: user?.id || '', exerciseId: exercise.exerciseId,
              exerciseName: exercise.exerciseName, weight: set.weight, reps: set.reps,
              date: workout.date, oneRepMax,
            });
          }
        }
      }
    }
    if (newRecords.length > 0) {
      const updatedRecords = [...personalRecords.filter(r => !newRecords.some(nr => nr.exerciseId === r.exerciseId)), ...newRecords];
      setPersonalRecords(updatedRecords);
      await AsyncStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(updatedRecords));
      try {
        if (user) for (const r of newRecords) {
          await dbService.savePersonalRecord({
            id: r.id, user_id: user.id, exercise_id: r.exerciseId,
            exercise_name: r.exerciseName, weight: r.weight, reps: r.reps,
            date: r.date, one_rep_max: r.oneRepMax,
          });
        }
      } catch (err) { console.log('Supabase PR save failed:', err); }
    }
  };

  // ========================================
  // Goals
  // ========================================

  const addGoal = async (goalData: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'isCompleted'>) => {
    const goal: Goal = { ...goalData, id: uuidv4(), userId: user?.id || '', createdAt: new Date().toISOString(), isCompleted: false };
    const updated = [goal, ...goals];
    setGoals(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(updated));
    try {
      if (user) await dbService.saveGoal({
        id: goal.id, user_id: user.id, type: goal.type, title: goal.title,
        description: goal.description, target_value: goal.targetValue,
        current_value: goal.currentValue, unit: goal.unit, deadline: goal.deadline,
        is_completed: false,
      });
    } catch (err) { console.log('Supabase goal save failed:', err); }
  };

  const updateGoalFn = async (id: string, updates: Partial<Goal>) => {
    const updated = goals.map(g => g.id === id ? { ...g, ...updates } : g);
    setGoals(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(updated));
    try {
      const dbUpdates: Record<string, any> = {};
      if (updates.isCompleted !== undefined) dbUpdates.is_completed = updates.isCompleted;
      if (updates.currentValue !== undefined) dbUpdates.current_value = updates.currentValue;
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (Object.keys(dbUpdates).length) await dbService.updateGoal(id, dbUpdates);
    } catch (err) { console.log('Supabase goal update failed:', err); }
  };

  const deleteGoal = async (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
    await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals.filter(g => g.id !== id)));
    try { await dbService.deleteGoal(id); } catch (err) { console.log('Supabase goal delete failed:', err); }
  };

  // ========================================
  // Templates
  // ========================================

  const saveTemplateFn = async (templateData: Omit<WorkoutTemplate, 'id' | 'userId' | 'createdAt' | 'timesUsed'>) => {
    const template: WorkoutTemplate = { ...templateData, id: uuidv4(), userId: user?.id || '', createdAt: new Date().toISOString(), timesUsed: 0 };
    const updated = [template, ...templates];
    setTemplates(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(updated));
    try {
      if (user) await dbService.saveTemplate({
        id: template.id, user_id: user.id, name: template.name,
        exercises: template.exercises, times_used: 0,
      });
    } catch (err) { console.log('Supabase template save failed:', err); }
  };

  const deleteTemplate = async (id: string) => {
    setTemplates(templates.filter(t => t.id !== id));
    await AsyncStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates.filter(t => t.id !== id)));
    try { await dbService.deleteTemplate(id); } catch (err) { console.log('Supabase template delete failed:', err); }
  };

  // ========================================
  // Notifications (local only)
  // ========================================

  const updateNotificationSettingsFn = async (settings: Partial<NotificationSettings>) => {
    const updated = { ...notificationSettings, ...settings };
    setNotificationSettings(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
  };

  // ========================================
  // Helpers
  // ========================================

  const estimateCalories = (workout: Workout, durationSeconds: number): number => {
    const durationMinutes = durationSeconds / 60;
    const exerciseCount = workout.exercises.length || 1;
    const totalSets = workout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
    const intensityMultiplier = Math.min(1.5, 1 + (totalSets / exerciseCount) * 0.05);
    return Math.round(durationMinutes * 5 * intensityMultiplier);
  };

  // ========================================
  // Context Value
  // ========================================

  const value: AppContextType = {
    isAuthenticated, hasOnboarded, user, supabaseUser,
    signIn, signUp, signInWithGoogle, signInWithApple, handleOAuthCallback,
    signOut, sendPasswordReset, completeOnboarding,
    updateProfile: updateProfileFn, updateSubscription,
    workouts, activeWorkout, startWorkout, finishWorkout, cancelWorkout,
    addExerciseToWorkout, removeExerciseFromWorkout,
    addSetToExercise, removeSetFromExercise, updateSet, updateWorkoutNotes, deleteWorkout,
    exercises, addCustomExercise,
    bodyWeights, addBodyWeight, deleteBodyWeight,
    measurements, addMeasurement, deleteMeasurement,
    progressPhotos, addProgressPhoto, deleteProgressPhoto,
    personalRecords,
    goals, addGoal, updateGoal: updateGoalFn, deleteGoal,
    templates, saveTemplate: saveTemplateFn, deleteTemplate,
    notificationSettings, updateNotificationSettings: updateNotificationSettingsFn,
    isLoading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
