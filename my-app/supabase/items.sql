-- Common Items
INSERT INTO items (
    name, slot_type, rarity, effect, xp_bonus, gold_bonus, luck_bonus, power_bonus, image_path, created_at, updated_at, price
) VALUES 
(
    'Sweatband',
    'head',
    'common',
    'Gain 5% more XP from cardio exercises',
    '{"muscle_group": "cardio", "bonus": 5}'::JSONB,
    0, 0, 1,
    'sweatband.png',
    NOW(), NOW(), 100
),
(
    'Basic Sneakers',
    'feet',
    'common',
    'Gain 5% more XP from leg exercises',
    '{"muscle_group": "legs", "bonus": 5}'::JSONB,
    0, 0, 1,
    'basic_sneakers.png',
    NOW(), NOW(), 100
);

-- Uncommon Items
INSERT INTO items (
    name, slot_type, rarity, effect, xp_bonus, gold_bonus, luck_bonus, power_bonus, image_path, created_at, updated_at, price
) VALUES 
(
    'Cowboy Hat',
    'head',
    'uncommon',
    'Gain 5% more XP from all exercises and +10% luck',
    '{"muscle_group": "all", "bonus": 5}'::JSONB,
    0, 10, 5,
    'cowboy_hat.png',
    NOW(), NOW(), 200
),
(
    'Leather Gloves',
    'accessory',
    'uncommon',
    'Gain 10% more XP from arm exercises',
    '{"muscle_group": "arms", "bonus": 10}'::JSONB,
    0, 0, 2,
    'leather_gloves.png',
    NOW(), NOW(), 100
);

-- Rare Items
INSERT INTO items (
    name, slot_type, rarity, effect, xp_bonus, gold_bonus, luck_bonus, power_bonus, image_path, created_at, updated_at, price
) VALUES 
(
    'Weighted Vest',
    'chest',
    'rare',
    'Gain 15% more XP from core exercises',
    '{"muscle_group": "core", "bonus": 15}'::JSONB,
    0, 0, 4,
    'weighted_vest.png',
    NOW(), NOW(), 300
),
(
    'Trail Boots',
    'feet',
    'rare',
    'Gain 10% more XP from leg exercises and +5% gold earned',
    '{"muscle_group": "legs", "bonus": 10}'::JSONB,
    5, 0, 3,
    'trail_boots.png',
    NOW(), NOW(), 200
);

-- Epic Items
INSERT INTO items (
    name, slot_type, rarity, effect, xp_bonus, gold_bonus, luck_bonus, power_bonus, image_path, created_at, updated_at, price
) VALUES 
(
    'Champion Headband',
    'head',
    'epic',
    'Gain 10% XP from all exercises and +10 power',
    '{"muscle_group": "all", "bonus": 10}'::JSONB,
    0, 0, 10,
    'champion_headband.png',
    NOW(), NOW(), 400
),
(
    'Power Gauntlets',
    'accessory',
    'epic',
    'Gain 15% XP from arm exercises and +10% gold earned',
    '{"muscle_group": "arms", "bonus": 15}'::JSONB,
    10, 0, 8,
    'power_gauntlets.png',
    NOW(), NOW(), 300
);

-- Legendary Items
INSERT INTO items (
    name, slot_type, rarity, effect, xp_bonus, gold_bonus, luck_bonus, power_bonus, image_path, created_at, updated_at, price
) VALUES 
(
    'Golden Crown',
    'head',
    'legendary',
    'Gain 20% XP from all exercises, +20% luck, and +10% gold',
    '{"muscle_group": "all", "bonus": 20}'::JSONB,
    10, 20, 15,
    'golden_crown.png',
    NOW(), NOW(), 500
),
(
    'Phantom Cloak',
    'chest',
    'legendary',
    'Gain 25% XP from back exercises and +15% luck',
    '{"muscle_group": "back", "bonus": 25}'::JSONB,
    0, 15, 12,
    'phantom_cloak.png',
    NOW(), NOW(), 400
);

-- Insert items
INSERT INTO items (id, name, slot_type, rarity, effect, image_path, price) VALUES
  ('cowboy_hat', 'Cowboy Hat', 'head', 'uncommon', 'Gain 5% more XP from workouts', 'cowboy_hat.png', 200),
  ('weightlifting_belt', 'Weightlifting Belt', 'waist', 'common', 'Increase max weight by 5%', 'weightlifting_belt.png', 150),
  ('power_gloves', 'Power Gloves', 'hands', 'rare', 'Increase grip strength by 10%', 'power_gloves.png', 300),
  ('running_shoes', 'Running Shoes', 'feet', 'common', 'Increase running speed by 5%', 'running_shoes.png', 150),
  ('energy_drink', 'Energy Drink', 'consumable', 'uncommon', 'Restore 20% energy', 'energy_drink.png', 100),
  ('protein_shake', 'Protein Shake', 'consumable', 'common', 'Increase muscle growth by 5%', 'protein_shake.png', 80),
  ('wrist_wraps', 'Wrist Wraps', 'wrists', 'common', 'Reduce wrist fatigue by 10%', 'wrist_wraps.png', 120),
  ('knee_sleeves', 'Knee Sleeves', 'knees', 'uncommon', 'Reduce knee stress by 15%', 'knee_sleeves.png', 180),
  ('compression_shirt', 'Compression Shirt', 'chest', 'common', 'Improve blood flow by 5%', 'compression_shirt.png', 100),
  ('gym_bag', 'Gym Bag', 'accessory', 'rare', 'Carry 2 more items', 'gym_bag.png', 250);
