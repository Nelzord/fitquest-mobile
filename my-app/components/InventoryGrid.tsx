import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import images statically
import cowboyHat from '@/assets/images/items/cowboy_hat.png';

// Create a mapping of image paths to imported images
const itemImages: { [key: string]: any } = {
  'cowboy_hat.png': cowboyHat,
};

interface Item {
  id: string;
  name: string;
  slot_type: string;
  rarity: string;
  effect: string;
  image_path: string;
  is_owned: boolean;
  is_equipped: boolean;
}

interface InventoryGridProps {
  items: Item[];
  onItemPress: (item: Item) => void;
}

export const InventoryGrid: React.FC<InventoryGridProps> = ({ items, onItemPress }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const getItemImage = (imagePath: string) => {
    return itemImages[imagePath] || null;
  };

  const renderItem = ({ item }: { item: Item }) => {
    const rarityColors = {
      common: '#808080',
      uncommon: '#2E8B57',
      rare: '#4169E1',
      epic: '#9932CC',
      legendary: '#FFD700'
    };

    const itemImage = getItemImage(item.image_path);

    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => onItemPress(item)}
      >
        <View style={[
          styles.itemImageContainer,
          { backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5' },
          !item.is_owned && styles.lockedItem
        ]}>
          {item.is_owned ? (
            itemImage ? (
              <Image
                source={itemImage}
                style={styles.itemImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons name="image" size={32} color={isDark ? '#666' : '#999'} />
              </View>
            )
          ) : (
            <View style={styles.lockedOverlay}>
              <Ionicons name="lock-closed" size={24} color={isDark ? '#666' : '#999'} />
            </View>
          )}
          {item.is_equipped && (
            <View style={styles.equippedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            </View>
          )}
        </View>
        <View style={styles.itemInfo}>
          <ThemedText style={styles.itemName}>{item.name}</ThemedText>
          <View style={[
            styles.rarityBadge,
            { backgroundColor: rarityColors[item.rarity as keyof typeof rarityColors] }
          ]}>
            <ThemedText style={styles.rarityText}>{item.rarity}</ThemedText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      numColumns={2}
      contentContainerStyle={styles.gridContainer}
    />
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    padding: 8,
  },
  itemContainer: {
    flex: 1,
    margin: 8,
    maxWidth: '50%',
  },
  itemImageContainer: {
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  lockedItem: {
    opacity: 0.5,
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  equippedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 4,
  },
  itemInfo: {
    marginTop: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  rarityText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
}); 