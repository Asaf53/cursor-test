# GymTrack Pro

A modern, cross-platform gym tracking mobile application built with React Native (Expo) and TypeScript. Track workouts, exercises, progress, body metrics, personal records, and more with a clean, minimal UI supporting dark and light modes.

## Features

### Authentication
- Email/password sign in & sign up
- Google login (Firebase integration ready)
- Apple login (Firebase integration ready)
- Onboarding flow for new users

### Workout Tracking
- Create and track workouts in real-time
- Add exercises from a library of 60+ exercises across all muscle groups
- Track sets, reps, and weight for each exercise
- Built-in rest timer with customizable duration
- Add notes per workout
- Save workout templates for quick reuse
- View complete workout history

### Progress Tracking
- **Body Weight**: Log and visualize weight over time with bar charts
- **Body Measurements**: Track chest, arms, waist, and legs
- **Progress Photos**: Upload and organize transformation photos
- **Strength Progress**: View exercise-specific strength trends and personal records
- **Estimated 1RM**: Automatic one-rep max calculation (Epley formula)

### Analytics Dashboard
- Weekly and monthly workout summaries
- Muscle group breakdown visualization
- Workout streak tracking
- Calories estimation
- Personal records display
- Weekly goal progress bar

### Goals
- Set fitness goals (weight loss, muscle gain, maintenance, custom)
- Track goal progress
- Goal completion alerts

### User Profile
- Editable profile (name, age, height, weight, goal, experience level)
- Stats overview (total workouts, time, volume, PRs)
- Body stats display
- App settings (dark mode, notifications)

### Notifications
- Customizable workout reminders (time and days of week)
- Goal progress alerts
- Personal record celebrations

### Subscription / Monetization
- Free plan with core features
- Premium monthly & yearly subscriptions
- Premium features: advanced analytics, unlimited workouts, custom workout plans

### Design
- Modern, minimal UI
- Dark mode and light mode support
- Bottom tab navigation (Dashboard, Workouts, Progress, Profile)
- Color theme: Primary (#1E90FF), Secondary (#111111), Accent (#FF6B00)
- Responsive layout for iOS and Android

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native (Expo SDK 54) |
| Language | TypeScript |
| Navigation | React Navigation (bottom tabs + native stack) |
| State Management | React Context API |
| Local Storage | AsyncStorage |
| Notifications | Expo Notifications |
| Image Picker | Expo Image Picker |
| Icons | @expo/vector-icons (Ionicons) |
| Backend (ready) | Firebase (Auth, Firestore, Storage, Analytics) |

## Project Structure

```
GymTrackPro/
├── App.tsx                          # App entry point
├── app.json                         # Expo configuration
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript configuration
├── assets/                          # App icons and splash screens
└── src/
    ├── components/                  # Reusable UI components
    │   ├── Button.tsx               # Multi-variant button
    │   ├── Card.tsx                 # Card container
    │   ├── EmptyState.tsx           # Empty state placeholder
    │   ├── Header.tsx               # Screen header
    │   ├── Input.tsx                # Text input with validation
    │   ├── ProgressBar.tsx          # Animated progress bar
    │   └── StatCard.tsx             # Statistics display card
    ├── constants/
    │   ├── exercises.ts             # Exercise library (60+ exercises)
    │   └── theme.ts                 # Theme colors, spacing, typography
    ├── contexts/
    │   ├── AppContext.tsx            # Global app state & data management
    │   └── ThemeContext.tsx          # Dark/light theme management
    ├── hooks/                       # Custom React hooks
    ├── navigation/
    │   └── AppNavigator.tsx         # Navigation structure
    ├── screens/
    │   ├── Auth/
    │   │   ├── LoginScreen.tsx      # Sign in screen
    │   │   ├── SignUpScreen.tsx      # Registration screen
    │   │   └── OnboardingScreen.tsx  # New user onboarding
    │   ├── Dashboard/
    │   │   └── DashboardScreen.tsx   # Main dashboard with analytics
    │   ├── Workouts/
    │   │   ├── WorkoutsScreen.tsx    # Workout list & templates
    │   │   └── ActiveWorkoutScreen.tsx # Active workout tracking
    │   ├── Progress/
    │   │   └── ProgressScreen.tsx    # Progress tracking (weight, measurements, photos, strength)
    │   └── Profile/
    │       └── ProfileScreen.tsx     # User profile, goals, settings
    ├── services/
    │   ├── firebase.ts              # Firebase configuration template
    │   └── notifications.ts         # Notification service
    ├── types/
    │   └── index.ts                 # TypeScript type definitions
    └── utils/
        └── helpers.ts               # Utility functions
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your phone (for testing)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd GymTrackPro

# Install dependencies
npm install

# Start the development server
npx expo start
```

### Running on Devices

```bash
# iOS Simulator (macOS only)
npx expo run:ios

# Android Emulator
npx expo run:android

# Scan QR code with Expo Go app
npx expo start
```

## Firebase Integration

To enable full backend functionality:

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication providers (Email/Password, Google, Apple)
3. Create a Firestore database
4. Set up Firebase Storage
5. Enable Firebase Analytics
6. Install Firebase packages:

```bash
npx expo install @react-native-firebase/app @react-native-firebase/auth
npx expo install @react-native-firebase/firestore @react-native-firebase/storage
npx expo install @react-native-firebase/analytics
```

7. Update `src/services/firebase.ts` with your Firebase config
8. Add `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)

## Future Roadmap

- AI workout recommendations
- Wearable device integration (Apple Watch, Garmin)
- Community challenges
- Trainer-client mode
- Social features
- Exercise video demonstrations
- Advanced charts and reporting

## Target Audience

- Fitness enthusiasts
- Gym beginners
- Personal trainers

## License

This project is proprietary. All rights reserved.
