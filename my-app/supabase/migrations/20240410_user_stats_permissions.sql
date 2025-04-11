-- Enable Row Level Security for user_stats table
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can insert their own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can update their own stats" ON user_stats;

-- Create policies for user_stats
CREATE POLICY "Users can view their own stats"
    ON user_stats FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats"
    ON user_stats FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats"
    ON user_stats FOR UPDATE
    USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON user_stats TO authenticated; 