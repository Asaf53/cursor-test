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
| Backend | Firebase (Auth, Firestore, Storage) - **integrated** |

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
    │   ├── firebase.ts              # Firebase init, Auth, Firestore & Storage services
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

Firebase is fully integrated using the Firebase JS SDK (v11+). The project is connected to the
`gymtrackpro-dc0a4` Firebase project.

### What's Configured

- **Authentication** -- Email/password, Google Sign-In (credential-based), Apple Sign-In (credential-based)
- **Firestore** -- All user data (workouts, body weights, measurements, goals, templates, personal records, custom exercises, notification settings) synced per-user under `users/{uid}/...`
- **Firebase Storage** -- Progress photos uploaded to `users/{uid}/progress-photos/`
- **Offline-first** -- AsyncStorage is used as a local cache; Firestore syncs in the background. The app works fully offline.

### Enabling Google & Apple Sign-In on Device

Google and Apple sign-in require native modules that don't run in Expo Go. To enable them:

1. Build with EAS: `eas build --platform ios`
2. For Google Sign-In, install `expo-auth-session` or `@react-native-google-signin/google-signin`
3. For Apple Sign-In, install `expo-apple-authentication`
4. See `LoginScreen.tsx` for integration guidance comments

### Adding Android Support

1. Register an Android app in the Firebase console with package name `gymtrackpro`
2. Download `google-services.json` and place it in the project root
3. Add to `app.json`:
   ```json
   "android": { "googleServicesFile": "./google-services.json" }
   ```

### Files

| File | Purpose |
|------|---------|
| `GoogleService-Info.plist` | iOS Firebase config |
| `src/services/firebase.ts` | Firebase init + Auth, Firestore, Storage services |
| `src/contexts/AppContext.tsx` | Data layer with Firebase + AsyncStorage |

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
