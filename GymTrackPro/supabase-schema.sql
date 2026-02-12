-- ==========================================
-- GymTrack Pro - Supabase Database Schema
-- ==========================================
-- Run this in Supabase SQL Editor:
--   https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. Profiles (extends Supabase auth.users)
-- ==========================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  photo_url TEXT,
  age INTEGER,
  height REAL,           -- cm
  weight REAL,           -- kg
  goal TEXT DEFAULT 'muscle_gain',
  experience_level TEXT DEFAULT 'beginner',
  units TEXT DEFAULT 'metric',
  subscription TEXT DEFAULT 'free',
  has_onboarded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 2. Workouts
-- ==========================================
CREATE TABLE IF NOT EXISTS workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  duration INTEGER,              -- seconds
  exercises JSONB DEFAULT '[]',  -- array of WorkoutExercise objects
  notes TEXT,
  calories_estimate INTEGER,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(date DESC);

-- ==========================================
-- 3. Body Weights
-- ==========================================
CREATE TABLE IF NOT EXISTS body_weights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight REAL NOT NULL,          -- kg
  date TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_body_weights_user_id ON body_weights(user_id);

-- ==========================================
-- 4. Measurements
-- ==========================================
CREATE TABLE IF NOT EXISTS measurements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TIMESTAMPTZ DEFAULT NOW(),
  chest REAL,
  arms REAL,
  waist REAL,
  legs REAL,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_measurements_user_id ON measurements(user_id);

-- ==========================================
-- 5. Personal Records
-- ==========================================
CREATE TABLE IF NOT EXISTS personal_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  exercise_name TEXT NOT NULL,
  weight REAL NOT NULL,
  reps INTEGER NOT NULL,
  date DATE NOT NULL,
  one_rep_max REAL
);

CREATE INDEX IF NOT EXISTS idx_personal_records_user_id ON personal_records(user_id);

-- ==========================================
-- 6. Goals
-- ==========================================
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_value REAL,
  current_value REAL,
  unit TEXT,
  deadline DATE,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);

-- ==========================================
-- 7. Workout Templates
-- ==========================================
CREATE TABLE IF NOT EXISTS workout_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  exercises JSONB DEFAULT '[]',  -- array of WorkoutTemplateExercise
  times_used INTEGER DEFAULT 0,
  last_used TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workout_templates_user_id ON workout_templates(user_id);

-- ==========================================
-- 8. Custom Exercises
-- ==========================================
CREATE TABLE IF NOT EXISTS custom_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT
);

CREATE INDEX IF NOT EXISTS idx_custom_exercises_user_id ON custom_exercises(user_id);

-- ==========================================
-- Row Level Security (RLS)
-- Each user can only access their own data
-- ==========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_exercises ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Generic policy for all user-owned tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['workouts', 'body_weights', 'measurements',
    'personal_records', 'goals', 'workout_templates', 'custom_exercises']
  LOOP
    EXECUTE format('CREATE POLICY "Users can view own %1$s" ON %1$s FOR SELECT USING (auth.uid() = user_id)', tbl);
    EXECUTE format('CREATE POLICY "Users can insert own %1$s" ON %1$s FOR INSERT WITH CHECK (auth.uid() = user_id)', tbl);
    EXECUTE format('CREATE POLICY "Users can update own %1$s" ON %1$s FOR UPDATE USING (auth.uid() = user_id)', tbl);
    EXECUTE format('CREATE POLICY "Users can delete own %1$s" ON %1$s FOR DELETE USING (auth.uid() = user_id)', tbl);
  END LOOP;
END;
$$;

-- ==========================================
-- Storage: create bucket for progress photos
-- ==========================================
-- Run this via the Supabase Dashboard > Storage > New Bucket:
--   Bucket name: progress-photos
--   Public: true (so getPublicUrl works)
--
-- Then add an RLS policy on the bucket:
--   SELECT: (bucket_id = 'progress-photos') AND (auth.uid()::text = (storage.foldername(name))[1])
--   INSERT: (bucket_id = 'progress-photos') AND (auth.uid()::text = (storage.foldername(name))[1])
--   DELETE: (bucket_id = 'progress-photos') AND (auth.uid()::text = (storage.foldername(name))[1])
