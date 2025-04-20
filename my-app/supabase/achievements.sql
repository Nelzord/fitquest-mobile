INSERT INTO achievements (title, requirement, description, item_id)
VALUES 
(
    'Level Up!',
    'level >= 2',
    'Reach level 2 by completing workouts and gaining XP.',
    NULL
),
(
    'XP Grinder',
    'xp >= 1000',
    'Earn a total of 1,000 XP across all muscle groups. Hard work pays off!',
    NULL
),
(
    'Leg Day Legend',
    'legs_xp >= 500',
    'Earn 500 XP from leg workouts. Squats, lunges, and more!',
    NULL
);

-- Create user_achievements table to track unlocked achievements
CREATE TABLE user_achievements (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade,
    achievement_id uuid references achievements(id) on delete cascade,
    unlocked_at timestamp with time zone default timezone('utc'::text, now()) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, achievement_id)
);

-- Add trigger for updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON user_achievements
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Add RLS policies
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own achievements
CREATE POLICY "Users can view their own achievements"
    ON user_achievements FOR SELECT
    USING (auth.uid() = user_id);

-- Allow users to insert their own achievements
CREATE POLICY "Users can insert their own achievements"
    ON user_achievements FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Add RLS policies for achievements table
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read achievements
CREATE POLICY "Allow authenticated users to read achievements"
    ON achievements FOR SELECT
    TO authenticated
    USING (true);

-- Allow service role to manage achievements
CREATE POLICY "Allow service role to manage achievements"
    ON achievements FOR ALL
    TO service_role
    USING (true);

-- Allow admins to manage achievements
CREATE POLICY "Allow admins to manage achievements"
    ON achievements FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Grant necessary permissions to authenticated role
GRANT SELECT ON achievements TO authenticated;
GRANT SELECT ON user_achievements TO authenticated;
GRANT INSERT ON user_achievements TO authenticated;

-- Grant all permissions to service_role
GRANT ALL ON achievements TO service_role;
GRANT ALL ON user_achievements TO service_role;