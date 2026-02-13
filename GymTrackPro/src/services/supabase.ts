// ==========================================
// GymTrack Pro - Supabase Client & Services
// ==========================================

import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient, Session, User as SupabaseUser } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as aesjs from 'aes-js';

// ==========================================
// Secure storage adapter for Supabase Auth
// Uses expo-secure-store where available,
// falls back to AsyncStorage for large values
// ==========================================

class LargeSecureStore {
  private async _encrypt(key: string, value: string): Promise<string> {
    const encryptionKeyHex = await this._getOrCreateEncryptionKey(key);
    const keyBytes = aesjs.utils.hex.toBytes(encryptionKeyHex);
    const textBytes = aesjs.utils.utf8.toBytes(value);
    // Pad to 16-byte blocks
    const paddedBytes = aesjs.padding.pkcs7.pad(textBytes);
    const aesCtr = new aesjs.ModeOfOperation.ctr(keyBytes, new aesjs.Counter(1));
    const encryptedBytes = aesCtr.encrypt(paddedBytes);
    return aesjs.utils.hex.fromBytes(encryptedBytes);
  }

  private async _decrypt(key: string, value: string): Promise<string> {
    const encryptionKeyHex = await this._getOrCreateEncryptionKey(key);
    const keyBytes = aesjs.utils.hex.toBytes(encryptionKeyHex);
    const encryptedBytes = aesjs.utils.hex.toBytes(value);
    const aesCtr = new aesjs.ModeOfOperation.ctr(keyBytes, new aesjs.Counter(1));
    const decryptedBytes = aesCtr.decrypt(encryptedBytes);
    const unpaddedBytes = aesjs.padding.pkcs7.strip(decryptedBytes);
    return aesjs.utils.utf8.fromBytes(unpaddedBytes);
  }

  private async _getOrCreateEncryptionKey(name: string): Promise<string> {
    const storeKey = `encryption-key-${name}`;
    const existing = await SecureStore.getItemAsync(storeKey);
    if (existing) return existing;
    // Generate a random 256-bit key
    const randomBytes = Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 256)
    );
    const hex = aesjs.utils.hex.fromBytes(randomBytes);
    await SecureStore.setItemAsync(storeKey, hex);
    return hex;
  }

  async getItem(key: string): Promise<string | null> {
    const encrypted = await AsyncStorage.getItem(key);
    if (!encrypted) return null;
    try {
      return await this._decrypt(key, encrypted);
    } catch {
      // If decryption fails, return raw value (migration from unencrypted)
      return encrypted;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    const encrypted = await this._encrypt(key, value);
    await AsyncStorage.setItem(key, encrypted);
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }
}

// ==========================================
// Supabase Configuration
// ==========================================
// *** YOU MUST REPLACE THESE WITH YOUR REAL VALUES ***
//
// 1. Go to https://supabase.com/dashboard
// 2. Select your project
// 3. Go to Settings > API
// 4. Copy "Project URL" and "anon public" key
// ==========================================

const SUPABASE_URL = 'https://reaprhgaoqvjyujwldrq.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Detect placeholder credentials and warn loudly
const IS_CONFIGURED = !SUPABASE_URL.includes('YOUR_PROJECT_ID') && !SUPABASE_ANON_KEY.includes('YOUR_SUPABASE_ANON_KEY');

if (!IS_CONFIGURED) {
  console.error(
    '\n⚠️  SUPABASE NOT CONFIGURED ⚠️\n' +
    'Open src/services/supabase.ts and replace SUPABASE_ANON_KEY\n' +
    'with your anon key from: https://supabase.com/dashboard/project/reaprhgaoqvjyujwldrq/settings/api\n'
  );
}

const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: new LargeSecureStore(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export { supabase, IS_CONFIGURED };
export type { Session, SupabaseUser };

// ==========================================
// Error helper: normalise any thrown value
// into a proper Error with a human message
// ==========================================
function normaliseError(err: unknown): Error {
  // Already a proper Error (AuthApiError, etc.)
  if (err instanceof Error) return err;

  // Raw Response-like object (e.g. 504 gateway timeout)
  if (typeof err === 'object' && err !== null) {
    const obj = err as Record<string, any>;
    const status = obj.status || obj.statusCode;
    if (status === 504 || status === 502 || status === 503) {
      return new Error(
        'The server is temporarily unavailable. Your Supabase project may be paused — ' +
        'go to supabase.com/dashboard, select your project, and click "Restore" if prompted. ' +
        'Then try again.'
      );
    }
    if (status) {
      const text = obj.statusText || obj.message || 'Unknown error';
      return new Error(`Server error (${status}): ${text}`);
    }
    // Try to extract a message
    if (obj.message) return new Error(String(obj.message));
    if (obj.error_description) return new Error(String(obj.error_description));
    if (obj.msg) return new Error(String(obj.msg));
  }

  // String
  if (typeof err === 'string') return new Error(err);

  return new Error('An unexpected error occurred. Please try again.');
}

// ==========================================
// Auth Service
// ==========================================

export const authService = {
  /** Sign in with email & password */
  signInWithEmail: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    } catch (err) {
      throw normaliseError(err);
    }
  },

  /** Sign up with email & password.
   *  Returns { user, session, needsConfirmation }.
   *  If Supabase email confirmation is ON, session will be null. */
  signUpWithEmail: async (email: string, password: string, displayName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
          emailRedirectTo: 'gymtrackpro://auth/callback',
        },
      });
      if (error) throw error;
      // Supabase returns a user but no session when email confirmation is required.
      // It also returns a fake user with identities=[] if the email is already taken
      // and confirmation is enabled (to prevent email enumeration).
      const isAlreadyTaken =
        data.user &&
        data.user.identities &&
        data.user.identities.length === 0;
      if (isAlreadyTaken) {
        throw new Error('An account with this email already exists.');
      }
      return {
        user: data.user,
        session: data.session,
        needsConfirmation: data.user != null && data.session == null,
      };
    } catch (err) {
      throw normaliseError(err);
    }
  },

  /** Sign in with Google OAuth (opens browser) */
  signInWithGoogle: async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'gymtrackpro://auth/callback',
          skipBrowserRedirect: true,
        },
      });
      if (error) throw error;
      return data;
    } catch (err) {
      throw normaliseError(err);
    }
  },

  /** Sign in with Apple OAuth */
  signInWithApple: async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: 'gymtrackpro://auth/callback',
          skipBrowserRedirect: true,
        },
      });
      if (error) throw error;
      return data;
    } catch (err) {
      throw normaliseError(err);
    }
  },

  /** Set session from OAuth URL (after redirect back) */
  setSessionFromUrl: async (url: string) => {
    try {
      const params = new URLSearchParams(url.split('#')[1] || url.split('?')[1] || '');
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      if (accessToken && refreshToken) {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) throw error;
        return data;
      }
      throw new Error('No tokens found in redirect URL');
    } catch (err) {
      throw normaliseError(err);
    }
  },

  /** Sign out */
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      throw normaliseError(err);
    }
  },

  /** Resend the confirmation email for a user who signed up but hasn't verified */
  resendConfirmationEmail: async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: 'gymtrackpro://auth/callback',
        },
      });
      if (error) throw error;
    } catch (err) {
      throw normaliseError(err);
    }
  },

  /** Send password reset email */
  sendPasswordReset: async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'gymtrackpro://auth/reset',
      });
      if (error) throw error;
    } catch (err) {
      throw normaliseError(err);
    }
  },

  /** Get current session */
  getSession: async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    } catch (err) {
      throw normaliseError(err);
    }
  },

  /** Listen to auth state changes */
  onAuthStateChange: (callback: (event: string, session: Session | null) => void) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
    return subscription;
  },
};

// ==========================================
// Database Service (Supabase Postgres)
// ==========================================

export const dbService = {
  // ---- User Profiles ----

  getProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data;
  },

  upsertProfile: async (profile: Record<string, any>) => {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profile, { onConflict: 'id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ---- Workouts ----

  getWorkouts: async (userId: string) => {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  saveWorkout: async (workout: Record<string, any>) => {
    const { error } = await supabase.from('workouts').upsert(workout, { onConflict: 'id' });
    if (error) throw error;
  },

  deleteWorkout: async (workoutId: string) => {
    const { error } = await supabase.from('workouts').delete().eq('id', workoutId);
    if (error) throw error;
  },

  // ---- Body Weights ----

  getBodyWeights: async (userId: string) => {
    const { data, error } = await supabase
      .from('body_weights')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  saveBodyWeight: async (entry: Record<string, any>) => {
    const { error } = await supabase.from('body_weights').upsert(entry, { onConflict: 'id' });
    if (error) throw error;
  },

  deleteBodyWeight: async (entryId: string) => {
    const { error } = await supabase.from('body_weights').delete().eq('id', entryId);
    if (error) throw error;
  },

  // ---- Measurements ----

  getMeasurements: async (userId: string) => {
    const { data, error } = await supabase
      .from('measurements')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  saveMeasurement: async (entry: Record<string, any>) => {
    const { error } = await supabase.from('measurements').upsert(entry, { onConflict: 'id' });
    if (error) throw error;
  },

  deleteMeasurement: async (entryId: string) => {
    const { error } = await supabase.from('measurements').delete().eq('id', entryId);
    if (error) throw error;
  },

  // ---- Personal Records ----

  getPersonalRecords: async (userId: string) => {
    const { data, error } = await supabase
      .from('personal_records')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data || [];
  },

  savePersonalRecord: async (record: Record<string, any>) => {
    const { error } = await supabase.from('personal_records').upsert(record, { onConflict: 'id' });
    if (error) throw error;
  },

  // ---- Goals ----

  getGoals: async (userId: string) => {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  saveGoal: async (goal: Record<string, any>) => {
    const { error } = await supabase.from('goals').upsert(goal, { onConflict: 'id' });
    if (error) throw error;
  },

  updateGoal: async (goalId: string, updates: Record<string, any>) => {
    const { error } = await supabase.from('goals').update(updates).eq('id', goalId);
    if (error) throw error;
  },

  deleteGoal: async (goalId: string) => {
    const { error } = await supabase.from('goals').delete().eq('id', goalId);
    if (error) throw error;
  },

  // ---- Templates ----

  getTemplates: async (userId: string) => {
    const { data, error } = await supabase
      .from('workout_templates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  saveTemplate: async (template: Record<string, any>) => {
    const { error } = await supabase.from('workout_templates').upsert(template, { onConflict: 'id' });
    if (error) throw error;
  },

  deleteTemplate: async (templateId: string) => {
    const { error } = await supabase.from('workout_templates').delete().eq('id', templateId);
    if (error) throw error;
  },

  // ---- Custom Exercises ----

  getCustomExercises: async (userId: string) => {
    const { data, error } = await supabase
      .from('custom_exercises')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data || [];
  },

  saveCustomExercise: async (exercise: Record<string, any>) => {
    const { error } = await supabase.from('custom_exercises').upsert(exercise, { onConflict: 'id' });
    if (error) throw error;
  },
};

// ==========================================
// Storage Service (Supabase Storage)
// ==========================================

export const storageService = {
  /** Upload a progress photo, return the public URL */
  uploadProgressPhoto: async (userId: string, localUri: string, photoId: string): Promise<string> => {
    const response = await fetch(localUri);
    const blob = await response.blob();

    // Convert blob to ArrayBuffer
    const arrayBuffer = await new Response(blob).arrayBuffer();

    const filePath = `${userId}/${photoId}.jpg`;
    const { error } = await supabase.storage
      .from('progress-photos')
      .upload(filePath, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });
    if (error) throw error;

    const { data } = supabase.storage.from('progress-photos').getPublicUrl(filePath);
    return data.publicUrl;
  },

  /** Delete a progress photo */
  deleteProgressPhoto: async (userId: string, photoId: string): Promise<void> => {
    const filePath = `${userId}/${photoId}.jpg`;
    const { error } = await supabase.storage.from('progress-photos').remove([filePath]);
    if (error) console.log('Photo delete error:', error);
  },
};
