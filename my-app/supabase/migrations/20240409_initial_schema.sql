-- Create the workouts table with statistics columns
CREATE TABLE workouts (
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
CREATE TABLE exercises (
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
CREATE TABLE sets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    reps INTEGER,
    weight DECIMAL,
    duration INTEGER,
    distance DECIMAL,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE sets ENABLE ROW LEVEL SECURITY;

-- Create policies for workouts
CREATE POLICY "Users can view their own workouts"
    ON workouts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workouts"
    ON workouts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workouts"
    ON workouts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workouts"
    ON workouts FOR DELETE
    USING (auth.uid() = user_id);

-- Create policies for exercises
CREATE POLICY "Users can view their own exercises"
    ON exercises FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM workouts
        WHERE workouts.id = exercises.workout_id
        AND workouts.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert their own exercises"
    ON exercises FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM workouts
        WHERE workouts.id = exercises.workout_id
        AND workouts.user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own exercises"
    ON exercises FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM workouts
        WHERE workouts.id = exercises.workout_id
        AND workouts.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete their own exercises"
    ON exercises FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM workouts
        WHERE workouts.id = exercises.workout_id
        AND workouts.user_id = auth.uid()
    ));

-- Create policies for sets
CREATE POLICY "Users can view their own sets"
    ON sets FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM exercises
        JOIN workouts ON workouts.id = exercises.workout_id
        WHERE exercises.id = sets.exercise_id
        AND workouts.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert their own sets"
    ON sets FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM exercises
        JOIN workouts ON workouts.id = exercises.workout_id
        WHERE exercises.id = sets.exercise_id
        AND workouts.user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own sets"
    ON sets FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM exercises
        JOIN workouts ON workouts.id = exercises.workout_id
        WHERE exercises.id = sets.exercise_id
        AND workouts.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete their own sets"
    ON sets FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM exercises
        JOIN workouts ON workouts.id = exercises.workout_id
        WHERE exercises.id = sets.exercise_id
        AND workouts.user_id = auth.uid()
    ));

-- Grant necessary permissions
GRANT ALL ON workouts TO authenticated;
GRANT ALL ON exercises TO authenticated;
GRANT ALL ON sets TO authenticated;

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
CREATE TRIGGER update_workout_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON exercises
    FOR EACH ROW
    EXECUTE FUNCTION update_workout_stats(); 