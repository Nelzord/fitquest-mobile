import React from 'react';
import { View, Image, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';

interface Item {
  id: number;
  name: string;
  slot_type: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  effect: string;
  image_path: string;
  is_owned: boolean;
  is_equipped: boolean;
  price: number;
}

interface EquippedItemsProps {
  items: Item[];
  style?: ViewStyle;
}

// Positions for the slots on top of the avatar
const slotPositions = {
  head: { top: -20, left: '50%', transform: [{ translateX: -40 }] } as ViewStyle,
  chest: { top: 80, left: '50%', transform: [{ translateX: -40 }] } as ViewStyle,
  hands_left: { top: 110, left: '5%' } as ViewStyle,
  hands_right: { top: 110, right: '5%' } as ViewStyle,
  feet_left: { bottom: 0, left: '20%' } as ViewStyle,
  feet_right: { bottom: 0, right: '20%' } as ViewStyle,
  accessory: { top: 110, right: '5%' } as ViewStyle,
};

// Helper to load images
export const getItemImage = (imagePath: string) => {
  try {
    const images: { [key: string]: any } = {
      'sweatband.png': require('../assets/images/items/sweatband.png'),
      'basic_sneakers.png': require('../assets/images/items/basic_sneakers.png'),
      'cowboy_hat.png': require('../assets/images/items/cowboy_hat.png'),
      'cowboy_vest.png': require('../assets/images/items/cowboy_vest.png'),
      'cowboy_boots.png': require('../assets/images/items/cowboy_boots.png'),
      'rice_hat.png': require('../assets/images/items/rice_hat.png'),
      'iron_sword.png': require('../assets/images/items/iron_sword.png'),
      'phantom_cloak.png': require('../assets/images/items/phantom_cloak.png'),
      'golden_crown.png': require('../assets/images/items/golden_crown.png')
    };
    return images[imagePath] || null;
  } catch (error) {
    console.error('Error loading image:', error);
    return null;
  }
};

export const EquippedItems: React.FC<EquippedItemsProps> = ({ items, style }) => {
  const equippedItems = items.filter(item => item.is_equipped);

  // Find equipped items by slot
  const headItem = equippedItems.find(item => item.slot_type === 'head');
  const chestItem = equippedItems.find(item => item.slot_type === 'chest');
  const handsItem = equippedItems.find(item => item.slot_type === 'hands');
  const feetItem = equippedItems.find(item => item.slot_type === 'feet');
  const accessoryItem = equippedItems.find(item => item.slot_type === 'accessory');

  return (
    <View style={[styles.container, style]}>
      {/* Head */}
      {headItem && (
        <Slot position={slotPositions.head}>
          <ImageOrPlaceholder item={headItem} />
        </Slot>
      )}

      {/* Chest */}
      {chestItem && (
        <Slot position={slotPositions.chest}>
          <ImageOrPlaceholder item={chestItem} scale={2} />
        </Slot>
      )}

      {/* Hands (mirror left and right) */}
      {handsItem && (
        <>
          <Slot position={slotPositions.hands_left}>
            <ImageOrPlaceholder item={handsItem} />
          </Slot>
          <Slot position={slotPositions.hands_right}>
            <ImageOrPlaceholder item={handsItem} />
          </Slot>
        </>
      )}

      {/* Feet (mirror left and right) */}
      {feetItem && (
        <>
          <Slot position={slotPositions.feet_left}>
            <ImageOrPlaceholder item={feetItem} />
          </Slot>
          <Slot position={slotPositions.feet_right}>
            <ImageOrPlaceholder item={feetItem} mirrored />
          </Slot>
        </>
      )}

      {/* Accessory */}
      {accessoryItem && (
        <Slot position={slotPositions.accessory}>
          <ImageOrPlaceholder item={accessoryItem} />
        </Slot>
      )}
    </View>
  );
};

// Slot wrapper for positioning
const Slot: React.FC<{ position: ViewStyle; children: React.ReactNode }> = ({ position, children }) => (
  <View style={[styles.slotContainer, position]}>
    {children}
  </View>
);

// Render equipped item or fallback placeholder
const ImageOrPlaceholder: React.FC<{ item: Item; mirrored?: boolean; scale?: number }> = ({ item, mirrored, scale = 1 }) => {
  if (!item) return null;
  
  const imageSource = getItemImage(item.image_path);
  const imageStyle = [
    styles.itemImage,
    { transform: [{ scale }] },
    mirrored && styles.mirrored
  ];

  return imageSource ? (
    <Image source={imageSource} style={imageStyle} />
  ) : (
    <View style={styles.placeholderImage}>
      <Ionicons name="image" size={24} color="#666" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  slotContainer: {
    position: 'absolute',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  mirrored: {
    transform: [{ scaleX: -1 }],
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#666',
  },
});
