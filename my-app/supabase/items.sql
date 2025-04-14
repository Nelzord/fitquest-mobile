-- Common Items
INSERT INTO items (
    name, slot_type, rarity, effect, xp_bonus, gold_bonus, luck_bonus, power_bonus, image_path, created_at, updated_at
) VALUES 
(
    'Sweatband',
    'head',
    'common',
    'Gain 5% more XP from cardio exercises',
    '{"muscle_group": "cardio", "bonus": 5}'::JSONB,
    0, 0, 1,
    'sweatband.png',
    NOW(), NOW()
),
(
    'Basic Sneakers',
    'feet',
    'common',
    'Gain 5% more XP from leg exercises',
    '{"muscle_group": "legs", "bonus": 5}'::JSONB,
    0, 0, 1,
    'basic_sneakers.png',
    NOW(), NOW()
);

-- Uncommon Items
INSERT INTO items (
    name, slot_type, rarity, effect, xp_bonus, gold_bonus, luck_bonus, power_bonus, image_path, created_at, updated_at
) VALUES 
(
    'Cowboy Hat',
    'head',
    'uncommon',
    'Gain 5% more XP from all exercises and +10% luck',
    '{"muscle_group": "all", "bonus": 5}'::JSONB,
    0, 10, 5,
    'cowboy_hat.png',
    NOW(), NOW()
),
(
    'Leather Gloves',
    'accessory',
    'uncommon',
    'Gain 10% more XP from arm exercises',
    '{"muscle_group": "arms", "bonus": 10}'::JSONB,
    0, 0, 2,
    'leather_gloves.png',
    NOW(), NOW()
);

-- Rare Items
INSERT INTO items (
    name, slot_type, rarity, effect, xp_bonus, gold_bonus, luck_bonus, power_bonus, image_path, created_at, updated_at
) VALUES 
(
    'Weighted Vest',
    'chest',
    'rare',
    'Gain 15% more XP from core exercises',
    '{"muscle_group": "core", "bonus": 15}'::JSONB,
    0, 0, 4,
    'weighted_vest.png',
    NOW(), NOW()
),
(
    'Trail Boots',
    'feet',
    'rare',
    'Gain 10% more XP from leg exercises and +5% gold earned',
    '{"muscle_group": "legs", "bonus": 10}'::JSONB,
    5, 0, 3,
    'trail_boots.png',
    NOW(), NOW()
);

-- Epic Items
INSERT INTO items (
    name, slot_type, rarity, effect, xp_bonus, gold_bonus, luck_bonus, power_bonus, image_path, created_at, updated_at
) VALUES 
(
    'Champion Headband',
    'head',
    'epic',
    'Gain 10% XP from all exercises and +10 power',
    '{"muscle_group": "all", "bonus": 10}'::JSONB,
    0, 0, 10,
    'champion_headband.png',
    NOW(), NOW()
),
(
    'Power Gauntlets',
    'accessory',
    'epic',
    'Gain 15% XP from arm exercises and +10% gold earned',
    '{"muscle_group": "arms", "bonus": 15}'::JSONB,
    10, 0, 8,
    'power_gauntlets.png',
    NOW(), NOW()
);

-- Legendary Items
INSERT INTO items (
    name, slot_type, rarity, effect, xp_bonus, gold_bonus, luck_bonus, power_bonus, image_path, created_at, updated_at
) VALUES 
(
    'Golden Crown',
    'head',
    'legendary',
    'Gain 20% XP from all exercises, +20% luck, and +10% gold',
    '{"muscle_group": "all", "bonus": 20}'::JSONB,
    10, 20, 15,
    'golden_crown.png',
    NOW(), NOW()
),
(
    'Phantom Cloak',
    'chest',
    'legendary',
    'Gain 25% XP from back exercises and +15% luck',
    '{"muscle_group": "back", "bonus": 25}'::JSONB,
    0, 15, 12,
    'phantom_cloak.png',
    NOW(), NOW()
);
