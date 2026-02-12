// ==========================================
// GymTrack Pro - Notification Service
// ==========================================

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { NotificationSettings } from '../types';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return false;
    }

    // Configure Android channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('workout-reminders', {
        name: 'Workout Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1E90FF',
      });

      await Notifications.setNotificationChannelAsync('goal-alerts', {
        name: 'Goal Alerts',
        importance: Notifications.AndroidImportance.DEFAULT,
      });

      await Notifications.setNotificationChannelAsync('personal-records', {
        name: 'Personal Records',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 500],
        lightColor: '#FF6B00',
      });
    }

    return true;
  } catch (error) {
    console.log('Notification permission error:', error);
    return false;
  }
};

/**
 * Schedule workout reminder notifications
 */
export const scheduleWorkoutReminders = async (
  settings: NotificationSettings
): Promise<void> => {
  try {
    // Cancel existing scheduled notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (!settings.workoutReminders) return;

    const [hours, minutes] = settings.reminderTime.split(':').map(Number);

    const messages = [
      "Time to hit the gym! Your muscles are waiting.",
      "Don't skip today! Every workout counts.",
      "Ready to crush it? Your workout awaits!",
      "Consistency is key. Let's get moving!",
      "Your future self will thank you. Time to train!",
    ];

    // Schedule for each reminder day
    for (const day of settings.reminderDays) {
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Workout Reminder',
          body: randomMessage,
          data: { type: 'workout_reminder' },
          ...(Platform.OS === 'android' && { channelId: 'workout-reminders' }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: day + 1, // Expo uses 1-7 (Sun-Sat)
          hour: hours,
          minute: minutes,
        },
      });
    }
  } catch (error) {
    console.log('Schedule notification error:', error);
  }
};

/**
 * Send a personal record notification
 */
export const sendPersonalRecordNotification = async (
  exerciseName: string,
  weight: number,
  reps: number
): Promise<void> => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'New Personal Record!',
        body: `You hit a new PR on ${exerciseName}: ${weight}kg x ${reps} reps!`,
        data: { type: 'personal_record' },
        ...(Platform.OS === 'android' && { channelId: 'personal-records' }),
      },
      trigger: null, // Send immediately
    });
  } catch (error) {
    console.log('PR notification error:', error);
  }
};

/**
 * Send a goal progress notification
 */
export const sendGoalProgressNotification = async (
  goalTitle: string,
  progress: number
): Promise<void> => {
  try {
    let body: string;
    if (progress >= 1) {
      body = `Congratulations! You've achieved your goal: "${goalTitle}"!`;
    } else if (progress >= 0.75) {
      body = `Almost there! You're ${Math.round(progress * 100)}% towards "${goalTitle}"!`;
    } else if (progress >= 0.5) {
      body = `Great progress! You're halfway to "${goalTitle}"!`;
    } else {
      body = `Keep going! You're ${Math.round(progress * 100)}% towards "${goalTitle}"!`;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: progress >= 1 ? 'Goal Achieved!' : 'Goal Progress',
        body,
        data: { type: 'goal_progress' },
        ...(Platform.OS === 'android' && { channelId: 'goal-alerts' }),
      },
      trigger: null,
    });
  } catch (error) {
    console.log('Goal notification error:', error);
  }
};

/**
 * Register for push notifications
 */
export const registerForPushNotifications = async (): Promise<string | null> => {
  try {
    const permission = await requestNotificationPermissions();
    if (!permission) return null;

    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch (error) {
    console.log('Push notification registration error:', error);
    return null;
  }
};
