// ==========================================
// GymTrack Pro - Login Screen (Supabase)
// ==========================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '../../contexts/ThemeContext';
import { useApp } from '../../contexts/AppContext';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { FONT_SIZE, FONT_WEIGHT, SPACING, BORDER_RADIUS } from '../../constants/theme';

export const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const { signIn, signInWithGoogle, signInWithApple, handleOAuthCallback, sendPasswordReset, resendConfirmationEmail, isSupabaseConfigured } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email format';
    if (!password.trim()) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const success = await signIn(email.trim(), password);
      if (!success) {
        Alert.alert(
          'Login Failed',
          'Invalid email or password. Please check your credentials and try again.'
        );
      }
    } catch (error: any) {
      const msg = error?.message || 'Something went wrong.';
      // Check if the error is about email not confirmed
      if (msg.toLowerCase().includes('email not confirmed')) {
        Alert.alert(
          'Email Not Confirmed',
          'Please check your inbox and click the confirmation link. Didn\'t get it?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Resend Email',
              onPress: async () => {
                const sent = await resendConfirmationEmail(email.trim());
                if (sent) {
                  Alert.alert('Email Sent', 'A new confirmation email has been sent. Check your inbox.');
                } else {
                  Alert.alert('Error', 'Could not resend email. Please try again.');
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('Login Failed', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!email.trim()) {
      Alert.alert('Enter Email', 'Please enter your email address first, then tap Forgot Password.');
      return;
    }
    Alert.alert(
      'Reset Password',
      `Send a password reset link to ${email.trim()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            const success = await sendPasswordReset(email.trim());
            if (success) {
              Alert.alert('Email Sent', 'Check your inbox for a password reset link.');
            } else {
              Alert.alert('Error', 'Could not send reset email. Please check the address and try again.');
            }
          },
        },
      ]
    );
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result?.url) {
        // Open the Supabase Google OAuth URL in an in-app browser
        const browserResult = await WebBrowser.openAuthSessionAsync(
          result.url,
          'gymtrackpro://auth/callback'
        );
        if (browserResult.type === 'success' && browserResult.url) {
          await handleOAuthCallback(browserResult.url);
        }
      } else {
        Alert.alert('Google Sign-In', 'Could not initiate Google Sign-In. Please try again.');
      }
    } catch (error: any) {
      Alert.alert('Google Sign-In Failed', error?.message || 'Something went wrong.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Apple Sign-In', 'Apple Sign-In is only available on iOS devices.');
      return;
    }
    try {
      const result = await signInWithApple();
      if (result?.url) {
        const browserResult = await WebBrowser.openAuthSessionAsync(
          result.url,
          'gymtrackpro://auth/callback'
        );
        if (browserResult.type === 'success' && browserResult.url) {
          await handleOAuthCallback(browserResult.url);
        }
      }
    } catch (error: any) {
      Alert.alert('Apple Sign-In Failed', error?.message || 'Something went wrong.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo & Title */}
          <View style={styles.header}>
            <View style={[styles.logoContainer, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="barbell" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>GymTrack Pro</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Track your gains, crush your goals
            </Text>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              leftIcon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />
            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              leftIcon="lock-closed-outline"
              isPassword
              error={errors.password}
            />

            <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
              <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              fullWidth
              size="lg"
              style={{ marginTop: SPACING.md }}
            />
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textTertiary }]}>
              or continue with
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Social Login */}
          <View style={styles.socialContainer}>
            <TouchableOpacity
              style={[
                styles.socialButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  opacity: googleLoading ? 0.6 : 1,
                },
              ]}
              onPress={handleGoogleLogin}
              disabled={loading || googleLoading}
            >
              {googleLoading ? (
                <ActivityIndicator size="small" color="#DB4437" />
              ) : (
                <Ionicons name="logo-google" size={22} color="#DB4437" />
              )}
              <Text style={[styles.socialText, { color: colors.text }]}>
                {googleLoading ? 'Signing in...' : 'Google'}
              </Text>
            </TouchableOpacity>
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={[styles.socialButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={handleAppleLogin}
                disabled={loading || googleLoading}
              >
                <Ionicons name="logo-apple" size={22} color={colors.text} />
                <Text style={[styles.socialText, { color: colors.text }]}>Apple</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Sign Up Link */}
          <View style={styles.signUpContainer}>
            <Text style={[styles.signUpText, { color: colors.textSecondary }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={[styles.signUpLink, { color: colors.primary }]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xxl,
    paddingTop: SPACING.huge,
    paddingBottom: SPACING.xxxl,
  },
  header: { alignItems: 'center', marginBottom: SPACING.xxxl },
  logoContainer: {
    width: 80, height: 80, borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg,
  },
  title: { fontSize: FONT_SIZE.hero, fontWeight: FONT_WEIGHT.heavy, marginBottom: SPACING.xs },
  subtitle: { fontSize: FONT_SIZE.lg, textAlign: 'center' },
  form: { marginBottom: SPACING.xxl },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: SPACING.sm },
  forgotPasswordText: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xxl },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { marginHorizontal: SPACING.lg, fontSize: FONT_SIZE.sm },
  socialContainer: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.md, marginBottom: SPACING.xxxl },
  socialButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md, borderWidth: 1, gap: SPACING.sm,
  },
  socialText: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold },
  signUpContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  signUpText: { fontSize: FONT_SIZE.md },
  signUpLink: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold },
});
