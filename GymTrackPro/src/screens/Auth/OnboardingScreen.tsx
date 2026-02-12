// ==========================================
// GymTrack Pro - Onboarding Screen
// ==========================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useApp } from '../../contexts/AppContext';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { FitnessGoal, ExperienceLevel } from '../../types';
import { FONT_SIZE, FONT_WEIGHT, SPACING, BORDER_RADIUS } from '../../constants/theme';

const { width } = Dimensions.get('window');

const GOALS: { value: FitnessGoal; label: string; icon: keyof typeof Ionicons.glyphMap; description: string }[] = [
  { value: 'weight_loss', label: 'Lose Weight', icon: 'trending-down', description: 'Burn fat and get lean' },
  { value: 'muscle_gain', label: 'Build Muscle', icon: 'barbell', description: 'Get stronger and bigger' },
  { value: 'maintenance', label: 'Stay Fit', icon: 'heart', description: 'Maintain your fitness' },
  { value: 'custom', label: 'Custom Goal', icon: 'star', description: 'Set your own targets' },
];

const EXPERIENCE_LEVELS: { value: ExperienceLevel; label: string; description: string }[] = [
  { value: 'beginner', label: 'Beginner', description: 'New to the gym (0-6 months)' },
  { value: 'intermediate', label: 'Intermediate', description: 'Regular gym-goer (6 months - 2 years)' },
  { value: 'advanced', label: 'Advanced', description: 'Experienced lifter (2+ years)' },
];

export const OnboardingScreen: React.FC = () => {
  const { colors } = useTheme();
  const { completeOnboarding, user } = useApp();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<FitnessGoal>('muscle_gain');
  const [experience, setExperience] = useState<ExperienceLevel>('beginner');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');

  const handleComplete = async () => {
    await completeOnboarding({
      goal,
      experienceLevel: experience,
      age: age ? parseInt(age) : null,
      height: height ? parseFloat(height) : null,
      weight: weight ? parseFloat(weight) : null,
    });
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              What's your fitness goal?
            </Text>
            <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
              This helps us personalize your experience
            </Text>
            <View style={styles.optionsGrid}>
              {GOALS.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  onPress={() => setGoal(item.value)}
                  style={[
                    styles.goalCard,
                    {
                      backgroundColor: goal === item.value ? colors.primary + '15' : colors.surface,
                      borderColor: goal === item.value ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={28}
                    color={goal === item.value ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.goalLabel,
                      { color: goal === item.value ? colors.primary : colors.text },
                    ]}
                  >
                    {item.label}
                  </Text>
                  <Text
                    style={[
                      styles.goalDescription,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {item.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              Your experience level?
            </Text>
            <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
              We'll adjust recommendations accordingly
            </Text>
            {EXPERIENCE_LEVELS.map((item) => (
              <TouchableOpacity
                key={item.value}
                onPress={() => setExperience(item.value)}
                style={[
                  styles.experienceCard,
                  {
                    backgroundColor: experience === item.value ? colors.primary + '15' : colors.surface,
                    borderColor: experience === item.value ? colors.primary : colors.border,
                  },
                ]}
              >
                <View style={styles.experienceContent}>
                  <View
                    style={[
                      styles.radioOuter,
                      { borderColor: experience === item.value ? colors.primary : colors.border },
                    ]}
                  >
                    {experience === item.value && (
                      <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                    )}
                  </View>
                  <View style={styles.experienceText}>
                    <Text
                      style={[
                        styles.experienceLabel,
                        { color: experience === item.value ? colors.primary : colors.text },
                      ]}
                    >
                      {item.label}
                    </Text>
                    <Text style={[styles.experienceDescription, { color: colors.textSecondary }]}>
                      {item.description}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              Tell us about yourself
            </Text>
            <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
              Optional - helps with accurate tracking
            </Text>
            <Input
              label="Age"
              placeholder="Enter your age"
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
              leftIcon="calendar-outline"
            />
            <Input
              label="Height (cm)"
              placeholder="Enter your height"
              value={height}
              onChangeText={setHeight}
              keyboardType="decimal-pad"
              leftIcon="resize-outline"
            />
            <Input
              label="Weight (kg)"
              placeholder="Enter your weight"
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              leftIcon="scale-outline"
            />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              {
                backgroundColor: i <= step ? colors.primary : colors.border,
                flex: 1,
              },
            ]}
          />
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome */}
        {step === 0 && (
          <Text style={[styles.welcome, { color: colors.text }]}>
            Welcome{user?.displayName ? `, ${user.displayName}` : ''}! 💪
          </Text>
        )}

        {renderStep()}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.footer}>
        {step > 0 && (
          <Button
            title="Back"
            onPress={() => setStep(step - 1)}
            variant="ghost"
            size="lg"
            style={{ flex: 1, marginRight: SPACING.md }}
          />
        )}
        <Button
          title={step === 2 ? "Let's Go!" : 'Continue'}
          onPress={step === 2 ? handleComplete : () => setStep(step + 1)}
          size="lg"
          fullWidth={step === 0}
          style={step > 0 ? { flex: 2 } : undefined}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xxl,
    paddingTop: SPACING.md,
    gap: SPACING.sm,
  },
  progressDot: {
    height: 4,
    borderRadius: 2,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xxl,
    paddingTop: SPACING.xxl,
  },
  welcome: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: FONT_WEIGHT.heavy,
    marginBottom: SPACING.sm,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING.xs,
  },
  stepSubtitle: {
    fontSize: FONT_SIZE.md,
    marginBottom: SPACING.xxl,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  goalCard: {
    width: (width - SPACING.xxl * 2 - SPACING.md) / 2,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    alignItems: 'center',
  },
  goalLabel: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
    marginTop: SPACING.sm,
  },
  goalDescription: {
    fontSize: FONT_SIZE.xs,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  experienceCard: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    marginBottom: SPACING.md,
  },
  experienceContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  experienceText: {
    flex: 1,
  },
  experienceLabel: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
  },
  experienceDescription: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
});
