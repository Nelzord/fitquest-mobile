-- Drop existing policy
DROP POLICY IF EXISTS "Users can view their own stats" ON user_stats;

-- Create new policy that allows users to view their own stats and their friends' stats
CREATE POLICY "Users can view their own and friends' stats"
    ON user_stats FOR SELECT
    USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM friends
            WHERE (
                (friends.user_id = auth.uid() AND friends.friend_id = user_stats.user_id) OR
                (friends.friend_id = auth.uid() AND friends.user_id = user_stats.user_id)
            )
            AND friends.status = 'accepted'
        )
    ); 