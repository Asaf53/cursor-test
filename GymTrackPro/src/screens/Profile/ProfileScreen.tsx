// ==========================================
// GymTrack Pro - Profile Screen
// ==========================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { ProgressBar } from '../../components/ProgressBar';
import { FitnessGoal, ExperienceLevel, Goal as GoalType } from '../../types';
import { FONT_SIZE, FONT_WEIGHT, SPACING, BORDER_RADIUS } from '../../constants/theme';

const GOAL_LABELS: Record<FitnessGoal, string> = {
  weight_loss: 'Weight Loss',
  muscle_gain: 'Muscle Gain',
  maintenance: 'Maintenance',
  custom: 'Custom Goal',
};

const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, isDark, toggleTheme } = useTheme();
  const {
    user,
    updateProfile,
    signOut,
    workouts,
    personalRecords,
    goals,
    addGoal,
    updateGoal,
    deleteGoal,
    notificationSettings,
    updateNotificationSettings,
    updateSubscription,
  } = useApp();

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [editName, setEditName] = useState(user?.profile.name || '');
  const [editAge, setEditAge] = useState(user?.profile.age?.toString() || '');
  const [editHeight, setEditHeight] = useState(user?.profile.height?.toString() || '');
  const [editWeight, setEditWeight] = useState(user?.profile.weight?.toString() || '');
  const [editGoal, setEditGoal] = useState<FitnessGoal>(user?.profile.goal || 'muscle_gain');
  const [editExperience, setEditExperience] = useState<ExperienceLevel>(
    user?.profile.experienceLevel || 'beginner'
  );

  // New Goal form
  const [goalTitle, setGoalTitle] = useState('');
  const [goalType, setGoalType] = useState<FitnessGoal>('muscle_gain');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');

  const completedWorkouts = workouts.filter(w => w.isCompleted);
  const totalDuration = completedWorkouts.reduce((acc, w) => acc + (w.duration || 0), 0);
  const totalVolume = completedWorkouts.reduce((acc, w) => {
    return acc + w.exercises.reduce((eAcc, ex) => {
      return eAcc + ex.sets.reduce((sAcc, s) => sAcc + (s.weight || 0) * (s.reps || 0), 0);
    }, 0);
  }, 0);

  const handleSaveProfile = async () => {
    await updateProfile({
      name: editName,
      age: editAge ? parseInt(editAge) : null,
      height: editHeight ? parseFloat(editHeight) : null,
      weight: editWeight ? parseFloat(editWeight) : null,
      goal: editGoal,
      experienceLevel: editExperience,
    });
    setShowEditProfile(false);
  };

  const handleAddGoal = async () => {
    if (!goalTitle.trim()) {
      Alert.alert('Error', 'Please enter a goal title.');
      return;
    }
    await addGoal({
      type: goalType,
      title: goalTitle.trim(),
      targetValue: goalTarget ? parseFloat(goalTarget) : undefined,
      deadline: goalDeadline || undefined,
    });
    setGoalTitle('');
    setGoalTarget('');
    setGoalDeadline('');
    setShowAddGoal(false);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    if (hours > 0) return `${hours}h`;
    return `${Math.floor(seconds / 60)}m`;
  };

  const formatVolume = (volume: number): string => {
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M kg`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}k kg`;
    return `${volume} kg`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
        </View>

        {/* User Info Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {(user?.displayName || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>
                {user?.displayName || 'User'}
              </Text>
              <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
                {user?.email || ''}
              </Text>
              <View style={styles.profileBadges}>
                <View
                  style={[styles.badge, { backgroundColor: colors.primary + '20' }]}
                >
                  <Text style={[styles.badgeText, { color: colors.primary }]}>
                    {GOAL_LABELS[user?.profile.goal || 'muscle_gain']}
                  </Text>
                </View>
                <View
                  style={[styles.badge, { backgroundColor: colors.accent + '20' }]}
                >
                  <Text style={[styles.badgeText, { color: colors.accent }]}>
                    {EXPERIENCE_LABELS[user?.profile.experienceLevel || 'beginner']}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          <Button
            title="Edit Profile"
            onPress={() => setShowEditProfile(true)}
            variant="outline"
            size="sm"
            fullWidth
            style={{ marginTop: SPACING.lg }}
          />
        </Card>

        {/* Stats Overview */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Stats Overview</Text>
        <Card style={styles.statsCard}>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Ionicons name="barbell" size={20} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {completedWorkouts.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Workouts
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Ionicons name="time" size={20} color={colors.accent} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {formatDuration(totalDuration)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Total Time
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Ionicons name="trending-up" size={20} color={colors.success} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {formatVolume(totalVolume)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Volume
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Ionicons name="trophy" size={20} color="#F59E0B" />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {personalRecords.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                PRs
              </Text>
            </View>
          </View>
        </Card>

        {/* Body Stats */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Body Stats</Text>
        <Card style={styles.bodyCard}>
          <View style={styles.bodyGrid}>
            {[
              { label: 'Age', value: user?.profile.age ? `${user.profile.age}` : '-', unit: 'years' },
              { label: 'Height', value: user?.profile.height ? `${user.profile.height}` : '-', unit: 'cm' },
              { label: 'Weight', value: user?.profile.weight ? `${user.profile.weight}` : '-', unit: 'kg' },
            ].map((item) => (
              <View key={item.label} style={styles.bodyItem}>
                <Text style={[styles.bodyLabel, { color: colors.textSecondary }]}>
                  {item.label}
                </Text>
                <Text style={[styles.bodyValue, { color: colors.text }]}>
                  {item.value}
                  <Text style={[styles.bodyUnit, { color: colors.textTertiary }]}>
                    {' '}{item.unit}
                  </Text>
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Goals */}
        <View style={styles.goalHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
            Goals
          </Text>
          <Button
            title="Add"
            onPress={() => setShowAddGoal(true)}
            variant="ghost"
            size="sm"
            icon={<Ionicons name="add" size={16} color={colors.primary} />}
          />
        </View>
        {goals.length === 0 ? (
          <Card style={styles.emptyGoalCard}>
            <Text style={[styles.emptyGoalText, { color: colors.textSecondary }]}>
              No goals set yet. Add a goal to stay motivated!
            </Text>
          </Card>
        ) : (
          goals.map((goal) => (
            <Card key={goal.id} style={styles.goalCard}>
              <View style={styles.goalCardHeader}>
                <View style={styles.goalInfo}>
                  <Ionicons
                    name={goal.isCompleted ? 'checkmark-circle' : 'flag'}
                    size={20}
                    color={goal.isCompleted ? colors.success : colors.primary}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.goalTitle, { color: colors.text }]}>
                      {goal.title}
                    </Text>
                    <Text style={[styles.goalType, { color: colors.textSecondary }]}>
                      {GOAL_LABELS[goal.type]}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert('Goal', 'What would you like to do?', [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: goal.isCompleted ? 'Reopen' : 'Complete',
                        onPress: () => updateGoal(goal.id, { isCompleted: !goal.isCompleted }),
                      },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => deleteGoal(goal.id),
                      },
                    ]);
                  }}
                >
                  <Ionicons name="ellipsis-horizontal" size={20} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>
              {goal.targetValue && goal.currentValue !== undefined && (
                <ProgressBar
                  progress={goal.targetValue > 0 ? goal.currentValue / goal.targetValue : 0}
                  showLabel
                  label={`${goal.currentValue}/${goal.targetValue} ${goal.unit || ''}`}
                  style={{ marginTop: SPACING.md }}
                />
              )}
            </Card>
          ))
        )}

        {/* Settings */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Settings</Text>
        <Card style={styles.settingsCard}>
          {/* Dark Mode */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name={isDark ? 'moon' : 'sunny'} size={22} color={colors.primary} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary + '60' }}
              thumbColor={isDark ? colors.primary : '#FFF'}
            />
          </View>

          <View style={[styles.settingDivider, { backgroundColor: colors.border }]} />

          {/* Workout Reminders */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={22} color={colors.accent} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>Workout Reminders</Text>
            </View>
            <Switch
              value={notificationSettings.workoutReminders}
              onValueChange={(val) =>
                updateNotificationSettings({ workoutReminders: val })
              }
              trackColor={{ false: colors.border, true: colors.primary + '60' }}
              thumbColor={notificationSettings.workoutReminders ? colors.primary : '#FFF'}
            />
          </View>

          <View style={[styles.settingDivider, { backgroundColor: colors.border }]} />

          {/* Goal Alerts */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="flag-outline" size={22} color={colors.success} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>Goal Progress Alerts</Text>
            </View>
            <Switch
              value={notificationSettings.goalProgressAlerts}
              onValueChange={(val) =>
                updateNotificationSettings({ goalProgressAlerts: val })
              }
              trackColor={{ false: colors.border, true: colors.primary + '60' }}
              thumbColor={notificationSettings.goalProgressAlerts ? colors.primary : '#FFF'}
            />
          </View>
        </Card>

        {/* Subscription */}
        <Card style={styles.subscriptionCard} onPress={() => setShowSubscription(true)}>
          <View style={styles.subscriptionContent}>
            <View style={[styles.subscriptionIcon, { backgroundColor: colors.accent + '15' }]}>
              <Ionicons name="diamond" size={24} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.subscriptionTitle, { color: colors.text }]}>
                {user?.subscription === 'free' ? 'Upgrade to Premium' : 'Premium Member'}
              </Text>
              <Text style={[styles.subscriptionSubtitle, { color: colors.textSecondary }]}>
                {user?.subscription === 'free'
                  ? 'Unlock advanced analytics, unlimited workouts & more'
                  : 'You have access to all premium features'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </View>
        </Card>

        {/* Sign Out */}
        <Button
          title="Sign Out"
          onPress={handleSignOut}
          variant="danger"
          fullWidth
          style={{ marginHorizontal: SPACING.xl, marginTop: SPACING.lg }}
        />

        {/* App Version */}
        <Text style={[styles.version, { color: colors.textTertiary }]}>
          GymTrack Pro v1.0.0
        </Text>

        <View style={{ height: SPACING.huge }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={showEditProfile} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowEditProfile(false)}>
              <Text style={[styles.modalCancel, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSaveProfile}>
              <Text style={[styles.modalSave, { color: colors.primary }]}>Save</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Input label="Name" value={editName} onChangeText={setEditName} leftIcon="person-outline" />
            <Input label="Age" value={editAge} onChangeText={setEditAge} keyboardType="numeric" leftIcon="calendar-outline" />
            <Input label="Height (cm)" value={editHeight} onChangeText={setEditHeight} keyboardType="decimal-pad" leftIcon="resize-outline" />
            <Input label="Weight (kg)" value={editWeight} onChangeText={setEditWeight} keyboardType="decimal-pad" leftIcon="scale-outline" />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>FITNESS GOAL</Text>
            <View style={styles.optionGrid}>
              {(Object.keys(GOAL_LABELS) as FitnessGoal[]).map((goal) => (
                <TouchableOpacity
                  key={goal}
                  onPress={() => setEditGoal(goal)}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: editGoal === goal ? colors.primary + '15' : colors.surface,
                      borderColor: editGoal === goal ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: editGoal === goal ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    {GOAL_LABELS[goal]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>EXPERIENCE LEVEL</Text>
            <View style={styles.optionGrid}>
              {(Object.keys(EXPERIENCE_LABELS) as ExperienceLevel[]).map((level) => (
                <TouchableOpacity
                  key={level}
                  onPress={() => setEditExperience(level)}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: editExperience === level ? colors.primary + '15' : colors.surface,
                      borderColor: editExperience === level ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: editExperience === level ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    {EXPERIENCE_LABELS[level]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Add Goal Modal */}
      <Modal visible={showAddGoal} animationType="slide" transparent>
        <View style={styles.bottomModalOverlay}>
          <View style={[styles.bottomModalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.bottomModalHeader}>
              <Text style={[styles.bottomModalTitle, { color: colors.text }]}>Add Goal</Text>
              <TouchableOpacity onPress={() => setShowAddGoal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Input label="Goal Title" placeholder="e.g., Bench 100kg" value={goalTitle} onChangeText={setGoalTitle} />
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>GOAL TYPE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.lg }}>
              {(Object.keys(GOAL_LABELS) as FitnessGoal[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setGoalType(type)}
                  style={[
                    styles.goalTypeChip,
                    {
                      backgroundColor: goalType === type ? colors.primary : colors.inputBackground,
                      borderColor: goalType === type ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.goalTypeText,
                      { color: goalType === type ? '#FFF' : colors.textSecondary },
                    ]}
                  >
                    {GOAL_LABELS[type]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Input
              label="Target Value (optional)"
              placeholder="e.g., 100"
              value={goalTarget}
              onChangeText={setGoalTarget}
              keyboardType="decimal-pad"
            />
            <Button title="Add Goal" onPress={handleAddGoal} fullWidth size="lg" />
          </View>
        </View>
      </Modal>

      {/* Subscription Modal */}
      <Modal visible={showSubscription} animationType="slide" transparent>
        <View style={styles.bottomModalOverlay}>
          <View style={[styles.subscriptionModal, { backgroundColor: colors.surface }]}>
            <View style={styles.bottomModalHeader}>
              <Text style={[styles.bottomModalTitle, { color: colors.text }]}>GymTrack Pro Premium</Text>
              <TouchableOpacity onPress={() => setShowSubscription(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.premiumFeatures}>
              {[
                { icon: 'analytics', label: 'Advanced Analytics', desc: 'Detailed insights & charts' },
                { icon: 'infinite', label: 'Unlimited Workouts', desc: 'No limits on tracking' },
                { icon: 'clipboard', label: 'Custom Workout Plans', desc: 'Build personalized programs' },
                { icon: 'cloud-upload', label: 'Cloud Backup', desc: 'Sync across all devices' },
              ].map((feature) => (
                <View key={feature.label} style={styles.premiumFeature}>
                  <Ionicons name={feature.icon as any} size={24} color={colors.accent} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.premiumFeatureLabel, { color: colors.text }]}>
                      {feature.label}
                    </Text>
                    <Text style={[styles.premiumFeatureDesc, { color: colors.textSecondary }]}>
                      {feature.desc}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.pricingGrid}>
              <TouchableOpacity
                style={[styles.pricingCard, { borderColor: colors.border, backgroundColor: colors.inputBackground }]}
                onPress={() => { updateSubscription('premium_monthly'); setShowSubscription(false); }}
              >
                <Text style={[styles.pricingPeriod, { color: colors.textSecondary }]}>Monthly</Text>
                <Text style={[styles.pricingPrice, { color: colors.text }]}>$9.99</Text>
                <Text style={[styles.pricingDetail, { color: colors.textTertiary }]}>/month</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pricingCard, { borderColor: colors.accent, backgroundColor: colors.accent + '10' }]}
                onPress={() => { updateSubscription('premium_yearly'); setShowSubscription(false); }}
              >
                <View style={[styles.pricingSave, { backgroundColor: colors.accent }]}>
                  <Text style={styles.pricingSaveText}>Save 40%</Text>
                </View>
                <Text style={[styles.pricingPeriod, { color: colors.textSecondary }]}>Yearly</Text>
                <Text style={[styles.pricingPrice, { color: colors.text }]}>$71.99</Text>
                <Text style={[styles.pricingDetail, { color: colors.textTertiary }]}>$5.99/month</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZE.display,
    fontWeight: FONT_WEIGHT.heavy,
  },
  profileCard: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.lg,
  },
  avatarText: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.heavy,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
  },
  profileEmail: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  profileBadges: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  badgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
  },
  statsCard: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.heavy,
    marginTop: SPACING.sm,
  },
  statLabel: {
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  bodyCard: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  bodyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  bodyItem: {
    alignItems: 'center',
  },
  bodyLabel: {
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.xs,
  },
  bodyValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
  },
  bodyUnit: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.regular,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: SPACING.xl,
    marginBottom: SPACING.md,
  },
  goalCard: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
  },
  goalCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.md,
  },
  goalTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
  },
  goalType: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  emptyGoalCard: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
  },
  emptyGoalText: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
  },
  settingsCard: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
    padding: 0,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  settingLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
  },
  settingDivider: {
    height: 1,
    marginHorizontal: SPACING.lg,
  },
  subscriptionCard: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
  },
  subscriptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  subscriptionIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscriptionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
  },
  subscriptionSubtitle: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  version: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
  },
  modalCancel: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
  },
  modalTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
  },
  modalSave: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
  },
  modalContent: {
    padding: SPACING.xxl,
  },
  fieldLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: SPACING.xl,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
    paddingHorizontal: 0,
  },
  optionButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1.5,
  },
  optionText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
  },
  bottomModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  bottomModalContent: {
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.xxl,
    paddingBottom: SPACING.huge,
  },
  bottomModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  bottomModalTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
  },
  goalTypeChip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    marginRight: SPACING.sm,
  },
  goalTypeText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  subscriptionModal: {
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.xxl,
    paddingBottom: SPACING.huge,
  },
  premiumFeatures: {
    marginBottom: SPACING.xxl,
  },
  premiumFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  premiumFeatureLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
  },
  premiumFeatureDesc: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  pricingGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  pricingCard: {
    flex: 1,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    alignItems: 'center',
  },
  pricingPeriod: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    marginBottom: SPACING.xs,
  },
  pricingPrice: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.heavy,
  },
  pricingDetail: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  pricingSave: {
    position: 'absolute',
    top: -10,
    right: -5,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  pricingSaveText: {
    color: '#FFF',
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
  },
});
