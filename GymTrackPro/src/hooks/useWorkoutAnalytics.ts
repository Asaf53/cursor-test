// ==========================================
// GymTrack Pro - Workout Analytics Hook
// ==========================================

import { useMemo } from 'react';
import { Workout, MuscleGroup, WeeklySummary, MonthlySummary } from '../types';

export const useWorkoutAnalytics = (workouts: Workout[]) => {
  const completedWorkouts = useMemo(
    () => workouts.filter(w => w.isCompleted),
    [workouts]
  );

  const weeklySummary = useMemo((): WeeklySummary => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const weekWorkouts = completedWorkouts.filter(
      w => new Date(w.date) >= weekStart && new Date(w.date) <= weekEnd
    );

    const totalDuration = weekWorkouts.reduce((acc, w) => acc + (w.duration || 0), 0);
    const totalSets = weekWorkouts.reduce(
      (acc, w) => acc + w.exercises.reduce((eAcc, ex) => eAcc + ex.sets.filter(s => s.isCompleted).length, 0),
      0
    );
    const totalReps = weekWorkouts.reduce(
      (acc, w) => acc + w.exercises.reduce(
        (eAcc, ex) => eAcc + ex.sets.filter(s => s.isCompleted).reduce((sAcc, s) => sAcc + (s.reps || 0), 0),
        0
      ),
      0
    );
    const totalVolume = weekWorkouts.reduce(
      (acc, w) => acc + w.exercises.reduce(
        (eAcc, ex) => eAcc + ex.sets.filter(s => s.isCompleted).reduce(
          (sAcc, s) => sAcc + (s.weight || 0) * (s.reps || 0),
          0
        ),
        0
      ),
      0
    );
    const caloriesBurned = weekWorkouts.reduce((acc, w) => acc + (w.caloriesEstimate || 0), 0);

    const muscleGroupBreakdown: Record<MuscleGroup, number> = {} as Record<MuscleGroup, number>;
    weekWorkouts.forEach(w => {
      w.exercises.forEach(ex => {
        muscleGroupBreakdown[ex.muscleGroup] = (muscleGroupBreakdown[ex.muscleGroup] || 0) + 1;
      });
    });

    return {
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      totalWorkouts: weekWorkouts.length,
      totalDuration,
      totalVolume,
      totalSets,
      totalReps,
      caloriesBurned,
      muscleGroupBreakdown,
    };
  }, [completedWorkouts]);

  const monthlySummary = useMemo((): MonthlySummary => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthWorkouts = completedWorkouts.filter(
      w => new Date(w.date) >= monthStart && new Date(w.date) <= monthEnd
    );

    const totalDuration = monthWorkouts.reduce((acc, w) => acc + (w.duration || 0), 0);
    const totalVolume = monthWorkouts.reduce(
      (acc, w) => acc + w.exercises.reduce(
        (eAcc, ex) => eAcc + ex.sets.reduce(
          (sAcc, s) => sAcc + (s.weight || 0) * (s.reps || 0),
          0
        ),
        0
      ),
      0
    );

    const daysInMonth = monthEnd.getDate();
    const workoutDays = new Set(monthWorkouts.map(w => w.date)).size;
    const consistencyPercentage = Math.round((workoutDays / daysInMonth) * 100);

    return {
      month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      totalWorkouts: monthWorkouts.length,
      totalDuration,
      totalVolume,
      personalRecords: 0, // Calculated separately
      averageWorkoutDuration: monthWorkouts.length > 0
        ? Math.round(totalDuration / monthWorkouts.length)
        : 0,
      consistencyPercentage,
    };
  }, [completedWorkouts]);

  const streak = useMemo(() => {
    const completedDates = new Set(completedWorkouts.map(w => w.date));
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];

      if (completedDates.has(dateStr)) {
        currentStreak++;
      } else if (i > 0) {
        break;
      }
    }

    return currentStreak;
  }, [completedWorkouts]);

  const totalStats = useMemo(() => ({
    totalWorkouts: completedWorkouts.length,
    totalDuration: completedWorkouts.reduce((acc, w) => acc + (w.duration || 0), 0),
    totalVolume: completedWorkouts.reduce(
      (acc, w) => acc + w.exercises.reduce(
        (eAcc, ex) => eAcc + ex.sets.reduce(
          (sAcc, s) => sAcc + (s.weight || 0) * (s.reps || 0),
          0
        ),
        0
      ),
      0
    ),
    totalCalories: completedWorkouts.reduce((acc, w) => acc + (w.caloriesEstimate || 0), 0),
  }), [completedWorkouts]);

  return {
    completedWorkouts,
    weeklySummary,
    monthlySummary,
    streak,
    totalStats,
  };
};
