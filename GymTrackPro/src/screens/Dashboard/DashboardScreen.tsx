// ==========================================
// GymTrack Pro - Dashboard Screen
// ==========================================

import React, { useMemo } from 'react';
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
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { StatCard } from '../../components/StatCard';
import { ProgressBar } from '../../components/ProgressBar';
import { EmptyState } from '../../components/EmptyState';
import { FONT_SIZE, FONT_WEIGHT, SPACING, BORDER_RADIUS, COLORS } from '../../constants/theme';
import { MUSCLE_GROUP_COLORS, MUSCLE_GROUP_LABELS } from '../../constants/exercises';
import { MuscleGroup } from '../../types';

const { width } = Dimensions.get('window');

export const DashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const { user, workouts, personalRecords, bodyWeights, goals } = useApp();

  // Calculate analytics
  const analytics = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const weekWorkouts = workouts.filter(
      w => new Date(w.date) >= weekStart && w.isCompleted
    );
    const monthWorkouts = workouts.filter(
      w => new Date(w.date) >= monthStart && w.isCompleted
    );

    // Weekly stats
    const weeklyTotalDuration = weekWorkouts.reduce((acc, w) => acc + (w.duration || 0), 0);
    const weeklyTotalVolume = weekWorkouts.reduce((acc, w) => {
      return acc + w.exercises.reduce((eAcc, ex) => {
        return eAcc + ex.sets.reduce((sAcc, s) => {
          return sAcc + (s.weight || 0) * (s.reps || 0);
        }, 0);
      }, 0);
    }, 0);
    const weeklyCalories = weekWorkouts.reduce((acc, w) => acc + (w.caloriesEstimate || 0), 0);

    // Monthly stats
    const monthlyTotalDuration = monthWorkouts.reduce((acc, w) => acc + (w.duration || 0), 0);

    // Muscle group breakdown (this week)
    const muscleGroupCount: Partial<Record<MuscleGroup, number>> = {};
    weekWorkouts.forEach(w => {
      w.exercises.forEach(ex => {
        muscleGroupCount[ex.muscleGroup] = (muscleGroupCount[ex.muscleGroup] || 0) + 1;
      });
    });

    // Streak calculation
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      const hasWorkout = workouts.some(w => w.date === dateStr && w.isCompleted);
      if (hasWorkout) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    // Weekly goal (4 workouts per week)
    const weeklyGoalProgress = Math.min(weekWorkouts.length / 4, 1);

    return {
      weekWorkouts: weekWorkouts.length,
      monthWorkouts: monthWorkouts.length,
      weeklyTotalDuration,
      weeklyTotalVolume,
      weeklyCalories,
      monthlyTotalDuration,
      muscleGroupCount,
      streak,
      weeklyGoalProgress,
      totalWorkouts: workouts.filter(w => w.isCompleted).length,
    };
  }, [workouts]);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatVolume = (volume: number): string => {
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}k kg`;
    return `${volume} kg`;
  };

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const recentWorkouts = workouts.filter(w => w.isCompleted).slice(0, 3);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerSection}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              {getGreeting()}
            </Text>
            <Text style={[styles.userName, { color: colors.text }]}>
              {user?.displayName || 'Athlete'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.streakBadge, { backgroundColor: colors.accent + '15' }]}
          >
            <Ionicons name="flame" size={18} color={colors.accent} />
            <Text style={[styles.streakText, { color: colors.accent }]}>
              {analytics.streak}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Weekly Goal Progress */}
        <Card style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <View>
              <Text style={[styles.goalTitle, { color: colors.text }]}>
                Weekly Goal
              </Text>
              <Text style={[styles.goalSubtitle, { color: colors.textSecondary }]}>
                {analytics.weekWorkouts} of 4 workouts completed
              </Text>
            </View>
            <View
              style={[
                styles.goalBadge,
                {
                  backgroundColor:
                    analytics.weeklyGoalProgress >= 1
                      ? colors.success + '20'
                      : colors.primary + '20',
                },
              ]}
            >
              <Ionicons
                name={analytics.weeklyGoalProgress >= 1 ? 'checkmark-circle' : 'fitness'}
                size={20}
                color={analytics.weeklyGoalProgress >= 1 ? colors.success : colors.primary}
              />
            </View>
          </View>
          <ProgressBar
            progress={analytics.weeklyGoalProgress}
            color={analytics.weeklyGoalProgress >= 1 ? colors.success : colors.primary}
            height={10}
            style={{ marginTop: SPACING.md }}
          />
        </Card>

        {/* Quick Stats */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          This Week
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsRow}
        >
          <StatCard
            title="Workouts"
            value={analytics.weekWorkouts}
            icon="barbell-outline"
            iconColor={colors.primary}
            subtitle="this week"
          />
          <View style={{ width: SPACING.md }} />
          <StatCard
            title="Duration"
            value={formatDuration(analytics.weeklyTotalDuration)}
            icon="time-outline"
            iconColor={colors.accent}
            subtitle="total time"
          />
          <View style={{ width: SPACING.md }} />
          <StatCard
            title="Volume"
            value={formatVolume(analytics.weeklyTotalVolume)}
            icon="trending-up-outline"
            iconColor={colors.success}
            subtitle="lifted"
          />
          <View style={{ width: SPACING.md }} />
          <StatCard
            title="Calories"
            value={analytics.weeklyCalories}
            icon="flame-outline"
            iconColor="#EF4444"
            subtitle="estimated"
          />
        </ScrollView>

        {/* Muscle Group Breakdown */}
        {Object.keys(analytics.muscleGroupCount).length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Muscles Trained
            </Text>
            <Card style={styles.muscleCard}>
              {Object.entries(analytics.muscleGroupCount)
                .sort((a, b) => b[1] - a[1])
                .map(([group, count]) => (
                  <View key={group} style={styles.muscleRow}>
                    <View style={styles.muscleLeft}>
                      <View
                        style={[
                          styles.muscleDot,
                          {
                            backgroundColor:
                              MUSCLE_GROUP_COLORS[group as MuscleGroup] || colors.primary,
                          },
                        ]}
                      />
                      <Text style={[styles.muscleLabel, { color: colors.text }]}>
                        {MUSCLE_GROUP_LABELS[group as MuscleGroup]}
                      </Text>
                    </View>
                    <Text style={[styles.muscleCount, { color: colors.textSecondary }]}>
                      {count} exercises
                    </Text>
                  </View>
                ))}
            </Card>
          </>
        )}

        {/* Personal Records */}
        {personalRecords.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Personal Records
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recordsRow}
            >
              {personalRecords.slice(0, 5).map((record) => (
                <Card key={record.id} style={styles.recordCard}>
                  <Ionicons name="trophy" size={20} color={colors.accent} />
                  <Text style={[styles.recordExercise, { color: colors.text }]} numberOfLines={1}>
                    {record.exerciseName}
                  </Text>
                  <Text style={[styles.recordValue, { color: colors.primary }]}>
                    {record.weight}kg x {record.reps}
                  </Text>
                  <Text style={[styles.recordDate, { color: colors.textTertiary }]}>
                    {new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </Card>
              ))}
            </ScrollView>
          </>
        )}

        {/* Recent Workouts */}
        <View style={styles.recentHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
            Recent Workouts
          </Text>
          {workouts.length > 3 && (
            <TouchableOpacity onPress={() => navigation.navigate('Workouts')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
            </TouchableOpacity>
          )}
        </View>

        {recentWorkouts.length === 0 ? (
          <Card style={styles.emptyCard}>
            <EmptyState
              icon="barbell-outline"
              title="No Workouts Yet"
              message="Start your first workout to see your progress here!"
              actionLabel="Start Workout"
              onAction={() => navigation.navigate('Workouts')}
            />
          </Card>
        ) : (
          recentWorkouts.map((workout) => (
            <Card key={workout.id} style={styles.workoutCard}>
              <View style={styles.workoutHeader}>
                <View>
                  <Text style={[styles.workoutName, { color: colors.text }]}>
                    {workout.name}
                  </Text>
                  <Text style={[styles.workoutDate, { color: colors.textSecondary }]}>
                    {new Date(workout.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
                <View style={styles.workoutMeta}>
                  <View style={styles.workoutMetaItem}>
                    <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
                    <Text style={[styles.workoutMetaText, { color: colors.textSecondary }]}>
                      {workout.duration ? formatDuration(workout.duration) : '-'}
                    </Text>
                  </View>
                  <View style={styles.workoutMetaItem}>
                    <Ionicons name="barbell-outline" size={14} color={colors.textTertiary} />
                    <Text style={[styles.workoutMetaText, { color: colors.textSecondary }]}>
                      {workout.exercises.length} exercises
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.workoutTags}>
                {[...new Set(workout.exercises.map(e => e.muscleGroup))].map(group => (
                  <View
                    key={group}
                    style={[
                      styles.muscleTag,
                      {
                        backgroundColor:
                          (MUSCLE_GROUP_COLORS[group] || colors.primary) + '20',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.muscleTagText,
                        {
                          color: MUSCLE_GROUP_COLORS[group] || colors.primary,
                        },
                      ]}
                    >
                      {MUSCLE_GROUP_LABELS[group]}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          ))
        )}

        {/* Monthly Summary */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Monthly Overview
        </Text>
        <Card style={styles.monthlyCard}>
          <View style={styles.monthlyGrid}>
            <View style={styles.monthlyItem}>
              <Text style={[styles.monthlyValue, { color: colors.primary }]}>
                {analytics.monthWorkouts}
              </Text>
              <Text style={[styles.monthlyLabel, { color: colors.textSecondary }]}>
                Workouts
              </Text>
            </View>
            <View style={[styles.monthlyDivider, { backgroundColor: colors.border }]} />
            <View style={styles.monthlyItem}>
              <Text style={[styles.monthlyValue, { color: colors.accent }]}>
                {formatDuration(analytics.monthlyTotalDuration)}
              </Text>
              <Text style={[styles.monthlyLabel, { color: colors.textSecondary }]}>
                Total Time
              </Text>
            </View>
            <View style={[styles.monthlyDivider, { backgroundColor: colors.border }]} />
            <View style={styles.monthlyItem}>
              <Text style={[styles.monthlyValue, { color: colors.success }]}>
                {personalRecords.length}
              </Text>
              <Text style={[styles.monthlyLabel, { color: colors.textSecondary }]}>
                PRs
              </Text>
            </View>
          </View>
        </Card>

        <View style={{ height: SPACING.huge }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  greeting: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
  },
  userName: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: FONT_WEIGHT.heavy,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.xs,
  },
  streakText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
  },
  goalCard: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
  },
  goalSubtitle: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  goalBadge: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  statsRow: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  muscleCard: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
  },
  muscleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  muscleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  muscleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SPACING.md,
  },
  muscleLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
  },
  muscleCount: {
    fontSize: FONT_SIZE.sm,
  },
  recordsRow: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  recordCard: {
    width: 140,
    marginRight: SPACING.md,
    alignItems: 'center',
  },
  recordExercise: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  recordValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    marginTop: SPACING.xs,
  },
  recordDate: {
    fontSize: FONT_SIZE.xs,
    marginTop: SPACING.xs,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  seeAll: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
  },
  emptyCard: {
    marginHorizontal: SPACING.xl,
    minHeight: 200,
  },
  workoutCard: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  workoutName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
  },
  workoutDate: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  workoutMeta: {
    alignItems: 'flex-end',
  },
  workoutMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: 2,
  },
  workoutMetaText: {
    fontSize: FONT_SIZE.sm,
  },
  workoutTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  muscleTag: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  muscleTagText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
  },
  monthlyCard: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
  },
  monthlyGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthlyItem: {
    flex: 1,
    alignItems: 'center',
  },
  monthlyValue: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.heavy,
  },
  monthlyLabel: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  monthlyDivider: {
    width: 1,
    height: 40,
  },
});
