import React, { useState, useMemo } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, FlatList, Modal, TextInput } from 'react-native';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { PurchaseModal } from './PurchaseModal';

interface Item {
  id: string;
  name: string;
  slot_type: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  effect: string;
  image_path: string;
  is_owned: boolean;
  is_equipped: boolean;
  price: number;
}

interface InventoryGridProps {
  items: Item[];
  onItemPress: (item: Item) => void;
  onEquipItem: (item: Item) => void;
  userGold: number;
  isShop: boolean;
}

const rarityColors = {
  common: '#808080',
  uncommon: '#2E8B57',
  rare: '#4169E1',
  epic: '#9932CC',
  legendary: '#FFD700'
};

const rarityGlowColors = {
  common: 'rgba(128, 128, 128, 0.3)',
  uncommon: 'rgba(46, 139, 87, 0.3)',
  rare: 'rgba(65, 105, 225, 0.3)',
  epic: 'rgba(153, 50, 204, 0.3)',
  legendary: 'rgba(255, 215, 0, 0.3)'
};

export const InventoryGrid: React.FC<InventoryGridProps> = ({ items, onItemPress, onEquipItem, userGold, isShop }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRarity, setSelectedRarity] = useState<string | null>(null);
  const [ownershipFilter, setOwnershipFilter] = useState<'all' | 'owned' | 'not_owned'>('all');

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRarity = !selectedRarity || item.rarity === selectedRarity;
      const matchesOwnership = 
        ownershipFilter === 'all' || 
        (ownershipFilter === 'owned' && item.is_owned) || 
        (ownershipFilter === 'not_owned' && !item.is_owned);
      const hasPrice = isShop ? item.price > 0 : true;
      return matchesSearch && matchesRarity && matchesOwnership && hasPrice;
    });
  }, [items, searchQuery, selectedRarity, ownershipFilter, isShop]);

  const getItemImage = (imagePath: string) => {
    try {
      // Import images statically
      const images: { [key: string]: any } = {
        'sweatband.png': require('../assets/images/items/sweatband.png'),
        'basic_sneakers.png': require('../assets/images/items/basic_sneakers.png'),
        'cowboy_hat.png': require('../assets/images/items/cowboy_hat.png'),
        'cowboy_vest.png': require('../assets/images/items/cowboy_vest.png'),
        'cowboy_boots.png': require('../assets/images/items/cowboy_boots.png'),
        'rice_hat.png': require('../assets/images/items/rice_hat.png'),
        'iron_sword.png': require('../assets/images/items/iron_sword.png'),
        'phantom_cloak.png': require('../assets/images/items/phantom_cloak.png'),
        'golden_crown.png': require('../assets/images/items/golden_crown.png'),
        'training_cap.png': require('../assets/images/items/training_cap.png'),
        'leg_day_band.png': require('../assets/images/items/leg_day_band.png'),
        'hardwork_medal.png': require('../assets/images/items/hardwork_medal.png')
      };
      return images[imagePath] || null;
    } catch (error) {
      console.error('Error loading image:', error);
      return null;
    }
  };

  const handleItemPress = (item: Item) => {
    if (item.is_owned) {
      onItemPress(item);
    } else {
      setSelectedItem(item);
    }
  };

  const handlePurchase = (item: Item) => {
    setSelectedItem(null);
    onItemPress(item);
  };

  const renderFilterModal = () => {
    return (
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#2A2A2A' : '#F5F5F5' }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Filters</ThemedText>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color={Colors[colorScheme].text} />
              </TouchableOpacity>
            </View>
            <View style={styles.filterContent}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search items..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <View style={styles.raritySection}>
                <ThemedText style={styles.sectionTitle}>Rarity</ThemedText>
                <View style={styles.rarityOptions}>
                  {Object.keys(rarityColors).map(rarity => (
                    <TouchableOpacity
                      key={rarity}
                      style={[
                        styles.rarityOption,
                        selectedRarity === rarity && styles.selectedRarityOption,
                        { borderColor: rarityColors[rarity as keyof typeof rarityColors] }
                      ]}
                      onPress={() => setSelectedRarity(selectedRarity === rarity ? null : rarity)}
                    >
                      <ThemedText style={styles.rarityOptionText}>{rarity}</ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.ownershipSection}>
                <ThemedText style={styles.sectionTitle}>Ownership</ThemedText>
                <View style={styles.ownershipOptions}>
                  {['all', 'owned', 'not_owned'].map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.ownershipOption,
                        ownershipFilter === option && styles.selectedOwnershipOption,
                      ]}
                      onPress={() => setOwnershipFilter(option as 'all' | 'owned' | 'not_owned')}
                    >
                      <ThemedText style={styles.ownershipOptionText}>
                        {option === 'all' ? 'All Items' : option === 'owned' ? 'Owned' : 'Not Owned'}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderItem = ({ item }: { item: Item }) => {
    return (
      <TouchableOpacity
        style={[
          styles.itemContainer,
          { borderColor: rarityColors[item.rarity] },
          { shadowColor: rarityGlowColors[item.rarity] }
        ]}
        onPress={() => handleItemPress(item)}
      >
        <View style={styles.itemImageContainer}>
          {getItemImage(item.image_path) ? (
            <Image source={getItemImage(item.image_path)} style={styles.itemImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="image" size={24} color="#666" />
            </View>
          )}
          {item.is_equipped && (
            <View style={styles.equippedBadge}>
              <Ionicons name="checkmark" size={12} color="white" />
            </View>
          )}
        </View>
        <ThemedText style={styles.itemName}>{item.name}</ThemedText>
        <ThemedText style={[styles.itemRarity, { color: rarityColors[item.rarity] }]}>
          {item.rarity}
        </ThemedText>
        <View style={styles.buttonContainer}>
          {item.is_owned ? (
            <View style={[styles.buyButton, styles.ownedButton]}>
              <ThemedText style={styles.buyButtonText}>Owned</ThemedText>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.buyButton}
              onPress={() => setSelectedItem(item)}
            >
              <Image 
                source={require('@/assets/images/logos/goldcoin.png')} 
                style={styles.priceIcon}
                resizeMode="contain"
              />
              <ThemedText style={styles.buyButtonText}>{item.price}</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Available Items</ThemedText>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="filter" size={24} color={Colors[colorScheme].text} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.grid}
      />
      {selectedItem && !selectedItem.is_owned && (
        <PurchaseModal
          item={selectedItem}
          userGold={userGold}
          onClose={() => setSelectedItem(null)}
          onPurchase={handlePurchase}
        />
      )}
      {renderFilterModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  filterButton: {
    padding: 8,
  },
  grid: {
    padding: 8,
    paddingBottom: 100,
  },
  itemContainer: {
    flex: 1,
    margin: 4,
    maxWidth: '33.33%',
    borderRadius: 8,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    shadowOpacity: 1,
    elevation: 5,
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
  equippedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 6,
    padding: 2,
  },
  itemName: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
    textAlign: 'center',
  },
  itemRarity: {
    fontSize: 8,
    fontWeight: '500',
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 'auto',
    paddingTop: 4,
  },
  buyButton: {
    backgroundColor: '#4CAF50',
    padding: 4,
    borderRadius: 4,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buyButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  ownedButton: {
    backgroundColor: '#808080',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  filterContent: {
    padding: 16,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  raritySection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  rarityOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  rarityOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedRarityOption: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  rarityOptionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  priceIcon: {
    width: 12,
    height: 12,
    marginRight: 2,
  },
  ownershipSection: {
    marginBottom: 16,
  },
  ownershipOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  ownershipOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 8,
    marginBottom: 8,
  },
  selectedOwnershipOption: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderColor: Colors.light.tint,
  },
  ownershipOptionText: {
    fontSize: 12,
    fontWeight: '500',
  },
}); 