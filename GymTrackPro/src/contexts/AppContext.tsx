// ==========================================
// GymTrack Pro - App Data Context
// ==========================================

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
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
  FitnessGoal,
  ExperienceLevel,
  SubscriptionPlan,
} from '../types';
import { DEFAULT_EXERCISES } from '../constants/exercises';

// Storage Keys
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
  IS_AUTHENTICATED: '@gymtrack_is_authenticated',
  HAS_ONBOARDED: '@gymtrack_has_onboarded',
};

interface AppContextType {
  // Auth
  isAuthenticated: boolean;
  hasOnboarded: boolean;
  user: User | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, name: string) => Promise<boolean>;
  signOut: () => Promise<void>;
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

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [user, setUser] = useState<User | null>(null);
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

  // Load all data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [
        storedAuth,
        storedOnboarded,
        storedUser,
        storedWorkouts,
        storedExercises,
        storedBodyWeights,
        storedMeasurements,
        storedPhotos,
        storedRecords,
        storedGoals,
        storedTemplates,
        storedNotifications,
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.IS_AUTHENTICATED),
        AsyncStorage.getItem(STORAGE_KEYS.HAS_ONBOARDED),
        AsyncStorage.getItem(STORAGE_KEYS.USER),
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

      if (storedAuth) setIsAuthenticated(JSON.parse(storedAuth));
      if (storedOnboarded) setHasOnboarded(JSON.parse(storedOnboarded));
      if (storedUser) setUser(JSON.parse(storedUser));
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
      console.log('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ---- Authentication ----

  const signIn = async (email: string, _password: string): Promise<boolean> => {
    try {
      // In a production app, this would call Firebase Auth
      const storedUser = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.email === email) {
          setUser(parsedUser);
          setIsAuthenticated(true);
          await AsyncStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, JSON.stringify(true));
          return true;
        }
      }
      // Create user if not exists (demo mode)
      const newUser: User = {
        id: uuidv4(),
        email,
        displayName: email.split('@')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        profile: {
          name: email.split('@')[0],
          age: null,
          height: null,
          weight: null,
          goal: 'muscle_gain',
          experienceLevel: 'beginner',
          units: 'metric',
        },
        subscription: 'free',
      };
      setUser(newUser);
      setIsAuthenticated(true);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
      await AsyncStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, JSON.stringify(true));
      return true;
    } catch (error) {
      console.log('Sign in error:', error);
      return false;
    }
  };

  const signUp = async (email: string, _password: string, name: string): Promise<boolean> => {
    try {
      const newUser: User = {
        id: uuidv4(),
        email,
        displayName: name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        profile: {
          name,
          age: null,
          height: null,
          weight: null,
          goal: 'muscle_gain',
          experienceLevel: 'beginner',
          units: 'metric',
        },
        subscription: 'free',
      };
      setUser(newUser);
      setIsAuthenticated(true);
      setHasOnboarded(false);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
      await AsyncStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, JSON.stringify(true));
      return true;
    } catch (error) {
      console.log('Sign up error:', error);
      return false;
    }
  };

  const signOut = async () => {
    setIsAuthenticated(false);
    setHasOnboarded(false);
    setUser(null);
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

  const completeOnboarding = async (profile: Partial<UserProfile>) => {
    if (user) {
      const updatedUser = {
        ...user,
        profile: { ...user.profile, ...profile },
        updatedAt: new Date().toISOString(),
      };
      setUser(updatedUser);
      setHasOnboarded(true);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      await AsyncStorage.setItem(STORAGE_KEYS.HAS_ONBOARDED, JSON.stringify(true));
    }
  };

  // ---- User Profile ----

  const updateProfile = async (profile: Partial<UserProfile>) => {
    if (user) {
      const updatedUser = {
        ...user,
        profile: { ...user.profile, ...profile },
        displayName: profile.name || user.displayName,
        updatedAt: new Date().toISOString(),
      };
      setUser(updatedUser);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
    }
  };

  const updateSubscription = async (plan: SubscriptionPlan) => {
    if (user) {
      const updatedUser = { ...user, subscription: plan, updatedAt: new Date().toISOString() };
      setUser(updatedUser);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
    }
  };

  // ---- Workouts ----

  const startWorkout = (name: string, _templateId?: string): Workout => {
    const now = new Date().toISOString();
    const workout: Workout = {
      id: uuidv4(),
      userId: user?.id || '',
      name,
      date: now.split('T')[0],
      startTime: now,
      exercises: [],
      isCompleted: false,
      createdAt: now,
    };
    setActiveWorkout(workout);
    return workout;
  };

  const finishWorkout = async (workoutId: string) => {
    if (activeWorkout && activeWorkout.id === workoutId) {
      const now = new Date();
      const start = new Date(activeWorkout.startTime);
      const duration = Math.round((now.getTime() - start.getTime()) / 1000);
      const completedWorkout: Workout = {
        ...activeWorkout,
        endTime: now.toISOString(),
        duration,
        isCompleted: true,
        caloriesEstimate: estimateCalories(activeWorkout, duration),
      };

      const updatedWorkouts = [completedWorkout, ...workouts];
      setWorkouts(updatedWorkouts);
      setActiveWorkout(null);
      await AsyncStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(updatedWorkouts));

      // Check for personal records
      await checkPersonalRecords(completedWorkout);
    }
  };

  const cancelWorkout = () => {
    setActiveWorkout(null);
  };

  const addExerciseToWorkout = (workoutId: string, exercise: Exercise) => {
    if (activeWorkout && activeWorkout.id === workoutId) {
      const workoutExercise: WorkoutExercise = {
        id: uuidv4(),
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        muscleGroup: exercise.muscleGroup,
        sets: [
          {
            id: uuidv4(),
            setNumber: 1,
            reps: null,
            weight: null,
            isCompleted: false,
            type: 'normal',
          },
        ],
        restTimerSeconds: 90,
        order: activeWorkout.exercises.length,
      };
      setActiveWorkout({
        ...activeWorkout,
        exercises: [...activeWorkout.exercises, workoutExercise],
      });
    }
  };

  const removeExerciseFromWorkout = (workoutId: string, exerciseId: string) => {
    if (activeWorkout && activeWorkout.id === workoutId) {
      setActiveWorkout({
        ...activeWorkout,
        exercises: activeWorkout.exercises.filter(e => e.id !== exerciseId),
      });
    }
  };

  const addSetToExercise = (workoutId: string, exerciseId: string) => {
    if (activeWorkout && activeWorkout.id === workoutId) {
      const updatedExercises = activeWorkout.exercises.map(ex => {
        if (ex.id === exerciseId) {
          const lastSet = ex.sets[ex.sets.length - 1];
          return {
            ...ex,
            sets: [
              ...ex.sets,
              {
                id: uuidv4(),
                setNumber: ex.sets.length + 1,
                reps: lastSet?.reps || null,
                weight: lastSet?.weight || null,
                isCompleted: false,
                type: 'normal' as const,
              },
            ],
          };
        }
        return ex;
      });
      setActiveWorkout({ ...activeWorkout, exercises: updatedExercises });
    }
  };

  const removeSetFromExercise = (workoutId: string, exerciseId: string, setId: string) => {
    if (activeWorkout && activeWorkout.id === workoutId) {
      const updatedExercises = activeWorkout.exercises.map(ex => {
        if (ex.id === exerciseId) {
          const filteredSets = ex.sets.filter(s => s.id !== setId);
          return {
            ...ex,
            sets: filteredSets.map((s, i) => ({ ...s, setNumber: i + 1 })),
          };
        }
        return ex;
      });
      setActiveWorkout({ ...activeWorkout, exercises: updatedExercises });
    }
  };

  const updateSet = (workoutId: string, exerciseId: string, setId: string, updates: Partial<ExerciseSet>) => {
    if (activeWorkout && activeWorkout.id === workoutId) {
      const updatedExercises = activeWorkout.exercises.map(ex => {
        if (ex.id === exerciseId) {
          return {
            ...ex,
            sets: ex.sets.map(s => (s.id === setId ? { ...s, ...updates } : s)),
          };
        }
        return ex;
      });
      setActiveWorkout({ ...activeWorkout, exercises: updatedExercises });
    }
  };

  const updateWorkoutNotes = (workoutId: string, notes: string) => {
    if (activeWorkout && activeWorkout.id === workoutId) {
      setActiveWorkout({ ...activeWorkout, notes });
    }
  };

  const deleteWorkout = async (workoutId: string) => {
    const updated = workouts.filter(w => w.id !== workoutId);
    setWorkouts(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(updated));
  };

  // ---- Exercises ----

  const addCustomExercise = async (exerciseData: Omit<Exercise, 'id' | 'isCustom'>): Promise<Exercise> => {
    const exercise: Exercise = { ...exerciseData, id: uuidv4(), isCustom: true };
    const customExercises = exercises.filter(e => e.isCustom);
    const updatedCustom = [...customExercises, exercise];
    setExercises([...DEFAULT_EXERCISES, ...updatedCustom]);
    await AsyncStorage.setItem(STORAGE_KEYS.EXERCISES, JSON.stringify(updatedCustom));
    return exercise;
  };

  // ---- Body Weights ----

  const addBodyWeight = async (weight: number, notes?: string) => {
    const entry: BodyWeight = {
      id: uuidv4(),
      userId: user?.id || '',
      weight,
      date: new Date().toISOString(),
      notes,
    };
    const updated = [entry, ...bodyWeights];
    setBodyWeights(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.BODY_WEIGHTS, JSON.stringify(updated));

    // Update user profile weight
    if (user) {
      const updatedUser = {
        ...user,
        profile: { ...user.profile, weight },
        updatedAt: new Date().toISOString(),
      };
      setUser(updatedUser);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
    }
  };

  const deleteBodyWeight = async (id: string) => {
    const updated = bodyWeights.filter(bw => bw.id !== id);
    setBodyWeights(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.BODY_WEIGHTS, JSON.stringify(updated));
  };

  // ---- Measurements ----

  const addMeasurement = async (measurement: Omit<BodyMeasurement, 'id' | 'userId' | 'date'>) => {
    const entry: BodyMeasurement = {
      ...measurement,
      id: uuidv4(),
      userId: user?.id || '',
      date: new Date().toISOString(),
    };
    const updated = [entry, ...measurements];
    setMeasurements(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.MEASUREMENTS, JSON.stringify(updated));
  };

  const deleteMeasurement = async (id: string) => {
    const updated = measurements.filter(m => m.id !== id);
    setMeasurements(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.MEASUREMENTS, JSON.stringify(updated));
  };

  // ---- Progress Photos ----

  const addProgressPhoto = async (photo: Omit<ProgressPhoto, 'id' | 'userId' | 'date'>) => {
    const entry: ProgressPhoto = {
      ...photo,
      id: uuidv4(),
      userId: user?.id || '',
      date: new Date().toISOString(),
    };
    const updated = [entry, ...progressPhotos];
    setProgressPhotos(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(updated));
  };

  const deleteProgressPhoto = async (id: string) => {
    const updated = progressPhotos.filter(p => p.id !== id);
    setProgressPhotos(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(updated));
  };

  // ---- Personal Records ----

  const checkPersonalRecords = async (workout: Workout) => {
    const newRecords: PersonalRecord[] = [];

    for (const exercise of workout.exercises) {
      for (const set of exercise.sets) {
        if (set.isCompleted && set.weight && set.reps) {
          const existingRecord = personalRecords.find(
            r => r.exerciseId === exercise.exerciseId
          );
          const oneRepMax = set.weight * (1 + set.reps / 30);

          if (!existingRecord || (existingRecord.oneRepMax && oneRepMax > existingRecord.oneRepMax)) {
            const record: PersonalRecord = {
              id: uuidv4(),
              userId: user?.id || '',
              exerciseId: exercise.exerciseId,
              exerciseName: exercise.exerciseName,
              weight: set.weight,
              reps: set.reps,
              date: workout.date,
              oneRepMax,
            };
            newRecords.push(record);
          }
        }
      }
    }

    if (newRecords.length > 0) {
      const updatedRecords = [
        ...personalRecords.filter(
          r => !newRecords.some(nr => nr.exerciseId === r.exerciseId)
        ),
        ...newRecords,
      ];
      setPersonalRecords(updatedRecords);
      await AsyncStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(updatedRecords));
    }
  };

  // ---- Goals ----

  const addGoal = async (goalData: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'isCompleted'>) => {
    const goal: Goal = {
      ...goalData,
      id: uuidv4(),
      userId: user?.id || '',
      createdAt: new Date().toISOString(),
      isCompleted: false,
    };
    const updated = [goal, ...goals];
    setGoals(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(updated));
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    const updated = goals.map(g => (g.id === id ? { ...g, ...updates } : g));
    setGoals(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(updated));
  };

  const deleteGoal = async (id: string) => {
    const updated = goals.filter(g => g.id !== id);
    setGoals(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(updated));
  };

  // ---- Templates ----

  const saveTemplate = async (templateData: Omit<WorkoutTemplate, 'id' | 'userId' | 'createdAt' | 'timesUsed'>) => {
    const template: WorkoutTemplate = {
      ...templateData,
      id: uuidv4(),
      userId: user?.id || '',
      createdAt: new Date().toISOString(),
      timesUsed: 0,
    };
    const updated = [template, ...templates];
    setTemplates(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(updated));
  };

  const deleteTemplate = async (id: string) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(updated));
  };

  // ---- Notifications ----

  const updateNotificationSettings = async (settings: Partial<NotificationSettings>) => {
    const updated = { ...notificationSettings, ...settings };
    setNotificationSettings(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
  };

  // ---- Helpers ----

  const estimateCalories = (workout: Workout, durationSeconds: number): number => {
    // Simple calorie estimation based on workout duration and intensity
    const durationMinutes = durationSeconds / 60;
    const baseBurnPerMinute = 5; // average for weight training
    const exerciseCount = workout.exercises.length;
    const totalSets = workout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
    const intensityMultiplier = Math.min(1.5, 1 + (totalSets / exerciseCount) * 0.05);
    return Math.round(durationMinutes * baseBurnPerMinute * intensityMultiplier);
  };

  const value: AppContextType = {
    isAuthenticated,
    hasOnboarded,
    user,
    signIn,
    signUp,
    signOut,
    completeOnboarding,
    updateProfile,
    updateSubscription,
    workouts,
    activeWorkout,
    startWorkout,
    finishWorkout,
    cancelWorkout,
    addExerciseToWorkout,
    removeExerciseFromWorkout,
    addSetToExercise,
    removeSetFromExercise,
    updateSet,
    updateWorkoutNotes,
    deleteWorkout,
    exercises,
    addCustomExercise,
    bodyWeights,
    addBodyWeight,
    deleteBodyWeight,
    measurements,
    addMeasurement,
    deleteMeasurement,
    progressPhotos,
    addProgressPhoto,
    deleteProgressPhoto,
    personalRecords,
    goals,
    addGoal,
    updateGoal,
    deleteGoal,
    templates,
    saveTemplate,
    deleteTemplate,
    notificationSettings,
    updateNotificationSettings,
    isLoading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
