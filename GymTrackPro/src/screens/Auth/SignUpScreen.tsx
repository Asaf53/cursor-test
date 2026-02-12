// ==========================================
// GymTrack Pro - Sign Up Screen
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

export const SignUpScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const { signUp } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email format';
    if (!password.trim()) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await signUp(email.trim(), password, name.trim());

      if (result === 'needs_confirmation') {
        // Supabase email confirmation is enabled -- user must verify email
        Alert.alert(
          'Check Your Email',
          `We've sent a confirmation link to ${email.trim()}. Please open it to activate your account, then come back and sign in.`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
      // If result === 'signed_in', onAuthStateChange will handle navigation automatically
    } catch (error: any) {
      const message = error?.message || 'Something went wrong. Please try again.';
      Alert.alert('Sign Up Failed', message);
    } finally {
      setLoading(false);
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
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>
              Create Account
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Start your fitness journey today
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Full Name"
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
              leftIcon="person-outline"
              autoCapitalize="words"
              error={errors.name}
            />
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
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              leftIcon="lock-closed-outline"
              isPassword
              error={errors.password}
            />
            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              leftIcon="lock-closed-outline"
              isPassword
              error={errors.confirmPassword}
            />

            <Button
              title="Create Account"
              onPress={handleSignUp}
              loading={loading}
              fullWidth
              size="lg"
              style={{ marginTop: SPACING.lg }}
            />
          </View>

          {/* Terms */}
          <Text style={[styles.terms, { color: colors.textTertiary }]}>
            By creating an account, you agree to our{' '}
            <Text style={{ color: colors.primary }}>Terms of Service</Text> and{' '}
            <Text style={{ color: colors.primary }}>Privacy Policy</Text>
          </Text>

          {/* Sign In Link */}
          <View style={styles.signInContainer}>
            <Text style={[styles.signInText, { color: colors.textSecondary }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={[styles.signInLink, { color: colors.primary }]}>
                Sign In
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
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxxl,
  },
  header: {
    marginBottom: SPACING.xxxl,
  },
  backButton: {
    marginBottom: SPACING.xl,
    width: 40,
  },
  title: {
    fontSize: FONT_SIZE.display,
    fontWeight: FONT_WEIGHT.heavy,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZE.lg,
  },
  form: {
    marginBottom: SPACING.xxl,
  },
  terms: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.xxl,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInText: {
    fontSize: FONT_SIZE.md,
  },
  signInLink: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
  },
});
