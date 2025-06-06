import React from 'react';
import { View, Image, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { ImageSourcePropType } from 'react-native';

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

// Add interface for item adjustments
interface ItemAdjustments {
  scale?: number;
  position?: {
    top?: number;
    left?: number;
    right?: number;
    bottom?: number;
  };
  rotation?: number;
  spacing?: number; // Add spacing for mirrored items
}

// Add configuration for item-specific adjustments
const itemAdjustments: Record<string, ItemAdjustments> = {
  'Sweatband': {
    scale: 1.2,
    position: { top: 0 }
  },
  'Basic Sneakers': {
    scale: 1,
    position: { bottom: 7 },
    spacing: -60
  },
  'Cowboy Hat': {
    scale: 1.3,
    position: { top: -10 }
  },
  'Cowboy Vest': {
    scale: 2.0,
    position: { top: 5 }
  },
  'Cowboy Boots': {
    scale: 1.1,
    position: { bottom: 0 },
    spacing: -62 // Add spacing between left and right boots
  },
  'Rice Hat': {
    scale: 1.5,
    position: { top: -5 }
  },
  'Iron Sword': {
    scale: 2,
    position: { top: -50, right: 12 }
  },
  'Phantom Cloak': {
    scale: 2.5,
    position: { top: 45 }
  },
  'Golden Crown': {
    scale: 1.2,
    position: { top: -18 }
  },
  'Training Cap': {
    scale: 1.2,
    position: { top: -5 }
  },
  'Leg Day Band': {
    scale: 1.3,
    position: { top: 90 }
  },
  'Hard Work Medal': {
    scale: 1.2,
    position: { top: 100, right: -5 }
  }
};

interface EquippedItemsProps {
  items: Item[];
  style?: ViewStyle;
}

// Positions for the slots on top of the avatar
const slotPositions = {
  head: { top: -20, left: '50%', transform: [{ translateX: -40 }] } as ViewStyle,
  chest: { top: 80, left: '50%', transform: [{ translateX: -40 }] } as ViewStyle,
  hands_left: { top: 110, left: 20 } as ViewStyle,
  hands_right: { top: 110, right: 20 } as ViewStyle,
  feet_left: { bottom: 0, left: 20 } as ViewStyle,
  feet_right: { bottom: 0, right: 20 } as ViewStyle,
  accessory: { top: 110, right: 20 } as ViewStyle,
};

// Helper to load images
// need to fix this bug with images loading separately
export const getItemImage = (itemName: string): ImageSourcePropType => {
  const imageMap: Record<string, ImageSourcePropType> = {
    'Sweatband': require('../assets/images/items/sweatband.png'),
    'Basic Sneakers': require('../assets/images/items/basic_sneakers.png'),
    'Cowboy Hat': require('../assets/images/items/cowboy_hat.png'),
    'Cowboy Vest': require('../assets/images/items/cowboy_vest.png'),
    'Cowboy Boots': require('../assets/images/items/cowboy_boots.png'),
    'Rice Hat': require('../assets/images/items/rice_hat.png'),
    'Iron Sword': require('../assets/images/items/iron_sword.png'),
    'Phantom Cloak': require('../assets/images/items/phantom_cloak.png'),
    'Golden Crown': require('../assets/images/items/golden_crown.png'),
    'Training Cap': require('../assets/images/items/training_cap.png'),
    'Leg Day Band': require('../assets/images/items/leg_day_band.png'),
    'Hard Work Medal': require('../assets/images/items/hardwork_medal.png')
  };
  return imageMap[itemName] || require('../assets/images/items/iron_sword.png');
};

// Update the slot positions to be dynamic based on item adjustments
const getSlotPosition = (basePosition: ViewStyle, item?: Item): ViewStyle => {
  if (!item) return basePosition;
  
  const adjustments = itemAdjustments[item.name] || {};
  const spacing = adjustments.spacing || 0;
  
  // Create a new position object
  const newPosition = { ...basePosition };
  
  // Handle left position
  if (basePosition.left !== undefined && typeof basePosition.left === 'number') {
    newPosition.left = basePosition.left - (spacing / 2);
  }
  
  // Handle right position
  if (basePosition.right !== undefined && typeof basePosition.right === 'number') {
    newPosition.right = basePosition.right - (spacing / 2);
  }
  
  return newPosition;
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
        <Slot position={getSlotPosition(slotPositions.head, headItem)}>
          <ImageOrPlaceholder item={headItem} />
        </Slot>
      )}

      {/* Chest */}
      {chestItem && (
        <Slot position={getSlotPosition(slotPositions.chest, chestItem)}>
          <ImageOrPlaceholder item={chestItem} scale={2} />
        </Slot>
      )}

      {/* Hands (mirror left and right) */}
      {handsItem && (
        <>
          <Slot position={getSlotPosition(slotPositions.hands_left, handsItem)}>
            <ImageOrPlaceholder item={handsItem} />
          </Slot>
          <Slot position={getSlotPosition(slotPositions.hands_right, handsItem)}>
            <ImageOrPlaceholder item={handsItem} />
          </Slot>
        </>
      )}

      {/* Feet (mirror left and right) */}
      {feetItem && (
        <>
          <Slot position={getSlotPosition(slotPositions.feet_left, feetItem)}>
            <ImageOrPlaceholder item={feetItem} />
          </Slot>
          <Slot position={getSlotPosition(slotPositions.feet_right, feetItem)}>
            <ImageOrPlaceholder item={feetItem} mirrored />
          </Slot>
        </>
      )}

      {/* Accessory */}
      {accessoryItem && (
        <Slot position={getSlotPosition(slotPositions.accessory, accessoryItem)}>
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
  
  const imageSource = getItemImage(item.name);
  const adjustments = itemAdjustments[item.name] || {};
  const finalScale = adjustments.scale || scale;
  const position = adjustments.position || {};
  const rotation = adjustments.rotation || 0;

  const imageStyle = [
    styles.itemImage,
    { 
      transform: [
        { scale: finalScale },
        { rotate: `${rotation}deg` },
        ...(mirrored ? [{ scaleX: -1 }] : [])
      ]
    },
    position
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
    position: 'absolute',
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
