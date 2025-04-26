-- Drop existing policy
DROP POLICY IF EXISTS "Users can view their own profile" ON users;

-- Create new policy that allows users to view their own profile and their friends' profiles
CREATE POLICY "Users can view their own and friends' profiles"
    ON users FOR SELECT
    USING (
        auth.uid() = id OR
        EXISTS (
            SELECT 1 FROM friends
            WHERE (
                (friends.user_id = auth.uid() AND friends.friend_id = users.id) OR
                (friends.friend_id = auth.uid() AND friends.user_id = users.id)
            )
            AND friends.status = 'accepted'
        )
    ); 