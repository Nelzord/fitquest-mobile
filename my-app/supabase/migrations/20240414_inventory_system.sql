-- Migration: 20240414_inventory_system.sql
-- Description: Adds inventory system with items, user inventory, and related policies

-- Drop existing tables if they exist (idempotent)
DROP TABLE IF EXISTS user_inventory CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;

-- Create enum for slot types
DO $$ BEGIN
    CREATE TYPE item_slot_type AS ENUM ('head', 'chest', 'legs', 'feet', 'accessory', 'aura');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for muscle groups
DO $$ BEGIN
    CREATE TYPE muscle_group AS ENUM ('chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio', 'all');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for rarity types
DO $$ BEGIN
    CREATE TYPE item_rarity AS ENUM ('common', 'uncommon', 'rare', 'epic', 'legendary');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create items table
CREATE TABLE IF NOT EXISTS items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slot_type item_slot_type NOT NULL,
    rarity item_rarity NOT NULL,
    effect TEXT NOT NULL,
    xp_bonus JSONB NOT NULL,
    gold_bonus INTEGER NOT NULL DEFAULT 0,
    luck_bonus INTEGER NOT NULL DEFAULT 0,
    power_bonus INTEGER NOT NULL DEFAULT 0,
    image_path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_inventory table
CREATE TABLE IF NOT EXISTS user_inventory (
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
GRANT ALL ON items TO authenticated;
GRANT ALL ON user_roles TO authenticated;
GRANT ALL ON user_inventory TO authenticated;

-- Enable Row Level Security
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;

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
DROP TRIGGER IF EXISTS ensure_single_equipped_item_trigger ON user_inventory;
CREATE TRIGGER ensure_single_equipped_item_trigger
    BEFORE INSERT OR UPDATE ON user_inventory
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_equipped_item(); 