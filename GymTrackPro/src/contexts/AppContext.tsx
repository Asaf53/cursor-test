// ==========================================
// GymTrack Pro - App Data Context
// Firebase-integrated with AsyncStorage cache
// ==========================================

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { User as FirebaseUser } from 'firebase/auth';
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
import { authService, firestoreService, storageService } from '../services/firebase';

// Storage Keys (used as local cache)
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
  firebaseUser: FirebaseUser | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, name: string) => Promise<boolean>;
  signInWithGoogle: (idToken: string) => Promise<boolean>;
  signInWithApple: (identityToken: string, nonce: string) => Promise<boolean>;
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

// ---- Helper: build our internal User from a Firebase user ----
const buildUser = (fbUser: FirebaseUser, profile?: Partial<UserProfile>): User => ({
  id: fbUser.uid,
  email: fbUser.email || '',
  displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
  photoURL: fbUser.photoURL || undefined,
  createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  profile: {
    name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
    age: null,
    height: null,
    weight: null,
    goal: 'muscle_gain',
    experienceLevel: 'beginner',
    units: 'metric',
    ...profile,
  },
  subscription: 'free',
});

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
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
  // Firebase Auth State Listener
  // ========================================
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        setIsAuthenticated(true);
        await handleUserLogin(fbUser);
      } else {
        setFirebaseUser(null);
        setIsAuthenticated(false);
        setUser(null);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  /**
   * Called when Firebase confirms a user is logged in.
   * Loads their profile from Firestore (or local cache), then loads all data.
   */
  const handleUserLogin = async (fbUser: FirebaseUser) => {
    try {
      // 1. Load local cache first for instant UI
      await loadLocalCache();

      // 2. Try to get Firestore profile
      let firestoreProfile: any = null;
      try {
        firestoreProfile = await firestoreService.getUserProfile(fbUser.uid);
      } catch (err) {
        console.log('Firestore profile fetch failed (offline?), using cache:', err);
      }

      if (firestoreProfile) {
        const appUser: User = {
          id: fbUser.uid,
          email: fbUser.email || '',
          displayName: firestoreProfile.displayName || fbUser.displayName || '',
          photoURL: firestoreProfile.photoURL || fbUser.photoURL || undefined,
          createdAt: firestoreProfile.createdAt?.toDate?.()?.toISOString?.() || fbUser.metadata.creationTime || '',
          updatedAt: firestoreProfile.updatedAt?.toDate?.()?.toISOString?.() || '',
          profile: firestoreProfile.profile || {
            name: firestoreProfile.displayName || '',
            age: null, height: null, weight: null,
            goal: 'muscle_gain', experienceLevel: 'beginner', units: 'metric',
          },
          subscription: firestoreProfile.subscription || 'free',
        };
        setUser(appUser);
        setHasOnboarded(firestoreProfile.hasOnboarded ?? false);
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(appUser));
        await AsyncStorage.setItem(STORAGE_KEYS.HAS_ONBOARDED, JSON.stringify(firestoreProfile.hasOnboarded ?? false));
      } else {
        // No Firestore profile yet -- use cached or build fresh
        const cached = await AsyncStorage.getItem(STORAGE_KEYS.USER);
        if (cached) {
          setUser(JSON.parse(cached));
        } else {
          const newUser = buildUser(fbUser);
          setUser(newUser);
          await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
        }
        const onboarded = await AsyncStorage.getItem(STORAGE_KEYS.HAS_ONBOARDED);
        setHasOnboarded(onboarded ? JSON.parse(onboarded) : false);
      }

      // 3. Background-sync collections from Firestore
      syncFromFirestore(fbUser.uid);
    } catch (error) {
      console.log('handleUserLogin error:', error);
    }
  };

  /**
   * Load everything from local AsyncStorage (fast, offline-first)
   */
  const loadLocalCache = async () => {
    try {
      const [
        storedUser,
        storedOnboarded,
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

  /**
   * Pull latest data from Firestore and merge into state + local cache.
   * Runs in the background so the UI isn't blocked.
   */
  const syncFromFirestore = async (userId: string) => {
    try {
      const [
        fsWorkouts,
        fsBodyWeights,
        fsMeasurements,
        fsRecords,
        fsGoals,
        fsTemplates,
        fsExercises,
        fsNotifications,
      ] = await Promise.allSettled([
        firestoreService.getWorkouts(userId),
        firestoreService.getBodyWeights(userId),
        firestoreService.getMeasurements(userId),
        firestoreService.getPersonalRecords(userId),
        firestoreService.getGoals(userId),
        firestoreService.getTemplates(userId),
        firestoreService.getCustomExercises(userId),
        firestoreService.getNotificationSettings(userId),
      ]);

      if (fsWorkouts.status === 'fulfilled' && fsWorkouts.value.length > 0) {
        setWorkouts(fsWorkouts.value as Workout[]);
        await AsyncStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(fsWorkouts.value));
      }
      if (fsBodyWeights.status === 'fulfilled' && fsBodyWeights.value.length > 0) {
        setBodyWeights(fsBodyWeights.value as BodyWeight[]);
        await AsyncStorage.setItem(STORAGE_KEYS.BODY_WEIGHTS, JSON.stringify(fsBodyWeights.value));
      }
      if (fsMeasurements.status === 'fulfilled' && fsMeasurements.value.length > 0) {
        setMeasurements(fsMeasurements.value as BodyMeasurement[]);
        await AsyncStorage.setItem(STORAGE_KEYS.MEASUREMENTS, JSON.stringify(fsMeasurements.value));
      }
      if (fsRecords.status === 'fulfilled' && fsRecords.value.length > 0) {
        setPersonalRecords(fsRecords.value as PersonalRecord[]);
        await AsyncStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(fsRecords.value));
      }
      if (fsGoals.status === 'fulfilled' && fsGoals.value.length > 0) {
        setGoals(fsGoals.value as Goal[]);
        await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(fsGoals.value));
      }
      if (fsTemplates.status === 'fulfilled' && fsTemplates.value.length > 0) {
        setTemplates(fsTemplates.value as WorkoutTemplate[]);
        await AsyncStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(fsTemplates.value));
      }
      if (fsExercises.status === 'fulfilled' && fsExercises.value.length > 0) {
        const custom = fsExercises.value as Exercise[];
        setExercises([...DEFAULT_EXERCISES, ...custom]);
        await AsyncStorage.setItem(STORAGE_KEYS.EXERCISES, JSON.stringify(custom));
      }
      if (fsNotifications.status === 'fulfilled' && fsNotifications.value) {
        setNotificationSettings(fsNotifications.value as NotificationSettings);
        await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(fsNotifications.value));
      }
    } catch (error) {
      console.log('syncFromFirestore error (non-critical):', error);
    }
  };

  // ========================================
  // Authentication
  // ========================================

  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      await authService.signInWithEmail(email, password);
      // onAuthStateChanged will fire and call handleUserLogin
      return true;
    } catch (error: any) {
      console.log('Sign in error:', error.code, error.message);
      return false;
    }
  };

  const signUp = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      const fbUser = await authService.signUpWithEmail(email, password, name);
      // Create Firestore user profile
      const newUser = buildUser(fbUser, { name });
      await firestoreService.createUserProfile(fbUser.uid, {
        displayName: name,
        email,
        profile: newUser.profile,
        subscription: 'free',
        hasOnboarded: false,
      });
      setUser(newUser);
      setHasOnboarded(false);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
      await AsyncStorage.setItem(STORAGE_KEYS.HAS_ONBOARDED, JSON.stringify(false));
      return true;
    } catch (error: any) {
      console.log('Sign up error:', error.code, error.message);
      return false;
    }
  };

  const signInWithGoogle = async (idToken: string): Promise<boolean> => {
    try {
      const fbUser = await authService.signInWithGoogle(idToken);
      // Check if profile exists; create if new
      const existing = await firestoreService.getUserProfile(fbUser.uid);
      if (!existing) {
        const newUser = buildUser(fbUser);
        await firestoreService.createUserProfile(fbUser.uid, {
          displayName: fbUser.displayName || '',
          email: fbUser.email || '',
          photoURL: fbUser.photoURL || '',
          profile: newUser.profile,
          subscription: 'free',
          hasOnboarded: false,
        });
      }
      return true;
    } catch (error: any) {
      console.log('Google sign-in error:', error.code, error.message);
      return false;
    }
  };

  const signInWithApple = async (identityToken: string, nonce: string): Promise<boolean> => {
    try {
      const fbUser = await authService.signInWithApple(identityToken, nonce);
      const existing = await firestoreService.getUserProfile(fbUser.uid);
      if (!existing) {
        const newUser = buildUser(fbUser);
        await firestoreService.createUserProfile(fbUser.uid, {
          displayName: fbUser.displayName || '',
          email: fbUser.email || '',
          profile: newUser.profile,
          subscription: 'free',
          hasOnboarded: false,
        });
      }
      return true;
    } catch (error: any) {
      console.log('Apple sign-in error:', error.code, error.message);
      return false;
    }
  };

  const signOut = async () => {
    try {
      await authService.signOut();
    } catch (error) {
      console.log('Sign out error:', error);
    }
    setIsAuthenticated(false);
    setHasOnboarded(false);
    setUser(null);
    setFirebaseUser(null);
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
    try {
      await authService.sendPasswordReset(email);
      return true;
    } catch (error) {
      console.log('Password reset error:', error);
      return false;
    }
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

      // Persist to Firestore
      try {
        await firestoreService.updateUserProfile(user.id, {
          profile: updatedUser.profile,
          hasOnboarded: true,
        });
      } catch (err) {
        console.log('Firestore onboarding update failed (will sync later):', err);
      }
    }
  };

  // ========================================
  // User Profile
  // ========================================

  const updateProfileFn = async (profile: Partial<UserProfile>) => {
    if (user) {
      const updatedUser = {
        ...user,
        profile: { ...user.profile, ...profile },
        displayName: profile.name || user.displayName,
        updatedAt: new Date().toISOString(),
      };
      setUser(updatedUser);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));

      try {
        await firestoreService.updateUserProfile(user.id, {
          profile: updatedUser.profile,
          displayName: updatedUser.displayName,
        });
      } catch (err) {
        console.log('Firestore profile update failed:', err);
      }
    }
  };

  const updateSubscription = async (plan: SubscriptionPlan) => {
    if (user) {
      const updatedUser = { ...user, subscription: plan, updatedAt: new Date().toISOString() };
      setUser(updatedUser);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      try {
        await firestoreService.updateUserProfile(user.id, { subscription: plan });
      } catch (err) {
        console.log('Firestore subscription update failed:', err);
      }
    }
  };

  // ========================================
  // Workouts
  // ========================================

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

      // Save to Firestore
      try {
        if (user) await firestoreService.saveWorkout(user.id, completedWorkout);
      } catch (err) {
        console.log('Firestore workout save failed:', err);
      }

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
    try {
      if (user) await firestoreService.deleteWorkout(user.id, workoutId);
    } catch (err) {
      console.log('Firestore workout delete failed:', err);
    }
  };

  // ========================================
  // Exercises
  // ========================================

  const addCustomExercise = async (exerciseData: Omit<Exercise, 'id' | 'isCustom'>): Promise<Exercise> => {
    const exercise: Exercise = { ...exerciseData, id: uuidv4(), isCustom: true };
    const customExercises = exercises.filter(e => e.isCustom);
    const updatedCustom = [...customExercises, exercise];
    setExercises([...DEFAULT_EXERCISES, ...updatedCustom]);
    await AsyncStorage.setItem(STORAGE_KEYS.EXERCISES, JSON.stringify(updatedCustom));
    try {
      if (user) await firestoreService.saveCustomExercise(user.id, exercise);
    } catch (err) {
      console.log('Firestore exercise save failed:', err);
    }
    return exercise;
  };

  // ========================================
  // Body Weights
  // ========================================

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
      try {
        await firestoreService.saveBodyWeight(user.id, entry);
        await firestoreService.updateUserProfile(user.id, { 'profile.weight': weight });
      } catch (err) {
        console.log('Firestore body weight save failed:', err);
      }
    }
  };

  const deleteBodyWeight = async (id: string) => {
    const updated = bodyWeights.filter(bw => bw.id !== id);
    setBodyWeights(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.BODY_WEIGHTS, JSON.stringify(updated));
    try {
      if (user) await firestoreService.deleteBodyWeight(user.id, id);
    } catch (err) {
      console.log('Firestore body weight delete failed:', err);
    }
  };

  // ========================================
  // Measurements
  // ========================================

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
    try {
      if (user) await firestoreService.saveMeasurement(user.id, entry);
    } catch (err) {
      console.log('Firestore measurement save failed:', err);
    }
  };

  const deleteMeasurement = async (id: string) => {
    const updated = measurements.filter(m => m.id !== id);
    setMeasurements(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.MEASUREMENTS, JSON.stringify(updated));
    try {
      if (user) await firestoreService.deleteMeasurement(user.id, id);
    } catch (err) {
      console.log('Firestore measurement delete failed:', err);
    }
  };

  // ========================================
  // Progress Photos
  // ========================================

  const addProgressPhoto = async (photo: Omit<ProgressPhoto, 'id' | 'userId' | 'date'>) => {
    const photoId = uuidv4();
    let cloudUri = photo.uri;

    // Upload to Firebase Storage
    try {
      if (user) {
        cloudUri = await storageService.uploadProgressPhoto(user.id, photo.uri, photoId);
      }
    } catch (err) {
      console.log('Photo upload to Firebase Storage failed, keeping local URI:', err);
    }

    const entry: ProgressPhoto = {
      ...photo,
      id: photoId,
      uri: cloudUri,
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
    try {
      if (user) await storageService.deleteProgressPhoto(user.id, id);
    } catch (err) {
      console.log('Firestore photo delete failed:', err);
    }
  };

  // ========================================
  // Personal Records
  // ========================================

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

      // Save each new record to Firestore
      try {
        if (user) {
          for (const record of newRecords) {
            await firestoreService.savePersonalRecord(user.id, record);
          }
        }
      } catch (err) {
        console.log('Firestore PR save failed:', err);
      }
    }
  };

  // ========================================
  // Goals
  // ========================================

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
    try {
      if (user) await firestoreService.saveGoal(user.id, goal);
    } catch (err) {
      console.log('Firestore goal save failed:', err);
    }
  };

  const updateGoalFn = async (id: string, updates: Partial<Goal>) => {
    const updated = goals.map(g => (g.id === id ? { ...g, ...updates } : g));
    setGoals(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(updated));
    try {
      if (user) await firestoreService.updateGoal(user.id, id, updates);
    } catch (err) {
      console.log('Firestore goal update failed:', err);
    }
  };

  const deleteGoal = async (id: string) => {
    const updated = goals.filter(g => g.id !== id);
    setGoals(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(updated));
    try {
      if (user) await firestoreService.deleteGoal(user.id, id);
    } catch (err) {
      console.log('Firestore goal delete failed:', err);
    }
  };

  // ========================================
  // Templates
  // ========================================

  const saveTemplateFn = async (templateData: Omit<WorkoutTemplate, 'id' | 'userId' | 'createdAt' | 'timesUsed'>) => {
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
    try {
      if (user) await firestoreService.saveTemplate(user.id, template);
    } catch (err) {
      console.log('Firestore template save failed:', err);
    }
  };

  const deleteTemplate = async (id: string) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(updated));
    try {
      if (user) await firestoreService.deleteTemplate(user.id, id);
    } catch (err) {
      console.log('Firestore template delete failed:', err);
    }
  };

  // ========================================
  // Notifications
  // ========================================

  const updateNotificationSettingsFn = async (settings: Partial<NotificationSettings>) => {
    const updated = { ...notificationSettings, ...settings };
    setNotificationSettings(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
    try {
      if (user) await firestoreService.saveNotificationSettings(user.id, updated);
    } catch (err) {
      console.log('Firestore notification settings save failed:', err);
    }
  };

  // ========================================
  // Helpers
  // ========================================

  const estimateCalories = (workout: Workout, durationSeconds: number): number => {
    const durationMinutes = durationSeconds / 60;
    const baseBurnPerMinute = 5;
    const exerciseCount = workout.exercises.length || 1;
    const totalSets = workout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
    const intensityMultiplier = Math.min(1.5, 1 + (totalSets / exerciseCount) * 0.05);
    return Math.round(durationMinutes * baseBurnPerMinute * intensityMultiplier);
  };

  // ========================================
  // Context Value
  // ========================================

  const value: AppContextType = {
    isAuthenticated,
    hasOnboarded,
    user,
    firebaseUser,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithApple,
    signOut,
    sendPasswordReset,
    completeOnboarding,
    updateProfile: updateProfileFn,
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
    updateGoal: updateGoalFn,
    deleteGoal,
    templates,
    saveTemplate: saveTemplateFn,
    deleteTemplate,
    notificationSettings,
    updateNotificationSettings: updateNotificationSettingsFn,
    isLoading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
