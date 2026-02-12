// ==========================================
// GymTrack Pro - Workouts Screen
// ==========================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { FONT_SIZE, FONT_WEIGHT, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { MUSCLE_GROUP_COLORS, MUSCLE_GROUP_LABELS } from '../../constants/exercises';

export const WorkoutsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const { workouts, activeWorkout, startWorkout, templates, deleteWorkout } = useApp();
  const [showHistory, setShowHistory] = useState(true);

  const handleStartEmptyWorkout = () => {
    const workout = startWorkout('New Workout');
    navigation.navigate('ActiveWorkout', { workoutId: workout.id });
  };

  const handleStartFromTemplate = (templateId: string, name: string) => {
    const workout = startWorkout(name, templateId);
    navigation.navigate('ActiveWorkout', { workoutId: workout.id });
  };

  const handleResumeWorkout = () => {
    if (activeWorkout) {
      navigation.navigate('ActiveWorkout', { workoutId: activeWorkout.id });
    }
  };

  const handleDeleteWorkout = (id: string) => {
    Alert.alert(
      'Delete Workout',
      'Are you sure you want to delete this workout? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteWorkout(id) },
      ]
    );
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const completedWorkouts = workouts.filter(w => w.isCompleted);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Workouts</Text>
        </View>

        {/* Active Workout Banner */}
        {activeWorkout && (
          <TouchableOpacity
            onPress={handleResumeWorkout}
            style={[styles.activeBanner, { backgroundColor: colors.primary }]}
          >
            <View style={styles.activeBannerContent}>
              <Ionicons name="pulse" size={24} color="#FFF" />
              <View style={styles.activeBannerText}>
                <Text style={styles.activeBannerTitle}>Workout In Progress</Text>
                <Text style={styles.activeBannerSubtitle}>
                  {activeWorkout.name} - {activeWorkout.exercises.length} exercises
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FFF" />
          </TouchableOpacity>
        )}

        {/* Quick Start */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Quick Start
        </Text>
        <Card
          style={styles.quickStartCard}
          onPress={handleStartEmptyWorkout}
        >
          <View style={styles.quickStartContent}>
            <View style={[styles.quickStartIcon, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="add-circle" size={32} color={colors.primary} />
            </View>
            <View style={styles.quickStartText}>
              <Text style={[styles.quickStartTitle, { color: colors.text }]}>
                Start Empty Workout
              </Text>
              <Text style={[styles.quickStartSubtitle, { color: colors.textSecondary }]}>
                Add exercises as you go
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </View>
        </Card>

        {/* Templates */}
        {templates.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              My Templates
            </Text>
            {templates.map((template) => (
              <Card
                key={template.id}
                style={styles.templateCard}
                onPress={() => handleStartFromTemplate(template.id, template.name)}
              >
                <View style={styles.templateHeader}>
                  <View>
                    <Text style={[styles.templateName, { color: colors.text }]}>
                      {template.name}
                    </Text>
                    <Text style={[styles.templateMeta, { color: colors.textSecondary }]}>
                      {template.exercises.length} exercises · Used {template.timesUsed} times
                    </Text>
                  </View>
                  <Ionicons name="play-circle" size={28} color={colors.primary} />
                </View>
                <View style={styles.templateExercises}>
                  {template.exercises.slice(0, 3).map((ex, idx) => (
                    <Text
                      key={idx}
                      style={[styles.templateExercise, { color: colors.textSecondary }]}
                    >
                      • {ex.exerciseName} ({ex.targetSets}x{ex.targetReps})
                    </Text>
                  ))}
                  {template.exercises.length > 3 && (
                    <Text style={[styles.templateMore, { color: colors.textTertiary }]}>
                      +{template.exercises.length - 3} more
                    </Text>
                  )}
                </View>
              </Card>
            ))}
          </>
        )}

        {/* Workout History */}
        <View style={styles.historyHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
            Workout History
          </Text>
          <Text style={[styles.historyCount, { color: colors.textSecondary }]}>
            {completedWorkouts.length} total
          </Text>
        </View>

        {completedWorkouts.length === 0 ? (
          <Card style={styles.emptyCard}>
            <EmptyState
              icon="barbell-outline"
              title="No Workouts Yet"
              message="Start your first workout and it will appear here!"
              actionLabel="Start Workout"
              onAction={handleStartEmptyWorkout}
            />
          </Card>
        ) : (
          completedWorkouts.map((workout) => (
            <Card key={workout.id} style={styles.historyCard}>
              <TouchableOpacity
                onLongPress={() => handleDeleteWorkout(workout.id)}
              >
                <View style={styles.historyCardHeader}>
                  <View style={styles.historyDate}>
                    <Text style={[styles.historyDay, { color: colors.primary }]}>
                      {new Date(workout.date).getDate()}
                    </Text>
                    <Text style={[styles.historyMonth, { color: colors.textSecondary }]}>
                      {new Date(workout.date).toLocaleDateString('en-US', { month: 'short' })}
                    </Text>
                  </View>
                  <View style={styles.historyInfo}>
                    <Text style={[styles.historyName, { color: colors.text }]}>
                      {workout.name}
                    </Text>
                    <View style={styles.historyStats}>
                      <View style={styles.historyStat}>
                        <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
                        <Text style={[styles.historyStatText, { color: colors.textSecondary }]}>
                          {workout.duration ? formatDuration(workout.duration) : '-'}
                        </Text>
                      </View>
                      <View style={styles.historyStat}>
                        <Ionicons name="barbell-outline" size={14} color={colors.textTertiary} />
                        <Text style={[styles.historyStatText, { color: colors.textSecondary }]}>
                          {workout.exercises.length} exercises
                        </Text>
                      </View>
                      <View style={styles.historyStat}>
                        <Ionicons name="layers-outline" size={14} color={colors.textTertiary} />
                        <Text style={[styles.historyStatText, { color: colors.textSecondary }]}>
                          {workout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0)} sets
                        </Text>
                      </View>
                    </View>
                    <View style={styles.historyTags}>
                      {[...new Set(workout.exercises.map(e => e.muscleGroup))].map(group => (
                        <View
                          key={group}
                          style={[
                            styles.tag,
                            { backgroundColor: (MUSCLE_GROUP_COLORS[group] || colors.primary) + '20' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.tagText,
                              { color: MUSCLE_GROUP_COLORS[group] || colors.primary },
                            ]}
                          >
                            {MUSCLE_GROUP_LABELS[group]}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </Card>
          ))
        )}

        <View style={{ height: SPACING.huge }} />
      </ScrollView>
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
  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
  },
  activeBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  activeBannerText: {},
  activeBannerTitle: {
    color: '#FFF',
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
  },
  activeBannerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
  },
  quickStartCard: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  quickStartContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickStartIcon: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.lg,
  },
  quickStartText: {
    flex: 1,
  },
  quickStartTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
  },
  quickStartSubtitle: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  templateCard: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  templateName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
  },
  templateMeta: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  templateExercises: {
    marginTop: SPACING.sm,
  },
  templateExercise: {
    fontSize: FONT_SIZE.sm,
    marginBottom: 2,
  },
  templateMore: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  historyCount: {
    fontSize: FONT_SIZE.sm,
  },
  emptyCard: {
    marginHorizontal: SPACING.xl,
    minHeight: 200,
  },
  historyCard: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
  },
  historyCardHeader: {
    flexDirection: 'row',
  },
  historyDate: {
    width: 48,
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  historyDay: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.heavy,
  },
  historyMonth: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
    textTransform: 'uppercase',
  },
  historyInfo: {
    flex: 1,
  },
  historyName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING.xs,
  },
  historyStats: {
    flexDirection: 'row',
    gap: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  historyStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  historyStatText: {
    fontSize: FONT_SIZE.sm,
  },
  historyTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  tag: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  tagText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
  },
});
