-- This file contains all migrations in order
-- It is used for initial database setup and testing

-- Migration: 20240409_initial_schema.sql
-- Description: Initial database schema with workouts, exercises, and sets tables

-- Drop existing tables if they exist
DROP TABLE IF EXISTS sets CASCADE;
DROP TABLE IF EXISTS exercises CASCADE;
DROP TABLE IF EXISTS workouts CASCADE;
DROP TABLE IF EXISTS user_stats CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS user_inventory CASCADE;

-- Create the workouts table with statistics columns
CREATE TABLE IF NOT EXISTS workouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    notes TEXT,
    duration INTEGER,
    total_sets INTEGER DEFAULT 0,
    total_exercises INTEGER DEFAULT 0,
    total_volume DECIMAL DEFAULT 0,
    set_ids UUID[] DEFAULT '{}'::UUID[]
);

-- Create the exercises table with statistics columns
CREATE TABLE IF NOT EXISTS exercises (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('standard', 'bodyweight', 'timed')),
    total_sets INTEGER DEFAULT 0,
    total_volume DECIMAL DEFAULT 0,
    total_duration INTEGER DEFAULT 0,
    set_ids UUID[] DEFAULT '{}'::UUID[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create the sets table with completed column
CREATE TABLE IF NOT EXISTS sets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    reps INTEGER,
    weight DECIMAL,
    duration INTEGER,
    distance DECIMAL,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create the user stats table
CREATE TABLE user_stats (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    gold INTEGER DEFAULT 0,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    -- Muscle group XP tracking
    chest_xp INTEGER DEFAULT 0,
    back_xp INTEGER DEFAULT 0,
    legs_xp INTEGER DEFAULT 0,
    shoulders_xp INTEGER DEFAULT 0,
    arms_xp INTEGER DEFAULT 0,
    core_xp INTEGER DEFAULT 0,
    cardio_xp INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create enum for slot types
CREATE TYPE item_slot_type AS ENUM ('head', 'chest', 'legs', 'feet', 'accessory', 'aura');

-- Create enum for muscle groups
CREATE TYPE muscle_group AS ENUM ('chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio', 'all');

-- Create enum for rarity types
CREATE TYPE item_rarity AS ENUM ('common', 'uncommon', 'rare', 'epic', 'legendary');

-- Create items table
CREATE TABLE items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slot_type item_slot_type NOT NULL,
    rarity item_rarity NOT NULL,
    effect TEXT NOT NULL,
    xp_bonus JSONB NOT NULL, -- Format: {"muscle_group": "chest", "bonus": 10} or {"muscle_group": "all", "bonus": 5}
    gold_bonus JSONB NOT NULL,
    luck_bonus INTEGER NOT NULL DEFAULT 0,
    power_bonus JSONB NOT NULL,
    image_path TEXT NOT NULL,
    price INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Add RLS policies
-- Create user_roles table
CREATE TABLE user_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_inventory table
CREATE TABLE user_inventory (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    is_equipped BOOLEAN DEFAULT false,
    acquired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, item_id)
);

-- Grant necessary permissions
GRANT ALL ON workouts TO authenticated;
GRANT ALL ON exercises TO authenticated;
GRANT ALL ON sets TO authenticated;
GRANT ALL ON user_stats TO authenticated;
GRANT ALL ON items TO authenticated;
GRANT ALL ON user_roles TO authenticated;
GRANT ALL ON user_inventory TO authenticated;

-- Enable Row Level Security
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own workouts" ON workouts;
DROP POLICY IF EXISTS "Users can insert their own workouts" ON workouts;
DROP POLICY IF EXISTS "Users can update their own workouts" ON workouts;
DROP POLICY IF EXISTS "Users can delete their own workouts" ON workouts;

DROP POLICY IF EXISTS "Users can view their own exercises" ON exercises;
DROP POLICY IF EXISTS "Users can insert their own exercises" ON exercises;
DROP POLICY IF EXISTS "Users can update their own exercises" ON exercises;
DROP POLICY IF EXISTS "Users can delete their own exercises" ON exercises;

DROP POLICY IF EXISTS "Users can view their own sets" ON sets;
DROP POLICY IF EXISTS "Users can insert their own sets" ON sets;
DROP POLICY IF EXISTS "Users can update their own sets" ON sets;
DROP POLICY IF EXISTS "Users can delete their own sets" ON sets;

DROP POLICY IF EXISTS "Allow authenticated users to read items" ON items;
DROP POLICY IF EXISTS "Allow only admins to modify items" ON items;

-- Create policies for workouts
CREATE POLICY IF NOT EXISTS "Users can view their own workouts"
    ON workouts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own workouts"
    ON workouts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own workouts"
    ON workouts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own workouts"
    ON workouts FOR DELETE
    USING (auth.uid() = user_id);

-- Create policies for exercises
CREATE POLICY IF NOT EXISTS "Users can view their own exercises"
    ON exercises FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM workouts
        WHERE workouts.id = exercises.workout_id
        AND workouts.user_id = auth.uid()
    ));

CREATE POLICY IF NOT EXISTS "Users can insert their own exercises"
    ON exercises FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM workouts
        WHERE workouts.id = exercises.workout_id
        AND workouts.user_id = auth.uid()
    ));

CREATE POLICY IF NOT EXISTS "Users can update their own exercises"
    ON exercises FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM workouts
        WHERE workouts.id = exercises.workout_id
        AND workouts.user_id = auth.uid()
    ));

CREATE POLICY IF NOT EXISTS "Users can delete their own exercises"
    ON exercises FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM workouts
        WHERE workouts.id = exercises.workout_id
        AND workouts.user_id = auth.uid()
    ));

-- Create policies for sets
CREATE POLICY IF NOT EXISTS "Users can view their own sets"
    ON sets FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM exercises
        JOIN workouts ON workouts.id = exercises.workout_id
        WHERE exercises.id = sets.exercise_id
        AND workouts.user_id = auth.uid()
    ));

CREATE POLICY IF NOT EXISTS "Users can insert their own sets"
    ON sets FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM exercises
        JOIN workouts ON workouts.id = exercises.workout_id
        WHERE exercises.id = sets.exercise_id
        AND workouts.user_id = auth.uid()
    ));

CREATE POLICY IF NOT EXISTS "Users can update their own sets"
    ON sets FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM exercises
        JOIN workouts ON workouts.id = exercises.workout_id
        WHERE exercises.id = sets.exercise_id
        AND workouts.user_id = auth.uid()
    ));

CREATE POLICY IF NOT EXISTS "Users can delete their own sets"
    ON sets FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM exercises
        JOIN workouts ON workouts.id = exercises.workout_id
        WHERE exercises.id = sets.exercise_id
        AND workouts.user_id = auth.uid()
    ));

-- Enable Row Level Security for user_stats table
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can insert their own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can update their own stats" ON user_stats;

-- Create policies for user_stats
CREATE POLICY IF NOT EXISTS "Users can view their own stats"
    ON user_stats FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own stats"
    ON user_stats FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own stats"
    ON user_stats FOR UPDATE
    USING (auth.uid() = user_id);

-- Create function to update exercise statistics
CREATE OR REPLACE FUNCTION update_exercise_stats()
RETURNS TRIGGER AS $$
DECLARE
    v_workout_id UUID;
BEGIN
    -- Get the workout_id for the exercise
    SELECT e.workout_id INTO v_workout_id
    FROM exercises e
    WHERE e.id = NEW.exercise_id;

    -- Update the exercise's statistics based on its sets
    UPDATE exercises ex
    SET 
        total_sets = (
            SELECT COUNT(*) 
            FROM sets s
            WHERE s.exercise_id = ex.id
        ),
        total_volume = (
            SELECT COALESCE(SUM(
                CASE 
                    WHEN ex.type = 'standard' THEN s.reps * s.weight
                    WHEN ex.type = 'bodyweight' THEN s.reps
                    WHEN ex.type = 'timed' THEN s.duration
                    ELSE 0
                END
            ), 0)
            FROM sets s
            WHERE s.exercise_id = ex.id
        ),
        total_duration = (
            SELECT COALESCE(SUM(s.duration), 0)
            FROM sets s
            WHERE s.exercise_id = ex.id
        ),
        set_ids = (
            SELECT ARRAY_AGG(s.id)
            FROM sets s
            WHERE s.exercise_id = ex.id
        )
    WHERE ex.id = NEW.exercise_id;

    -- Update the workout's statistics
    UPDATE workouts w
    SET 
        total_sets = (
            SELECT COUNT(*) 
            FROM sets s
            JOIN exercises e ON e.id = s.exercise_id
            WHERE e.workout_id = w.id
        ),
        total_exercises = (
            SELECT COUNT(*) 
            FROM exercises e
            WHERE e.workout_id = w.id
        ),
        total_volume = (
            SELECT COALESCE(SUM(
                CASE 
                    WHEN e.type = 'standard' THEN s.reps * s.weight
                    WHEN e.type = 'bodyweight' THEN s.reps
                    WHEN e.type = 'timed' THEN s.duration
                    ELSE 0
                END
            ), 0)
            FROM sets s
            JOIN exercises e ON e.id = s.exercise_id
            WHERE e.workout_id = w.id
        ),
        set_ids = (
            SELECT ARRAY_AGG(s.id)
            FROM sets s
            JOIN exercises e ON e.id = s.exercise_id
            WHERE e.workout_id = w.id
        )
    WHERE w.id = v_workout_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update exercise stats when sets are modified
DROP TRIGGER IF EXISTS update_exercise_stats_trigger ON sets;
CREATE TRIGGER update_exercise_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON sets
    FOR EACH ROW
    EXECUTE FUNCTION update_exercise_stats();

-- Create function to update workout stats when exercises are modified
CREATE OR REPLACE FUNCTION update_workout_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the workout's statistics
    UPDATE workouts w
    SET 
        total_sets = (
            SELECT COUNT(*) 
            FROM sets s
            JOIN exercises e ON e.id = s.exercise_id
            WHERE e.workout_id = w.id
        ),
        total_exercises = (
            SELECT COUNT(*) 
            FROM exercises e
            WHERE e.workout_id = w.id
        ),
        total_volume = (
            SELECT COALESCE(SUM(
                CASE 
                    WHEN e.type = 'standard' THEN s.reps * s.weight
                    WHEN e.type = 'bodyweight' THEN s.reps
                    WHEN e.type = 'timed' THEN s.duration
                    ELSE 0
                END
            ), 0)
            FROM sets s
            JOIN exercises e ON e.id = s.exercise_id
            WHERE e.workout_id = w.id
        ),
        set_ids = (
            SELECT ARRAY_AGG(s.id)
            FROM sets s
            JOIN exercises e ON e.id = s.exercise_id
            WHERE e.workout_id = w.id
        )
    WHERE w.id = NEW.workout_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update workout stats when exercises are modified
DROP TRIGGER IF EXISTS update_workout_stats_trigger ON exercises;
CREATE TRIGGER update_workout_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON exercises
    FOR EACH ROW
    EXECUTE FUNCTION update_workout_stats();

-- Create policies for user_roles
CREATE POLICY "Users can view their own role"
    ON user_roles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Only admins can modify roles"
    ON user_roles FOR ALL
    TO authenticated
    USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'))
    WITH CHECK (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

-- Create trigger to update updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create policies for user_inventory
CREATE POLICY "Users can view their own inventory"
    ON user_inventory FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inventory items"
    ON user_inventory FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inventory items"
    ON user_inventory FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inventory items"
    ON user_inventory FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to ensure only one item per slot is equipped
CREATE OR REPLACE FUNCTION ensure_single_equipped_item()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_equipped = true THEN
        -- Check if there's already an equipped item in the same slot
        IF EXISTS (
            SELECT 1
            FROM user_inventory ui
            JOIN items i ON ui.item_id = i.id
            WHERE ui.user_id = NEW.user_id
            AND ui.is_equipped = true
            AND ui.id != NEW.id
            AND i.slot_type = (
                SELECT slot_type
                FROM items
                WHERE id = NEW.item_id
            )
        ) THEN
            RAISE EXCEPTION 'Only one item can be equipped per slot';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for the function
CREATE TRIGGER ensure_single_equipped_item_trigger
    BEFORE INSERT OR UPDATE ON user_inventory
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_equipped_item();

-- Create policies for items
CREATE POLICY "Users can view all items"
    ON items FOR SELECT
    USING (true);

CREATE POLICY "Only admins can insert items"
    ON items FOR INSERT
    WITH CHECK (auth.role() = 'authenticated' AND EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    ));

CREATE POLICY "Only admins can update items"
    ON items FOR UPDATE
    USING (auth.role() = 'authenticated' AND EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    ));

CREATE POLICY "Only admins can delete items"
    ON items FOR DELETE
    USING (auth.role() = 'authenticated' AND EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )); 