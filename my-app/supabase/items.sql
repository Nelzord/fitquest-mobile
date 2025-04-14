-- Head Items
INSERT INTO items (
    name,
    slot_type,
    rarity,
    effect,
    xp_bonus,
    gold_bonus,
    luck_bonus,
    power_bonus,
    image_path,
    created_at,
    updated_at
) VALUES (
    'Cowboy Hat',
    'head',
    'uncommon',
    'Gain 10% more XP from chest exercises',
    '{"muscle_group": "chest", "bonus": 10}',
    0,
    0,
    0,
    'cowboy_hat.png',
    NOW(),
    NOW()
);