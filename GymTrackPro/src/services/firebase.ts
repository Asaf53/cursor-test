// ==========================================
// GymTrack Pro - Firebase Configuration & Services
// ==========================================

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';

// ==========================================
// Firebase Configuration
// Extracted from GoogleService-Info.plist
// ==========================================
const firebaseConfig = {
  apiKey: 'AIzaSyA-hRe5Rvw_VoSgmGdI-CHnagUuxH5Jsgk',
  authDomain: 'gymtrackpro-dc0a4.firebaseapp.com',
  databaseURL: 'https://gymtrackpro-dc0a4-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'gymtrackpro-dc0a4',
  storageBucket: 'gymtrackpro-dc0a4.firebasestorage.app',
  messagingSenderId: '294195477862',
  appId: '1:294195477862:ios:5fe317782bc6a1a41adca7',
};

// Initialize Firebase (prevent double-initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };

// ==========================================
// Auth Service
// ==========================================

export const authService = {
  /**
   * Sign in with email & password
   */
  signInWithEmail: async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },

  /**
   * Sign up with email & password
   */
  signUpWithEmail: async (email: string, password: string, displayName: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });
    return userCredential.user;
  },

  /**
   * Sign in with Google credential
   * (The actual Google sign-in prompt is handled by expo-auth-session or
   *  @react-native-google-signin; this takes the resulting idToken.)
   */
  signInWithGoogle: async (idToken: string) => {
    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);
    return userCredential.user;
  },

  /**
   * Sign in with Apple credential
   * (The actual Apple sign-in prompt is handled by expo-apple-authentication;
   *  this takes the resulting identityToken and nonce.)
   */
  signInWithApple: async (identityToken: string, nonce: string) => {
    const provider = new OAuthProvider('apple.com');
    const credential = provider.credential({ idToken: identityToken, rawNonce: nonce });
    const userCredential = await signInWithCredential(auth, credential);
    return userCredential.user;
  },

  /**
   * Sign out
   */
  signOut: async () => {
    await firebaseSignOut(auth);
  },

  /**
   * Send password reset email
   */
  sendPasswordReset: async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  },

  /**
   * Get the currently signed-in user
   */
  getCurrentUser: (): FirebaseUser | null => {
    return auth.currentUser;
  },

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChanged: (callback: (user: FirebaseUser | null) => void) => {
    return onAuthStateChanged(auth, callback);
  },
};

// ==========================================
// Firestore Service
// ==========================================

export const firestoreService = {
  // ---- Users ----

  createUserProfile: async (userId: string, data: Record<string, any>) => {
    await setDoc(doc(db, 'users', userId), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  getUserProfile: async (userId: string) => {
    const docSnap = await getDoc(doc(db, 'users', userId));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  },

  updateUserProfile: async (userId: string, data: Record<string, any>) => {
    await updateDoc(doc(db, 'users', userId), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  // ---- Workouts ----

  saveWorkout: async (userId: string, workout: Record<string, any>) => {
    await setDoc(doc(db, 'users', userId, 'workouts', workout.id), {
      ...workout,
      createdAt: serverTimestamp(),
    });
  },

  getWorkouts: async (userId: string) => {
    const q = query(
      collection(db, 'users', userId, 'workouts'),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  deleteWorkout: async (userId: string, workoutId: string) => {
    await deleteDoc(doc(db, 'users', userId, 'workouts', workoutId));
  },

  // ---- Body Weights ----

  saveBodyWeight: async (userId: string, entry: Record<string, any>) => {
    await setDoc(doc(db, 'users', userId, 'bodyWeights', entry.id), {
      ...entry,
      createdAt: serverTimestamp(),
    });
  },

  getBodyWeights: async (userId: string) => {
    const q = query(
      collection(db, 'users', userId, 'bodyWeights'),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  deleteBodyWeight: async (userId: string, entryId: string) => {
    await deleteDoc(doc(db, 'users', userId, 'bodyWeights', entryId));
  },

  // ---- Measurements ----

  saveMeasurement: async (userId: string, entry: Record<string, any>) => {
    await setDoc(doc(db, 'users', userId, 'measurements', entry.id), {
      ...entry,
      createdAt: serverTimestamp(),
    });
  },

  getMeasurements: async (userId: string) => {
    const q = query(
      collection(db, 'users', userId, 'measurements'),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  deleteMeasurement: async (userId: string, entryId: string) => {
    await deleteDoc(doc(db, 'users', userId, 'measurements', entryId));
  },

  // ---- Personal Records ----

  savePersonalRecord: async (userId: string, record: Record<string, any>) => {
    await setDoc(doc(db, 'users', userId, 'personalRecords', record.id), {
      ...record,
      createdAt: serverTimestamp(),
    });
  },

  getPersonalRecords: async (userId: string) => {
    const snap = await getDocs(collection(db, 'users', userId, 'personalRecords'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  // ---- Goals ----

  saveGoal: async (userId: string, goal: Record<string, any>) => {
    await setDoc(doc(db, 'users', userId, 'goals', goal.id), {
      ...goal,
      createdAt: serverTimestamp(),
    });
  },

  getGoals: async (userId: string) => {
    const snap = await getDocs(collection(db, 'users', userId, 'goals'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  updateGoal: async (userId: string, goalId: string, data: Record<string, any>) => {
    await updateDoc(doc(db, 'users', userId, 'goals', goalId), data);
  },

  deleteGoal: async (userId: string, goalId: string) => {
    await deleteDoc(doc(db, 'users', userId, 'goals', goalId));
  },

  // ---- Templates ----

  saveTemplate: async (userId: string, template: Record<string, any>) => {
    await setDoc(doc(db, 'users', userId, 'templates', template.id), {
      ...template,
      createdAt: serverTimestamp(),
    });
  },

  getTemplates: async (userId: string) => {
    const snap = await getDocs(collection(db, 'users', userId, 'templates'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  deleteTemplate: async (userId: string, templateId: string) => {
    await deleteDoc(doc(db, 'users', userId, 'templates', templateId));
  },

  // ---- Custom Exercises ----

  saveCustomExercise: async (userId: string, exercise: Record<string, any>) => {
    await setDoc(doc(db, 'users', userId, 'customExercises', exercise.id), exercise);
  },

  getCustomExercises: async (userId: string) => {
    const snap = await getDocs(collection(db, 'users', userId, 'customExercises'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  // ---- Notification Settings ----

  saveNotificationSettings: async (userId: string, settings: Record<string, any>) => {
    await setDoc(doc(db, 'users', userId, 'settings', 'notifications'), settings);
  },

  getNotificationSettings: async (userId: string) => {
    const docSnap = await getDoc(doc(db, 'users', userId, 'settings', 'notifications'));
    return docSnap.exists() ? docSnap.data() : null;
  },
};

// ==========================================
// Storage Service
// ==========================================

export const storageService = {
  /**
   * Upload a progress photo and return the download URL
   */
  uploadProgressPhoto: async (userId: string, localUri: string, photoId: string): Promise<string> => {
    const response = await fetch(localUri);
    const blob = await response.blob();
    const storageRef = ref(storage, `users/${userId}/progress-photos/${photoId}.jpg`);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  },

  /**
   * Delete a progress photo from storage
   */
  deleteProgressPhoto: async (userId: string, photoId: string): Promise<void> => {
    const storageRef = ref(storage, `users/${userId}/progress-photos/${photoId}.jpg`);
    try {
      await deleteObject(storageRef);
    } catch (error) {
      // File may not exist in storage, that's ok
      console.log('Photo delete error (may not exist in cloud):', error);
    }
  },
};

// ==========================================
// Analytics Events
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
