# GymTrack Pro

A modern, cross-platform gym tracking mobile application built with React Native (Expo) and TypeScript. Track workouts, exercises, progress, body metrics, personal records, and more with a clean, minimal UI supporting dark and light modes.

## Features

### Authentication
- Email/password sign in & sign up
- Google OAuth login (via Supabase)
- Apple OAuth login (via Supabase)
- Password reset via email
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
| Local Storage | AsyncStorage + expo-secure-store |
| Backend | **Supabase** (Auth, PostgreSQL, Storage) |
| Notifications | Expo Notifications |
| Image Picker | Expo Image Picker |
| Icons | @expo/vector-icons (Ionicons) |

## Project Structure

```
GymTrackPro/
├── App.tsx                          # App entry point
├── app.json                         # Expo configuration
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript configuration
├── supabase-schema.sql              # Database schema + RLS policies
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
    │   ├── AppContext.tsx            # Global app state (Supabase + AsyncStorage)
    │   └── ThemeContext.tsx          # Dark/light theme management
    ├── hooks/
    │   └── useWorkoutAnalytics.ts   # Workout analytics hook
    ├── navigation/
    │   └── AppNavigator.tsx         # Navigation structure
    ├── screens/
    │   ├── Auth/
    │   │   ├── LoginScreen.tsx      # Sign in + Google/Apple OAuth
    │   │   ├── SignUpScreen.tsx      # Registration screen
    │   │   └── OnboardingScreen.tsx  # New user onboarding
    │   ├── Dashboard/
    │   │   └── DashboardScreen.tsx   # Main dashboard with analytics
    │   ├── Workouts/
    │   │   ├── WorkoutsScreen.tsx    # Workout list & templates
    │   │   └── ActiveWorkoutScreen.tsx # Active workout tracking
    │   ├── Progress/
    │   │   └── ProgressScreen.tsx    # Progress tracking
    │   └── Profile/
    │       └── ProfileScreen.tsx     # User profile, goals, settings
    ├── services/
    │   ├── supabase.ts              # Supabase client, Auth, DB & Storage services
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
- A Supabase project ([supabase.com](https://supabase.com))

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

## Supabase Setup

### 1. Create Project

Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a new project.

### 2. Run Database Schema

Open the **SQL Editor** in your Supabase dashboard and paste the contents of `supabase-schema.sql`. This creates all tables, indexes, RLS policies, and the auto-profile trigger.

### 3. Add Your Credentials

Open `src/services/supabase.ts` and replace the placeholder values:

```typescript
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

Find these in **Settings > API** in your Supabase dashboard.

### 4. Enable Auth Providers

In **Authentication > Providers**:

- **Email**: Enabled by default
- **Google**: Enable and add your Google OAuth client ID & secret
- **Apple**: Enable and configure (iOS only)

### 5. Set up Storage

In **Storage**, create a bucket named `progress-photos` and set it to **public**. Then add RLS policies as described in `supabase-schema.sql`.

### 6. Configure OAuth Redirect

In **Authentication > URL Configuration**, add `gymtrackpro://auth/callback` to **Redirect URLs**.

## Architecture

### Offline-First with Supabase Sync

- **AsyncStorage** is the local cache -- loaded first for instant UI
- **Supabase** syncs in the background on login
- Every write goes to local cache first, then Supabase (graceful offline fallback)
- Auth state is driven by `supabase.auth.onAuthStateChange`
- Auth tokens are stored encrypted using `expo-secure-store` + AES

### Database Structure (PostgreSQL)

| Table | Description |
|-------|-------------|
| `profiles` | User profile (auto-created on sign-up via trigger) |
| `workouts` | Workout sessions with exercises stored as JSONB |
| `body_weights` | Body weight log entries |
| `measurements` | Body measurements (chest, arms, waist, legs) |
| `personal_records` | Exercise personal records with estimated 1RM |
| `goals` | Fitness goals |
| `workout_templates` | Saved workout templates |
| `custom_exercises` | User-created exercises |

All tables have **Row Level Security** (RLS) so users can only access their own data.

## Future Roadmap

- AI workout recommendations
- Wearable device integration (Apple Watch, Garmin)
- Community challenges
- Trainer-client mode
- Social features
- Exercise video demonstrations

## Target Audience

- Fitness enthusiasts
- Gym beginners
- Personal trainers

## License

This project is proprietary. All rights reserved.
