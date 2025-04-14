import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ItemDetailsModal } from './ItemDetailsModal';

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
  onEquipItem: (item: Item) => void;
}

const slotTypes = ['head', 'chest', 'legs', 'feet', 'accessory'];

export const InventoryGrid: React.FC<InventoryGridProps> = ({ items, onItemPress, onEquipItem }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const getItemImage = (imagePath: string) => {
    return itemImages[imagePath] || null;
  };

  const handleItemPress = (item: Item) => {
    setSelectedItem(item);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
  };

  const handleEquip = () => {
    if (selectedItem) {
      onEquipItem(selectedItem);
      setSelectedItem(null);
    }
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
        onPress={() => handleItemPress(item)}
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
                <Ionicons name="image" size={24} color={isDark ? '#666' : '#999'} />
              </View>
            )
          ) : (
            <View style={styles.lockedOverlay}>
              <Ionicons name="lock-closed" size={20} color={isDark ? '#666' : '#999'} />
            </View>
          )}
          {item.is_equipped && (
            <View style={styles.equippedBadge}>
              <Ionicons name="checkmark-circle" size={12} color="#4CAF50" />
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

  const renderSection = (slotType: string) => {
    const sectionItems = items.filter(item => item.slot_type === slotType);
    if (sectionItems.length === 0) return null;

    return (
      <View key={slotType}>
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionHeaderText}>
            {slotType.charAt(0).toUpperCase() + slotType.slice(1)}
          </ThemedText>
        </View>
        <FlatList
          data={sectionItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={4}
          scrollEnabled={false}
          contentContainerStyle={styles.sectionContent}
        />
      </View>
    );
  };

  return (
    <>
      <FlatList
        data={slotTypes}
        renderItem={({ item }) => renderSection(item)}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.gridContainer}
      />
      <ItemDetailsModal
        item={selectedItem}
        onClose={handleCloseModal}
        onEquip={handleEquip}
      />
    </>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    padding: 8,
  },
  sectionHeader: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionContent: {
    paddingHorizontal: 8,
  },
  itemContainer: {
    flex: 1,
    margin: 4,
    maxWidth: '25%',
  },
  itemImageContainer: {
    aspectRatio: 1,
    borderRadius: 8,
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
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
    padding: 2,
  },
  itemInfo: {
    marginTop: 4,
  },
  itemName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  rarityBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '500',
    color: 'white',
  },
}); 