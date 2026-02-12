// ==========================================
// GymTrack Pro - Active Workout Screen
// ==========================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Exercise, MuscleGroup } from '../../types';
import { FONT_SIZE, FONT_WEIGHT, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { MUSCLE_GROUP_LABELS, MUSCLE_GROUP_COLORS } from '../../constants/exercises';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const ActiveWorkoutScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { colors } = useTheme();
  const {
    activeWorkout,
    exercises,
    finishWorkout,
    cancelWorkout,
    addExerciseToWorkout,
    removeExerciseFromWorkout,
    addSetToExercise,
    removeSetFromExercise,
    updateSet,
    updateWorkoutNotes,
  } = useApp();

  const [elapsed, setElapsed] = useState(0);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroup | 'all'>('all');
  const [restTimer, setRestTimer] = useState(0);
  const [restTimerActive, setRestTimerActive] = useState(false);
  const [restTimerDuration, setRestTimerDuration] = useState(90);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>(null);
  const restTimerRef = useRef<NodeJS.Timeout>(null);

  // Workout timer
  useEffect(() => {
    if (activeWorkout) {
      timerRef.current = setInterval(() => {
        const start = new Date(activeWorkout.startTime).getTime();
        const now = Date.now();
        setElapsed(Math.floor((now - start) / 1000));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeWorkout?.startTime]);

  // Rest timer
  useEffect(() => {
    if (restTimerActive && restTimer > 0) {
      restTimerRef.current = setInterval(() => {
        setRestTimer(prev => {
          if (prev <= 1) {
            setRestTimerActive(false);
            setShowRestTimer(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    };
  }, [restTimerActive, restTimer]);

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startRestTimer = (seconds: number) => {
    setRestTimerDuration(seconds);
    setRestTimer(seconds);
    setRestTimerActive(true);
    setShowRestTimer(true);
  };

  const handleFinishWorkout = () => {
    if (!activeWorkout) return;
    const hasCompletedSets = activeWorkout.exercises.some(ex =>
      ex.sets.some(s => s.isCompleted)
    );

    if (!hasCompletedSets) {
      Alert.alert(
        'No Completed Sets',
        'You haven\'t completed any sets yet. Do you want to discard this workout?',
        [
          { text: 'Keep Training', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => { cancelWorkout(); navigation.goBack(); } },
        ]
      );
      return;
    }

    Alert.alert(
      'Finish Workout',
      'Are you sure you want to finish this workout?',
      [
        { text: 'Keep Training', style: 'cancel' },
        {
          text: 'Finish',
          onPress: async () => {
            await finishWorkout(activeWorkout.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleCancelWorkout = () => {
    Alert.alert(
      'Discard Workout',
      'Are you sure you want to discard this workout? All progress will be lost.',
      [
        { text: 'Keep Training', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            cancelWorkout();
            navigation.goBack();
          },
        },
      ]
    );
  };

  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup = selectedMuscleGroup === 'all' || ex.muscleGroup === selectedMuscleGroup;
    return matchesSearch && matchesGroup;
  });

  const muscleGroups: (MuscleGroup | 'all')[] = [
    'all', 'chest', 'back', 'shoulders', 'biceps', 'triceps',
    'legs', 'glutes', 'abs', 'cardio',
  ];

  if (!activeWorkout) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <Text style={[styles.noWorkout, { color: colors.textSecondary }]}>
            No active workout
          </Text>
          <Button title="Go Back" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleCancelWorkout}>
          <Text style={[styles.cancelText, { color: colors.error }]}>Discard</Text>
        </TouchableOpacity>
        <View style={styles.timerContainer}>
          <Ionicons name="time-outline" size={16} color={colors.primary} />
          <Text style={[styles.timerText, { color: colors.primary }]}>
            {formatTime(elapsed)}
          </Text>
        </View>
        <TouchableOpacity onPress={handleFinishWorkout}>
          <Text style={[styles.finishText, { color: colors.success }]}>Finish</Text>
        </TouchableOpacity>
      </View>

      {/* Rest Timer Overlay */}
      {showRestTimer && (
        <View style={[styles.restTimerOverlay, { backgroundColor: colors.surfaceElevated }]}>
          <View style={styles.restTimerContent}>
            <Text style={[styles.restTimerLabel, { color: colors.textSecondary }]}>Rest Timer</Text>
            <Text style={[styles.restTimerTime, { color: colors.primary }]}>
              {formatTime(restTimer)}
            </Text>
            <View style={styles.restTimerButtons}>
              <TouchableOpacity
                onPress={() => setRestTimer(prev => Math.max(0, prev - 15))}
                style={[styles.restTimerBtn, { backgroundColor: colors.surface }]}
              >
                <Text style={{ color: colors.text }}>-15s</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setRestTimerActive(false); setShowRestTimer(false); }}
                style={[styles.restTimerBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={{ color: '#FFF' }}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setRestTimer(prev => prev + 15)}
                style={[styles.restTimerBtn, { backgroundColor: colors.surface }]}
              >
                <Text style={{ color: colors.text }}>+15s</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Workout Title */}
        <TextInput
          style={[styles.workoutTitle, { color: colors.text }]}
          value={activeWorkout.name}
          placeholder="Workout Name"
          placeholderTextColor={colors.textTertiary}
          onChangeText={(text) => {
            // Update workout name if needed
          }}
        />

        {/* Notes */}
        <View style={styles.notesContainer}>
          <TextInput
            style={[styles.notesInput, { color: colors.textSecondary, backgroundColor: colors.inputBackground, borderColor: colors.border }]}
            placeholder="Add workout notes..."
            placeholderTextColor={colors.textTertiary}
            value={activeWorkout.notes || ''}
            onChangeText={(text) => updateWorkoutNotes(activeWorkout.id, text)}
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Exercises */}
        {activeWorkout.exercises.map((exercise, exIndex) => (
          <Card key={exercise.id} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <View style={styles.exerciseInfo}>
                <Text style={[styles.exerciseName, { color: colors.primary }]}>
                  {exercise.exerciseName}
                </Text>
                <View
                  style={[
                    styles.exerciseTag,
                    { backgroundColor: (MUSCLE_GROUP_COLORS[exercise.muscleGroup] || colors.primary) + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.exerciseTagText,
                      { color: MUSCLE_GROUP_COLORS[exercise.muscleGroup] || colors.primary },
                    ]}
                  >
                    {MUSCLE_GROUP_LABELS[exercise.muscleGroup]}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert('Remove Exercise', `Remove ${exercise.exerciseName}?`, [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Remove',
                      style: 'destructive',
                      onPress: () => removeExerciseFromWorkout(activeWorkout.id, exercise.id),
                    },
                  ]);
                }}
              >
                <Ionicons name="close-circle-outline" size={24} color={colors.error} />
              </TouchableOpacity>
            </View>

            {/* Sets Table Header */}
            <View style={styles.setsHeader}>
              <Text style={[styles.setHeaderText, { color: colors.textTertiary, width: 40 }]}>SET</Text>
              <Text style={[styles.setHeaderText, { color: colors.textTertiary, flex: 1 }]}>WEIGHT</Text>
              <Text style={[styles.setHeaderText, { color: colors.textTertiary, flex: 1 }]}>REPS</Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Sets */}
            {exercise.sets.map((set) => (
              <View
                key={set.id}
                style={[
                  styles.setRow,
                  set.isCompleted && { backgroundColor: colors.success + '10' },
                ]}
              >
                <View style={styles.setNumberContainer}>
                  <Text style={[styles.setNumber, { color: colors.textSecondary }]}>
                    {set.setNumber}
                  </Text>
                </View>
                <TextInput
                  style={[
                    styles.setInput,
                    {
                      color: colors.text,
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.border,
                    },
                  ]}
                  value={set.weight?.toString() || ''}
                  onChangeText={(text) => {
                    const weight = text ? parseFloat(text) : null;
                    updateSet(activeWorkout.id, exercise.id, set.id, { weight });
                  }}
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="decimal-pad"
                />
                <TextInput
                  style={[
                    styles.setInput,
                    {
                      color: colors.text,
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.border,
                    },
                  ]}
                  value={set.reps?.toString() || ''}
                  onChangeText={(text) => {
                    const reps = text ? parseInt(text) : null;
                    updateSet(activeWorkout.id, exercise.id, set.id, { reps });
                  }}
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  onPress={() => {
                    const newIsCompleted = !set.isCompleted;
                    updateSet(activeWorkout.id, exercise.id, set.id, {
                      isCompleted: newIsCompleted,
                    });
                    if (newIsCompleted && exercise.restTimerSeconds > 0) {
                      startRestTimer(exercise.restTimerSeconds);
                    }
                  }}
                  style={[
                    styles.checkButton,
                    {
                      backgroundColor: set.isCompleted ? colors.success : colors.inputBackground,
                      borderColor: set.isCompleted ? colors.success : colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="checkmark"
                    size={18}
                    color={set.isCompleted ? '#FFF' : colors.textTertiary}
                  />
                </TouchableOpacity>
              </View>
            ))}

            {/* Add/Remove Set Buttons */}
            <View style={styles.setActions}>
              <TouchableOpacity
                onPress={() => addSetToExercise(activeWorkout.id, exercise.id)}
                style={styles.addSetButton}
              >
                <Ionicons name="add" size={18} color={colors.primary} />
                <Text style={[styles.addSetText, { color: colors.primary }]}>Add Set</Text>
              </TouchableOpacity>
              {exercise.sets.length > 1 && (
                <TouchableOpacity
                  onPress={() => {
                    const lastSet = exercise.sets[exercise.sets.length - 1];
                    removeSetFromExercise(activeWorkout.id, exercise.id, lastSet.id);
                  }}
                  style={styles.removeSetButton}
                >
                  <Ionicons name="remove" size={18} color={colors.error} />
                  <Text style={[styles.removeSetText, { color: colors.error }]}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>
        ))}

        {/* Add Exercise Button */}
        <Button
          title="Add Exercise"
          onPress={() => setShowExercisePicker(true)}
          variant="outline"
          icon={<Ionicons name="add" size={20} color={colors.primary} />}
          fullWidth
          style={{ marginHorizontal: SPACING.xl, marginTop: SPACING.md, marginBottom: SPACING.huge }}
        />
      </ScrollView>

      {/* Exercise Picker Modal */}
      <Modal
        visible={showExercisePicker}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Exercise</Text>
            <TouchableOpacity onPress={() => setShowExercisePicker(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <View style={[styles.searchBar, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
              <Ionicons name="search" size={20} color={colors.textTertiary} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search exercises..."
                placeholderTextColor={colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {/* Muscle Group Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterContainer}
          >
            {muscleGroups.map((group) => (
              <TouchableOpacity
                key={group}
                onPress={() => setSelectedMuscleGroup(group)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: selectedMuscleGroup === group ? colors.primary : colors.surface,
                    borderColor: selectedMuscleGroup === group ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color: selectedMuscleGroup === group ? '#FFF' : colors.textSecondary,
                    },
                  ]}
                >
                  {group === 'all' ? 'All' : MUSCLE_GROUP_LABELS[group]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Exercise List */}
          <FlatList
            data={filteredExercises}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  addExerciseToWorkout(activeWorkout.id, item);
                  setShowExercisePicker(false);
                  setSearchQuery('');
                }}
                style={[styles.exerciseListItem, { borderBottomColor: colors.border }]}
              >
                <View>
                  <Text style={[styles.exerciseListName, { color: colors.text }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.exerciseListMeta, { color: colors.textSecondary }]}>
                    {MUSCLE_GROUP_LABELS[item.muscleGroup]} · {item.category}
                    {item.isCustom ? ' · Custom' : ''}
                  </Text>
                </View>
                <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyList}>
                <Text style={[styles.emptyListText, { color: colors.textSecondary }]}>
                  No exercises found
                </Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noWorkout: {
    fontSize: FONT_SIZE.lg,
    marginBottom: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  cancelText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  timerText: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    fontVariant: ['tabular-nums'],
  },
  finishText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
  },
  restTimerOverlay: {
    position: 'absolute',
    top: 60,
    left: SPACING.xl,
    right: SPACING.xl,
    zIndex: 100,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  restTimerContent: {
    alignItems: 'center',
  },
  restTimerLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    marginBottom: SPACING.xs,
  },
  restTimerTime: {
    fontSize: FONT_SIZE.hero,
    fontWeight: FONT_WEIGHT.heavy,
    fontVariant: ['tabular-nums'],
  },
  restTimerButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  restTimerBtn: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  workoutTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.heavy,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  notesContainer: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  notesInput: {
    fontSize: FONT_SIZE.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    minHeight: 44,
    textAlignVertical: 'top',
  },
  exerciseCard: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  exerciseInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  exerciseName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
  },
  exerciseTag: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  exerciseTagText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
  },
  setsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  setHeaderText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    gap: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  setNumberContainer: {
    width: 40,
    alignItems: 'center',
  },
  setNumber: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
  },
  setInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    textAlign: 'center',
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
  },
  checkButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.lg,
    marginTop: SPACING.md,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  addSetText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
  },
  removeSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  removeSetText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
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
  modalTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
  },
  searchContainer: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    height: 44,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    height: '100%',
  },
  filterScroll: {
    maxHeight: 44,
  },
  filterContainer: {
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  exerciseListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
  },
  exerciseListName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
  },
  exerciseListMeta: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  emptyList: {
    padding: SPACING.xxxl,
    alignItems: 'center',
  },
  emptyListText: {
    fontSize: FONT_SIZE.md,
  },
});
