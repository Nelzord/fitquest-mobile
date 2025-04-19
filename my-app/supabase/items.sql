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
    '{"muscle_group": "cardio", "bonus": 0}'::JSONB,
    0,
    '{"muscle_group": "cardio", "bonus": 1}'::JSONB,
    'sweatband.png',
    NOW(), NOW(), 100
),
(
    'Basic Sneakers',
    'feet',
    'common',
    'Gain 5% more XP from leg exercises',
    '{"muscle_group": "legs", "bonus": 5}'::JSONB,
    '{"muscle_group": "legs", "bonus": 0}'::JSONB,
    0,
    '{"muscle_group": "legs", "bonus": 1}'::JSONB,
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
    '{"muscle_group": "all", "bonus": 0}'::JSONB,
    10,
    '{"muscle_group": "all", "bonus": 5}'::JSONB,
    'cowboy_hat.png',
    NOW(), NOW(), 200
),
(
    'Iron Sword',
    'accessory',
    'uncommon',
    'Gain 10% more XP from arm exercises',
    '{"muscle_group": "arms", "bonus": 10}'::JSONB,
    '{"muscle_group": "arms", "bonus": 0}'::JSONB,
    0,
    '{"muscle_group": "arms", "bonus": 2}'::JSONB,
    'iron_sword.png',
    NOW(), NOW(), 100
);

-- Rare Items
INSERT INTO items (
    name, slot_type, rarity, effect, xp_bonus, gold_bonus, luck_bonus, power_bonus, image_path, created_at, updated_at, price
) VALUES 
(
    'Cowboy Vest',
    'chest',
    'rare',
    'Gain 15% more XP from core exercises',
    '{"muscle_group": "core", "bonus": 15}'::JSONB,
    '{"muscle_group": "core", "bonus": 0}'::JSONB,
    0,
    '{"muscle_group": "core", "bonus": 4}'::JSONB,
    'cowboy_vest.png',
    NOW(), NOW(), 300
),
(
    'Cowboy Boots',
    'feet',
    'rare',
    'Gain 10% more XP from leg exercises and +5% gold earned',
    '{"muscle_group": "legs", "bonus": 10}'::JSONB,
    '{"muscle_group": "legs", "bonus": 5}'::JSONB,
    0,
    '{"muscle_group": "legs", "bonus": 3}'::JSONB,
    'cowboy_boots.png',
    NOW(), NOW(), 200
);

-- Epic Items
INSERT INTO items (
    name, slot_type, rarity, effect, xp_bonus, gold_bonus, luck_bonus, power_bonus, image_path, created_at, updated_at, price
) VALUES 
(
    'Rice Hat',
    'head',
    'epic',
    'Gain 10% XP from all exercises and +10 power',
    '{"muscle_group": "all", "bonus": 10}'::JSONB,
    '{"muscle_group": "all", "bonus": 0}'::JSONB,
    0,
    '{"muscle_group": "all", "bonus": 10}'::JSONB,
    'rice_hat.png',
    NOW(), NOW(), 400
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
    '{"muscle_group": "all", "bonus": 10}'::JSONB,
    20,
    '{"muscle_group": "all", "bonus": 15}'::JSONB,
    'golden_crown.png',
    NOW(), NOW(), 500
),
(
    'Phantom Cloak',
    'chest',
    'legendary',
    'Gain 25% XP from back exercises and +15% luck',
    '{"muscle_group": "back", "bonus": 25}'::JSONB,
    '{"muscle_group": "back", "bonus": 0}'::JSONB,
    15,
    '{"muscle_group": "back", "bonus": 12}'::JSONB,
    'phantom_cloak.png',
    NOW(), NOW(), 400
);
