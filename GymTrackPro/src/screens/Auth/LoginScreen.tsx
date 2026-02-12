// ==========================================
// GymTrack Pro - Login Screen
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useApp } from '../../contexts/AppContext';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { FONT_SIZE, FONT_WEIGHT, SPACING, BORDER_RADIUS } from '../../constants/theme';

export const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const { signIn, signInWithGoogle, signInWithApple, sendPasswordReset } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
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
      const message =
        error?.code === 'auth/user-not-found'
          ? 'No account found with this email.'
          : error?.code === 'auth/wrong-password'
          ? 'Incorrect password.'
          : error?.code === 'auth/too-many-requests'
          ? 'Too many attempts. Please try again later.'
          : 'Something went wrong. Please try again.';
      Alert.alert('Login Failed', message);
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
    // Google Sign-In requires expo-auth-session or @react-native-google-signin
    // to obtain the idToken. Once you have the idToken, call signInWithGoogle(idToken).
    //
    // For a production build, install & configure one of:
    //   - expo-auth-session (works in Expo Go)
    //   - @react-native-google-signin/google-signin (requires dev client)
    //
    // Quick example with expo-auth-session:
    //   const [request, response, promptAsync] = Google.useAuthRequest({
    //     iosClientId: '294195477862-4hlduj9p5ap9n0kulqgl8j0olsfq2t97.apps.googleusercontent.com',
    //   });
    //   const idToken = response?.authentication?.idToken;
    //   await signInWithGoogle(idToken);
    Alert.alert(
      'Google Sign-In',
      'Google Sign-In requires a native build. Use email/password for development, or build with EAS to enable Google login.'
    );
  };

  const handleAppleLogin = async () => {
    // Apple Sign-In requires expo-apple-authentication.
    //
    // Example:
    //   import * as AppleAuthentication from 'expo-apple-authentication';
    //   const credential = await AppleAuthentication.signInAsync({...});
    //   await signInWithApple(credential.identityToken, nonce);
    if (Platform.OS !== 'ios') {
      Alert.alert('Apple Sign-In', 'Apple Sign-In is only available on iOS devices.');
      return;
    }
    Alert.alert(
      'Apple Sign-In',
      'Apple Sign-In requires a native build. Use email/password for development, or build with EAS to enable Apple login.'
    );
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
              style={[styles.socialButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleGoogleLogin}
              disabled={socialLoading !== null}
            >
              <Ionicons name="logo-google" size={22} color="#DB4437" />
              <Text style={[styles.socialText, { color: colors.text }]}>Google</Text>
            </TouchableOpacity>
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={[styles.socialButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={handleAppleLogin}
                disabled={socialLoading !== null}
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
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xxl,
    paddingTop: SPACING.huge,
    paddingBottom: SPACING.xxxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxxl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE.hero,
    fontWeight: FONT_WEIGHT.heavy,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZE.lg,
    textAlign: 'center',
  },
  form: {
    marginBottom: SPACING.xxl,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.sm,
  },
  forgotPasswordText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: SPACING.lg,
    fontSize: FONT_SIZE.sm,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.xxxl,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    gap: SPACING.sm,
  },
  socialText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    fontSize: FONT_SIZE.md,
  },
  signUpLink: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
  },
});
