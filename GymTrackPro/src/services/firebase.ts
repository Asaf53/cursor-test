// ==========================================
// GymTrack Pro - Firebase Configuration
// ==========================================
//
// This file provides the Firebase setup template.
// To enable Firebase features, follow these steps:
//
// 1. Create a Firebase project at https://console.firebase.google.com
// 2. Enable Authentication (Email/Password, Google, Apple)
// 3. Set up Firestore Database
// 4. Set up Firebase Storage (for progress photos)
// 5. Enable Firebase Analytics
// 6. Install Firebase packages:
//    npx expo install @react-native-firebase/app @react-native-firebase/auth
//    npx expo install @react-native-firebase/firestore @react-native-firebase/storage
//    npx expo install @react-native-firebase/analytics
// 7. Replace the placeholder config below with your actual Firebase config
// 8. Download google-services.json (Android) and GoogleService-Info.plist (iOS)
//    and place them in the project root
//
// ==========================================

// Firebase configuration template
// Replace with your actual Firebase project configuration
export const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
  measurementId: 'YOUR_MEASUREMENT_ID',
};

// ==========================================
// Firebase Service Interfaces
// These would be used once Firebase is integrated
// ==========================================

export interface FirebaseAuthService {
  signInWithEmail: (email: string, password: string) => Promise<any>;
  signUpWithEmail: (email: string, password: string) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  signInWithApple: () => Promise<any>;
  signOut: () => Promise<void>;
  getCurrentUser: () => any;
  onAuthStateChanged: (callback: (user: any) => void) => () => void;
}

export interface FirestoreService {
  // Users
  createUser: (userId: string, data: any) => Promise<void>;
  getUser: (userId: string) => Promise<any>;
  updateUser: (userId: string, data: any) => Promise<void>;

  // Workouts
  saveWorkout: (userId: string, workout: any) => Promise<void>;
  getWorkouts: (userId: string) => Promise<any[]>;
  deleteWorkout: (userId: string, workoutId: string) => Promise<void>;

  // Body Data
  saveBodyWeight: (userId: string, data: any) => Promise<void>;
  getBodyWeights: (userId: string) => Promise<any[]>;
  saveMeasurement: (userId: string, data: any) => Promise<void>;
  getMeasurements: (userId: string) => Promise<any[]>;

  // Personal Records
  savePersonalRecord: (userId: string, data: any) => Promise<void>;
  getPersonalRecords: (userId: string) => Promise<any[]>;

  // Goals
  saveGoal: (userId: string, data: any) => Promise<void>;
  getGoals: (userId: string) => Promise<any[]>;
  updateGoal: (userId: string, goalId: string, data: any) => Promise<void>;
  deleteGoal: (userId: string, goalId: string) => Promise<void>;
}

export interface FirebaseStorageService {
  uploadProgressPhoto: (userId: string, uri: string) => Promise<string>;
  deleteProgressPhoto: (userId: string, photoUrl: string) => Promise<void>;
}

export interface FirebaseAnalyticsService {
  logEvent: (name: string, params?: Record<string, any>) => Promise<void>;
  logWorkoutCompleted: (workout: any) => Promise<void>;
  logPersonalRecord: (exercise: string, weight: number) => Promise<void>;
  logScreenView: (screenName: string) => Promise<void>;
}

// ==========================================
// Placeholder implementations
// Replace with actual Firebase SDK calls
// ==========================================

export const analyticsEvents = {
  WORKOUT_STARTED: 'workout_started',
  WORKOUT_COMPLETED: 'workout_completed',
  EXERCISE_ADDED: 'exercise_added',
  SET_COMPLETED: 'set_completed',
  PERSONAL_RECORD: 'personal_record',
  BODY_WEIGHT_LOGGED: 'body_weight_logged',
  MEASUREMENT_LOGGED: 'measurement_logged',
  PHOTO_UPLOADED: 'photo_uploaded',
  GOAL_CREATED: 'goal_created',
  GOAL_COMPLETED: 'goal_completed',
  SUBSCRIPTION_STARTED: 'subscription_started',
  PROFILE_UPDATED: 'profile_updated',
};
