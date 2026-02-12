// ==========================================
// GymTrack Pro - Progress Screen
// ==========================================

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../contexts/ThemeContext';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { EmptyState } from '../../components/EmptyState';
import { ProgressBar } from '../../components/ProgressBar';
import { FONT_SIZE, FONT_WEIGHT, SPACING, BORDER_RADIUS, COLORS } from '../../constants/theme';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - SPACING.xl * 2 - SPACING.lg * 2;

type ProgressTab = 'weight' | 'measurements' | 'photos' | 'strength';

export const ProgressScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const {
    bodyWeights,
    addBodyWeight,
    deleteBodyWeight,
    measurements,
    addMeasurement,
    deleteMeasurement,
    progressPhotos,
    addProgressPhoto,
    deleteProgressPhoto,
    personalRecords,
    workouts,
    user,
  } = useApp();

  const [activeTab, setActiveTab] = useState<ProgressTab>('weight');
  const [showAddWeight, setShowAddWeight] = useState(false);
  const [showAddMeasurement, setShowAddMeasurement] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [newChest, setNewChest] = useState('');
  const [newArms, setNewArms] = useState('');
  const [newWaist, setNewWaist] = useState('');
  const [newLegs, setNewLegs] = useState('');

  // Weight chart data (simple)
  const weightData = useMemo(() => {
    return [...bodyWeights]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-14); // Last 14 entries
  }, [bodyWeights]);

  const weightRange = useMemo(() => {
    if (weightData.length === 0) return { min: 0, max: 100 };
    const weights = weightData.map(w => w.weight);
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const padding = (max - min) * 0.1 || 5;
    return { min: min - padding, max: max + padding };
  }, [weightData]);

  // Strength progress
  const strengthProgress = useMemo(() => {
    const exerciseProgress: Record<string, { name: string; history: { date: string; maxWeight: number }[] }> = {};

    const completedWorkouts = workouts.filter(w => w.isCompleted);
    completedWorkouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        const maxWeight = Math.max(...exercise.sets.filter(s => s.isCompleted).map(s => s.weight || 0));
        if (maxWeight > 0) {
          if (!exerciseProgress[exercise.exerciseId]) {
            exerciseProgress[exercise.exerciseId] = {
              name: exercise.exerciseName,
              history: [],
            };
          }
          exerciseProgress[exercise.exerciseId].history.push({
            date: workout.date,
            maxWeight,
          });
        }
      });
    });

    return Object.values(exerciseProgress)
      .filter(ep => ep.history.length >= 2)
      .map(ep => ({
        ...ep,
        history: ep.history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      }));
  }, [workouts]);

  const handleAddWeight = async () => {
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight <= 0) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight.');
      return;
    }
    await addBodyWeight(weight);
    setNewWeight('');
    setShowAddWeight(false);
  };

  const handleAddMeasurement = async () => {
    const chest = newChest ? parseFloat(newChest) : undefined;
    const arms = newArms ? parseFloat(newArms) : undefined;
    const waist = newWaist ? parseFloat(newWaist) : undefined;
    const legs = newLegs ? parseFloat(newLegs) : undefined;

    if (!chest && !arms && !waist && !legs) {
      Alert.alert('No Data', 'Please enter at least one measurement.');
      return;
    }

    await addMeasurement({ chest, arms, waist, legs });
    setNewChest('');
    setNewArms('');
    setNewWaist('');
    setNewLegs('');
    setShowAddMeasurement(false);
  };

  const handleAddPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await addProgressPhoto({
        uri: result.assets[0].uri,
        category: 'front',
      });
    }
  };

  const tabs: { key: ProgressTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'weight', label: 'Weight', icon: 'scale-outline' },
    { key: 'measurements', label: 'Body', icon: 'body-outline' },
    { key: 'photos', label: 'Photos', icon: 'camera-outline' },
    { key: 'strength', label: 'Strength', icon: 'trending-up-outline' },
  ];

  const renderWeightTab = () => (
    <View>
      <View style={styles.tabHeader}>
        <Text style={[styles.tabTitle, { color: colors.text }]}>Body Weight</Text>
        <Button
          title="Log Weight"
          onPress={() => setShowAddWeight(true)}
          variant="primary"
          size="sm"
          icon={<Ionicons name="add" size={16} color="#FFF" />}
        />
      </View>

      {/* Current Weight */}
      {bodyWeights.length > 0 && (
        <Card style={styles.currentCard}>
          <View style={styles.currentWeight}>
            <View>
              <Text style={[styles.currentLabel, { color: colors.textSecondary }]}>
                Current Weight
              </Text>
              <Text style={[styles.currentValue, { color: colors.text }]}>
                {bodyWeights[0].weight} kg
              </Text>
              <Text style={[styles.currentDate, { color: colors.textTertiary }]}>
                {new Date(bodyWeights[0].date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
            {bodyWeights.length >= 2 && (
              <View style={styles.weightChange}>
                {(() => {
                  const change = bodyWeights[0].weight - bodyWeights[1].weight;
                  const isPositive = change > 0;
                  return (
                    <>
                      <Ionicons
                        name={isPositive ? 'arrow-up' : 'arrow-down'}
                        size={16}
                        color={isPositive ? colors.error : colors.success}
                      />
                      <Text
                        style={[
                          styles.changeValue,
                          { color: isPositive ? colors.error : colors.success },
                        ]}
                      >
                        {Math.abs(change).toFixed(1)} kg
                      </Text>
                    </>
                  );
                })()}
              </View>
            )}
          </View>
        </Card>
      )}

      {/* Simple Chart */}
      {weightData.length > 1 && (
        <Card style={styles.chartCard}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>Weight Trend</Text>
          <View style={styles.chart}>
            <View style={styles.chartLabels}>
              <Text style={[styles.chartLabel, { color: colors.textTertiary }]}>
                {weightRange.max.toFixed(0)}
              </Text>
              <Text style={[styles.chartLabel, { color: colors.textTertiary }]}>
                {((weightRange.max + weightRange.min) / 2).toFixed(0)}
              </Text>
              <Text style={[styles.chartLabel, { color: colors.textTertiary }]}>
                {weightRange.min.toFixed(0)}
              </Text>
            </View>
            <View style={styles.chartBars}>
              {weightData.map((entry, index) => {
                const range = weightRange.max - weightRange.min;
                const heightPercent = range > 0
                  ? ((entry.weight - weightRange.min) / range) * 100
                  : 50;
                return (
                  <View key={entry.id} style={styles.chartBarContainer}>
                    <View
                      style={[
                        styles.chartBar,
                        {
                          height: `${Math.max(heightPercent, 5)}%`,
                          backgroundColor: colors.primary,
                        },
                      ]}
                    />
                    <Text style={[styles.chartBarLabel, { color: colors.textTertiary }]}>
                      {new Date(entry.date).getDate()}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </Card>
      )}

      {/* Weight History */}
      <Text style={[styles.historyTitle, { color: colors.text }]}>History</Text>
      {bodyWeights.length === 0 ? (
        <EmptyState
          icon="scale-outline"
          title="No Weight Entries"
          message="Start logging your body weight to track your progress over time."
          actionLabel="Log Weight"
          onAction={() => setShowAddWeight(true)}
        />
      ) : (
        bodyWeights.slice(0, 20).map((entry) => (
          <TouchableOpacity
            key={entry.id}
            onLongPress={() => {
              Alert.alert('Delete Entry', 'Delete this weight entry?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deleteBodyWeight(entry.id) },
              ]);
            }}
          >
            <View style={[styles.historyItem, { borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.historyWeight, { color: colors.text }]}>
                  {entry.weight} kg
                </Text>
                <Text style={[styles.historyDate, { color: colors.textSecondary }]}>
                  {new Date(entry.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  const renderMeasurementsTab = () => (
    <View>
      <View style={styles.tabHeader}>
        <Text style={[styles.tabTitle, { color: colors.text }]}>Body Measurements</Text>
        <Button
          title="Add"
          onPress={() => setShowAddMeasurement(true)}
          variant="primary"
          size="sm"
          icon={<Ionicons name="add" size={16} color="#FFF" />}
        />
      </View>

      {measurements.length === 0 ? (
        <EmptyState
          icon="body-outline"
          title="No Measurements"
          message="Track your body measurements to monitor your physical progress."
          actionLabel="Add Measurement"
          onAction={() => setShowAddMeasurement(true)}
        />
      ) : (
        <>
          {/* Latest Measurements */}
          <Card style={styles.measurementCard}>
            <Text style={[styles.measurementTitle, { color: colors.text }]}>
              Latest Measurements
            </Text>
            <View style={styles.measurementGrid}>
              {[
                { label: 'Chest', value: measurements[0].chest, unit: 'cm', color: '#EF4444' },
                { label: 'Arms', value: measurements[0].arms, unit: 'cm', color: '#F97316' },
                { label: 'Waist', value: measurements[0].waist, unit: 'cm', color: '#3B82F6' },
                { label: 'Legs', value: measurements[0].legs, unit: 'cm', color: '#10B981' },
              ].map((item) => (
                <View key={item.label} style={styles.measurementItem}>
                  <View style={[styles.measurementDot, { backgroundColor: item.color }]} />
                  <Text style={[styles.measurementLabel, { color: colors.textSecondary }]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.measurementValue, { color: colors.text }]}>
                    {item.value ? `${item.value} ${item.unit}` : '-'}
                  </Text>
                </View>
              ))}
            </View>
            <Text style={[styles.measurementDate, { color: colors.textTertiary }]}>
              {new Date(measurements[0].date).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </Card>

          {/* History */}
          {measurements.slice(1).map((m) => (
            <TouchableOpacity
              key={m.id}
              onLongPress={() => {
                Alert.alert('Delete', 'Delete this measurement?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => deleteMeasurement(m.id) },
                ]);
              }}
            >
              <Card style={styles.historyMeasureCard}>
                <Text style={[styles.historyMeasureDate, { color: colors.textSecondary }]}>
                  {new Date(m.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
                <View style={styles.historyMeasureRow}>
                  {m.chest && <Text style={[styles.historyMeasureItem, { color: colors.text }]}>Chest: {m.chest}cm</Text>}
                  {m.arms && <Text style={[styles.historyMeasureItem, { color: colors.text }]}>Arms: {m.arms}cm</Text>}
                  {m.waist && <Text style={[styles.historyMeasureItem, { color: colors.text }]}>Waist: {m.waist}cm</Text>}
                  {m.legs && <Text style={[styles.historyMeasureItem, { color: colors.text }]}>Legs: {m.legs}cm</Text>}
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </>
      )}
    </View>
  );

  const renderPhotosTab = () => (
    <View>
      <View style={styles.tabHeader}>
        <Text style={[styles.tabTitle, { color: colors.text }]}>Progress Photos</Text>
        <Button
          title="Add Photo"
          onPress={handleAddPhoto}
          variant="primary"
          size="sm"
          icon={<Ionicons name="camera" size={16} color="#FFF" />}
        />
      </View>

      {progressPhotos.length === 0 ? (
        <EmptyState
          icon="camera-outline"
          title="No Photos"
          message="Take progress photos to visually track your transformation."
          actionLabel="Add Photo"
          onAction={handleAddPhoto}
        />
      ) : (
        <View style={styles.photoGrid}>
          {progressPhotos.map((photo) => (
            <TouchableOpacity
              key={photo.id}
              onLongPress={() => {
                Alert.alert('Delete Photo', 'Delete this photo?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => deleteProgressPhoto(photo.id) },
                ]);
              }}
              style={styles.photoItem}
            >
              <Image source={{ uri: photo.uri }} style={styles.photoImage} />
              <Text style={[styles.photoDate, { color: colors.textSecondary }]}>
                {new Date(photo.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderStrengthTab = () => (
    <View>
      <View style={styles.tabHeader}>
        <Text style={[styles.tabTitle, { color: colors.text }]}>Strength Progress</Text>
      </View>

      {/* Personal Records */}
      {personalRecords.length > 0 && (
        <>
          <Text style={[styles.subTitle, { color: colors.text }]}>Personal Records</Text>
          {personalRecords.map((record) => (
            <Card key={record.id} style={styles.recordCard}>
              <View style={styles.recordHeader}>
                <Ionicons name="trophy" size={20} color={colors.accent} />
                <Text style={[styles.recordName, { color: colors.text }]}>
                  {record.exerciseName}
                </Text>
              </View>
              <View style={styles.recordDetails}>
                <View style={styles.recordDetail}>
                  <Text style={[styles.recordDetailLabel, { color: colors.textSecondary }]}>
                    Weight
                  </Text>
                  <Text style={[styles.recordDetailValue, { color: colors.primary }]}>
                    {record.weight} kg
                  </Text>
                </View>
                <View style={styles.recordDetail}>
                  <Text style={[styles.recordDetailLabel, { color: colors.textSecondary }]}>
                    Reps
                  </Text>
                  <Text style={[styles.recordDetailValue, { color: colors.primary }]}>
                    {record.reps}
                  </Text>
                </View>
                <View style={styles.recordDetail}>
                  <Text style={[styles.recordDetailLabel, { color: colors.textSecondary }]}>
                    Est. 1RM
                  </Text>
                  <Text style={[styles.recordDetailValue, { color: colors.accent }]}>
                    {record.oneRepMax?.toFixed(1)} kg
                  </Text>
                </View>
              </View>
              <Text style={[styles.recordDate, { color: colors.textTertiary }]}>
                {new Date(record.date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </Card>
          ))}
        </>
      )}

      {/* Exercise Progress */}
      {strengthProgress.length > 0 && (
        <>
          <Text style={[styles.subTitle, { color: colors.text }]}>Exercise Progress</Text>
          {strengthProgress.slice(0, 10).map((exercise) => {
            const first = exercise.history[0].maxWeight;
            const last = exercise.history[exercise.history.length - 1].maxWeight;
            const change = last - first;
            const changePercent = first > 0 ? ((change / first) * 100).toFixed(1) : '0';

            return (
              <Card key={exercise.name} style={styles.strengthCard}>
                <View style={styles.strengthHeader}>
                  <Text style={[styles.strengthName, { color: colors.text }]}>
                    {exercise.name}
                  </Text>
                  <View style={styles.strengthChange}>
                    <Ionicons
                      name={change >= 0 ? 'trending-up' : 'trending-down'}
                      size={16}
                      color={change >= 0 ? colors.success : colors.error}
                    />
                    <Text
                      style={{
                        color: change >= 0 ? colors.success : colors.error,
                        fontWeight: FONT_WEIGHT.semibold,
                        fontSize: FONT_SIZE.sm,
                      }}
                    >
                      {change >= 0 ? '+' : ''}{change.toFixed(1)} kg ({changePercent}%)
                    </Text>
                  </View>
                </View>
                <View style={styles.strengthDetails}>
                  <Text style={[styles.strengthDetail, { color: colors.textSecondary }]}>
                    Started: {first} kg
                  </Text>
                  <Text style={[styles.strengthDetail, { color: colors.text }]}>
                    Current: {last} kg
                  </Text>
                </View>
                <ProgressBar
                  progress={Math.min(last / (first * 1.5), 1)}
                  color={change >= 0 ? colors.success : colors.primary}
                  style={{ marginTop: SPACING.sm }}
                />
              </Card>
            );
          })}
        </>
      )}

      {personalRecords.length === 0 && strengthProgress.length === 0 && (
        <EmptyState
          icon="trending-up-outline"
          title="No Strength Data"
          message="Complete workouts to track your strength progress and personal records."
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Progress</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[
                  styles.tab,
                  {
                    backgroundColor: activeTab === tab.key ? colors.primary : colors.surface,
                    borderColor: activeTab === tab.key ? colors.primary : colors.border,
                  },
                ]}
              >
                <Ionicons
                  name={tab.icon}
                  size={16}
                  color={activeTab === tab.key ? '#FFF' : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.tabText,
                    { color: activeTab === tab.key ? '#FFF' : colors.textSecondary },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'weight' && renderWeightTab()}
          {activeTab === 'measurements' && renderMeasurementsTab()}
          {activeTab === 'photos' && renderPhotosTab()}
          {activeTab === 'strength' && renderStrengthTab()}
        </View>

        <View style={{ height: SPACING.huge }} />
      </ScrollView>

      {/* Add Weight Modal */}
      <Modal visible={showAddWeight} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Log Body Weight</Text>
              <TouchableOpacity onPress={() => setShowAddWeight(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Input
              label="Weight (kg)"
              placeholder="Enter your weight"
              value={newWeight}
              onChangeText={setNewWeight}
              keyboardType="decimal-pad"
              leftIcon="scale-outline"
            />
            <Button title="Save" onPress={handleAddWeight} fullWidth size="lg" />
          </View>
        </View>
      </Modal>

      {/* Add Measurement Modal */}
      <Modal visible={showAddMeasurement} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Measurements</Text>
              <TouchableOpacity onPress={() => setShowAddMeasurement(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Input label="Chest (cm)" placeholder="Optional" value={newChest} onChangeText={setNewChest} keyboardType="decimal-pad" />
            <Input label="Arms (cm)" placeholder="Optional" value={newArms} onChangeText={setNewArms} keyboardType="decimal-pad" />
            <Input label="Waist (cm)" placeholder="Optional" value={newWaist} onChangeText={setNewWaist} keyboardType="decimal-pad" />
            <Input label="Legs (cm)" placeholder="Optional" value={newLegs} onChangeText={setNewLegs} keyboardType="decimal-pad" />
            <Button title="Save" onPress={handleAddMeasurement} fullWidth size="lg" />
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
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE.display,
    fontWeight: FONT_WEIGHT.heavy,
  },
  tabsContainer: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    marginRight: SPACING.sm,
    gap: SPACING.xs,
  },
  tabText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
  },
  tabContent: {
    paddingHorizontal: SPACING.xl,
  },
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  tabTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
  },
  currentCard: {
    marginBottom: SPACING.lg,
  },
  currentWeight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  currentValue: {
    fontSize: FONT_SIZE.hero,
    fontWeight: FONT_WEIGHT.heavy,
  },
  currentDate: {
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  weightChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  changeValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
  },
  chartCard: {
    marginBottom: SPACING.lg,
  },
  chartTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING.md,
  },
  chart: {
    flexDirection: 'row',
    height: 160,
  },
  chartLabels: {
    justifyContent: 'space-between',
    paddingRight: SPACING.sm,
    width: 36,
  },
  chartLabel: {
    fontSize: FONT_SIZE.xs,
    textAlign: 'right',
  },
  chartBars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  chartBarContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  chartBar: {
    width: '70%',
    borderRadius: 3,
    minHeight: 4,
  },
  chartBarLabel: {
    fontSize: 8,
    marginTop: 2,
  },
  historyTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING.md,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  historyWeight: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
  },
  historyDate: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  // Measurements
  measurementCard: {
    marginBottom: SPACING.lg,
  },
  measurementTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING.lg,
  },
  measurementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  measurementItem: {
    width: '45%',
    marginBottom: SPACING.sm,
  },
  measurementDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: SPACING.xs,
  },
  measurementLabel: {
    fontSize: FONT_SIZE.sm,
  },
  measurementValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    marginTop: 2,
  },
  measurementDate: {
    fontSize: FONT_SIZE.xs,
    marginTop: SPACING.md,
  },
  historyMeasureCard: {
    marginBottom: SPACING.sm,
  },
  historyMeasureDate: {
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.sm,
  },
  historyMeasureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  historyMeasureItem: {
    fontSize: FONT_SIZE.sm,
  },
  // Photos
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  photoItem: {
    width: (width - SPACING.xl * 2 - SPACING.sm * 2) / 3,
  },
  photoImage: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: BORDER_RADIUS.md,
  },
  photoDate: {
    fontSize: FONT_SIZE.xs,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  // Strength
  subTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  recordCard: {
    marginBottom: SPACING.md,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  recordName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    flex: 1,
  },
  recordDetails: {
    flexDirection: 'row',
    gap: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  recordDetail: {},
  recordDetailLabel: {
    fontSize: FONT_SIZE.xs,
    marginBottom: 2,
  },
  recordDetailValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
  },
  recordDate: {
    fontSize: FONT_SIZE.xs,
    marginTop: SPACING.sm,
  },
  strengthCard: {
    marginBottom: SPACING.md,
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  strengthName: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    flex: 1,
  },
  strengthChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  strengthDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  strengthDetail: {
    fontSize: FONT_SIZE.sm,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.xxl,
    paddingBottom: SPACING.huge,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  modalTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
  },
});
