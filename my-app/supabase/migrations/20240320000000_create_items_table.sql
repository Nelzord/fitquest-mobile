-- Create enum for slot types
CREATE TYPE item_slot_type AS ENUM ('head', 'chest', 'legs', 'feet', 'accessory', 'aura');

-- Create enum for muscle groups
CREATE TYPE muscle_group AS ENUM ('chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio', 'all');

-- Create enum for item rarity
CREATE TYPE item_rarity AS ENUM ('common', 'uncommon', 'rare', 'epic', 'legendary');

-- Create items table
CREATE TABLE items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slot_type item_slot_type NOT NULL,
    rarity item_rarity NOT NULL,
    effect TEXT NOT NULL,
    xp_bonus JSONB NOT NULL, -- Format: {"muscle_group": "chest", "bonus": 10} or {"muscle_group": "all", "bonus": 5}
    gold_bonus INTEGER NOT NULL DEFAULT 0,
    luck_bonus INTEGER NOT NULL DEFAULT 0,
    image_path TEXT NOT NULL,
    price INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read items
CREATE POLICY "Allow authenticated users to read items"
    ON items FOR SELECT
    TO authenticated
    USING (true);

-- Allow only admins to modify items
CREATE POLICY "Allow only admins to modify items"
    ON items FOR ALL
    TO authenticated
    USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'))
    WITH CHECK (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

-- Create trigger to update updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 