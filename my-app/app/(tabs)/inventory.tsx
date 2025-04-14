import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { InventoryGrid } from '@/components/InventoryGrid';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

type TabType = 'shop' | 'achievements' | 'items';

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

export default function InventoryScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const [activeTab, setActiveTab] = useState<TabType>('shop');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [userGold, setUserGold] = useState(0);

  useEffect(() => {
    if (user) {
      fetchItems();
      fetchUserGold();
    }
  }, [user]);

  const fetchUserGold = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('gold')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setUserGold(data.gold);
    } catch (error) {
      console.error('Error fetching user gold:', error);
    }
  };

  const fetchItems = async () => {
    if (!user) return;

    try {
      const { data: allItems, error: itemsError } = await supabase
        .from('items')
        .select('*');

      if (itemsError) throw itemsError;

      const { data: userInventory, error: inventoryError } = await supabase
        .from('user_inventory')
        .select('*')
        .eq('user_id', user.id);

      if (inventoryError) throw inventoryError;

      const combinedItems = allItems.map(item => {
        const inventoryItem = userInventory.find(ui => ui.item_id === item.id);
        return {
          ...item,
          is_owned: !!inventoryItem,
          is_equipped: inventoryItem?.is_equipped || false
        };
      });

      setItems(combinedItems);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const handleItemPress = (item: Item) => {
    setSelectedItem(item);
    setIsModalVisible(true);
  };

  const handleEquipItem = async (item: Item) => {
    if (!user || !item.is_owned) return;

    try {
      const { error: unequipError } = await supabase
        .from('user_inventory')
        .update({ is_equipped: false })
        .eq('user_id', user.id)
        .eq('is_equipped', true)
        .in('item_id', items
          .filter(i => i.slot_type === item.slot_type)
          .map(i => i.id)
        );

      if (unequipError) throw unequipError;

      const { error: equipError } = await supabase
        .from('user_inventory')
        .update({ is_equipped: true })
        .eq('user_id', user.id)
        .eq('item_id', item.id);

      if (equipError) throw equipError;

      fetchItems();
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error equipping item:', error);
    }
  };

  const handlePurchaseItem = async (item: Item) => {
    if (!user || item.is_owned || userGold < item.price) return;

    try {
      // Start a transaction
      const { error: purchaseError } = await supabase
        .from('user_inventory')
        .insert({
          user_id: user.id,
          item_id: item.id,
          is_equipped: false
        });

      if (purchaseError) throw purchaseError;

      const { error: goldError } = await supabase
        .from('user_stats')
        .update({ gold: userGold - item.price })
        .eq('user_id', user.id);

      if (goldError) throw goldError;

      // Refresh data
      fetchItems();
      fetchUserGold();
      setIsModalVisible(false);
      alert(`Purchased ${item.name} for ${item.price} gold!`);
    } catch (error) {
      console.error('Error purchasing item:', error);
      alert('Failed to purchase item');
    }
  };

  const handlePurchaseCapsule = async () => {
    if (!user || userGold < 100) return;

    try {
      // Get all items
      const { data: allItems, error: itemsError } = await supabase
        .from('items')
        .select('*');

      if (itemsError) throw itemsError;

      // Filter out items the user already owns
      const availableItems = allItems.filter(item => 
        !items.some(ownedItem => ownedItem.id === item.id)
      );

      if (availableItems.length === 0) {
        alert('No new items available to unlock!');
        return;
      }

      // Select a random item
      const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];

      // Start a transaction
      const { error: purchaseError } = await supabase
        .from('user_inventory')
        .insert({
          user_id: user.id,
          item_id: randomItem.id,
          is_equipped: false
        });

      if (purchaseError) throw purchaseError;

      const { error: goldError } = await supabase
        .from('user_stats')
        .update({ gold: userGold - 100 })
        .eq('user_id', user.id);

      if (goldError) throw goldError;

      // Refresh data
      fetchItems();
      fetchUserGold();
      alert(`You got a ${randomItem.name}!`);
    } catch (error) {
      console.error('Error purchasing capsule:', error);
      alert('Failed to purchase capsule');
    }
  };

  const renderShop = () => {
    return (
      <View style={styles.tabContent}>
        <View style={styles.goldContainer}>
          <Ionicons name="cash" size={24} color="#FFD700" />
          <ThemedText style={styles.goldText}>{userGold}</ThemedText>
        </View>
        <TouchableOpacity 
          style={[styles.capsuleButton, userGold < 100 && styles.disabledButton]}
          onPress={handlePurchaseCapsule}
          disabled={userGold < 100}
        >
          <Ionicons name="gift" size={24} color="#FFD700" />
          <ThemedText style={styles.capsuleText}>Mystery Capsule (100 gold)</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.sectionTitle}>Available Items</ThemedText>
        <InventoryGrid
          items={items.filter(item => !item.is_owned)}
          onItemPress={handleItemPress}
          onEquipItem={handleEquipItem}
          userGold={userGold}
        />
      </View>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'shop':
        return renderShop();
      case 'achievements':
        return (
          <View style={styles.tabContent}>
            <ThemedText style={styles.sectionTitle}>Achievements</ThemedText>
            <ThemedText>Coming soon!</ThemedText>
          </View>
        );
      case 'items':
        return (
          <View style={styles.tabContent}>
            <ThemedText style={styles.sectionTitle}>Your Items</ThemedText>
            <InventoryGrid
              items={items.filter(item => item.is_owned)}
              onItemPress={handleItemPress}
              onEquipItem={handleEquipItem}
              userGold={userGold}
            />
          </View>
        );
    }
  };

  const renderModalContent = () => {
    if (!selectedItem) return null;

    return (
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <ThemedText style={styles.modalTitle}>{selectedItem.name}</ThemedText>
          <TouchableOpacity onPress={() => setIsModalVisible(false)}>
            <Ionicons name="close" size={24} color={Colors[colorScheme].text} />
          </TouchableOpacity>
        </View>
        <View style={styles.itemDetails}>
          <ThemedText style={styles.detailText}>Slot: {selectedItem.slot_type}</ThemedText>
          <ThemedText style={styles.detailText}>Rarity: {selectedItem.rarity}</ThemedText>
          <ThemedText style={styles.detailText}>Effect: {selectedItem.effect}</ThemedText>
          {!selectedItem.is_owned && (
            <ThemedText style={styles.detailText}>Price: {selectedItem.price} gold</ThemedText>
          )}
        </View>
        {selectedItem.is_owned ? (
          <TouchableOpacity
            style={[
              styles.actionButton,
              selectedItem.is_equipped && styles.equippedButton
            ]}
            onPress={() => handleEquipItem(selectedItem)}
          >
            <ThemedText style={styles.actionButtonText}>
              {selectedItem.is_equipped ? 'Equipped' : 'Equip'}
            </ThemedText>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.actionButton,
              userGold < selectedItem.price && styles.disabledButton
            ]}
            onPress={() => handlePurchaseItem(selectedItem)}
            disabled={userGold < selectedItem.price}
          >
            <ThemedText style={styles.actionButtonText}>
              {userGold < selectedItem.price ? 'Not Enough Gold' : 'Purchase'}
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'shop' && styles.activeTab]}
          onPress={() => setActiveTab('shop')}
        >
          <Ionicons name="cart" size={24} color={activeTab === 'shop' ? Colors[colorScheme].tint : Colors[colorScheme].tabIconDefault} />
          <ThemedText style={[styles.tabText, activeTab === 'shop' && styles.activeTabText]}>Shop</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'achievements' && styles.activeTab]}
          onPress={() => setActiveTab('achievements')}
        >
          <Ionicons name="trophy" size={24} color={activeTab === 'achievements' ? Colors[colorScheme].tint : Colors[colorScheme].tabIconDefault} />
          <ThemedText style={[styles.tabText, activeTab === 'achievements' && styles.activeTabText]}>Achievements</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'items' && styles.activeTab]}
          onPress={() => setActiveTab('items')}
        >
          <Ionicons name="bag" size={24} color={activeTab === 'items' ? Colors[colorScheme].tint : Colors[colorScheme].tabIconDefault} />
          <ThemedText style={[styles.tabText, activeTab === 'items' && styles.activeTabText]}>Items</ThemedText>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        {renderContent()}
      </View>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          {renderModalContent()}
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.light.tint,
  },
  tabText: {
    marginTop: 4,
    fontSize: 12,
  },
  activeTabText: {
    color: Colors.light.tint,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  goldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  goldText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  itemDetails: {
    marginBottom: 20,
  },
  detailText: {
    fontSize: 16,
    marginBottom: 8,
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  equippedButton: {
    backgroundColor: '#666',
  },
  disabledButton: {
    backgroundColor: '#999',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  capsuleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  capsuleText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
}); 