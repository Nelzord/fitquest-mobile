import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
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

      const combinedItems = allItems.map((item: Item) => {
        const inventoryItem = userInventory.find((ui: { item_id: string }) => ui.item_id === item.id);
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
    } catch (error) {
      console.error('Error equipping item:', error);
    }
  };

  const handlePurchaseItem = async (item: Item) => {
    if (!user) return;
  
    try {
      // Get user's current gold
      const { data: userStats, error: statsError } = await supabase
        .from('user_stats')
        .select('gold')
        .eq('user_id', user.id)
        .single();
  
      if (statsError) throw statsError;
  
      if (userStats.gold < item.price) {
        return;
      }

      // Add item to user's inventory
      const { error: inventoryError } = await supabase
        .from('user_inventory')
        .insert({
          user_id: user.id,
          item_id: item.id,
          is_equipped: false
        });

      if (inventoryError) throw inventoryError;

      // Deduct gold from user
      const { error: goldError } = await supabase
        .from('user_stats')
        .update({ gold: userStats.gold - item.price })
        .eq('user_id', user.id);

      if (goldError) throw goldError;
  
      // Refresh the UI
      fetchItems();
      fetchUserGold();
    } catch (error) {
      console.error('Error purchasing item:', error);
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
      const availableItems = allItems.filter((item: Item) => 
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
      <View style={styles(colorScheme).tabContent}>
        <View style={styles(colorScheme).goldContainer}>
          <Ionicons name="cash" size={24} color="#FFD700" />
          <ThemedText style={styles(colorScheme).goldText}>{userGold}</ThemedText>
        </View>
        <TouchableOpacity 
          style={[styles(colorScheme).capsuleButton, userGold < 100 && styles(colorScheme).disabledButton]}
          onPress={handlePurchaseCapsule}
          disabled={userGold < 100}
        >
          <Ionicons name="gift" size={24} color="#FFD700" />
          <ThemedText style={styles(colorScheme).capsuleText}>Mystery Capsule (100 gold)</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles(colorScheme).sectionTitle}>Available Items</ThemedText>
        <InventoryGrid
          items={items.filter(item => !item.is_owned)}
          onItemPress={handlePurchaseItem}
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
          <View style={styles(colorScheme).tabContent}>
            <ThemedText style={styles(colorScheme).sectionTitle}>Achievements</ThemedText>
            <ThemedText>Coming soon!</ThemedText>
          </View>
        );
      case 'items':
        return (
          <View style={styles(colorScheme).tabContent}>
            <ThemedText style={styles(colorScheme).sectionTitle}>Your Items</ThemedText>
            <InventoryGrid
              items={items.filter(item => item.is_owned)}
              onItemPress={handleEquipItem}
              onEquipItem={handleEquipItem}
              userGold={userGold}
            />
          </View>
        );
    }
  };

  return (
    <ThemedView style={[styles(colorScheme).container, { paddingTop: insets.top }]}>
      <View style={styles(colorScheme).tabBar}>
        <TouchableOpacity
          style={[styles(colorScheme).tab, activeTab === 'shop' && styles(colorScheme).activeTab]}
          onPress={() => setActiveTab('shop')}
        >
          <Ionicons name="cart" size={24} color={activeTab === 'shop' ? Colors[colorScheme].tint : Colors[colorScheme].tabIconDefault} />
          <ThemedText style={[styles(colorScheme).tabText, activeTab === 'shop' && styles(colorScheme).activeTabText]}>Shop</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles(colorScheme).tab, activeTab === 'achievements' && styles(colorScheme).activeTab]}
          onPress={() => setActiveTab('achievements')}
        >
          <Ionicons name="trophy" size={24} color={activeTab === 'achievements' ? Colors[colorScheme].tint : Colors[colorScheme].tabIconDefault} />
          <ThemedText style={[styles(colorScheme).tabText, activeTab === 'achievements' && styles(colorScheme).activeTabText]}>Achievements</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles(colorScheme).tab, activeTab === 'items' && styles(colorScheme).activeTab]}
          onPress={() => setActiveTab('items')}
        >
          <Ionicons name="bag" size={24} color={activeTab === 'items' ? Colors[colorScheme].tint : Colors[colorScheme].tabIconDefault} />
          <ThemedText style={[styles(colorScheme).tabText, activeTab === 'items' && styles(colorScheme).activeTabText]}>Items</ThemedText>
        </TouchableOpacity>
      </View>
      <View style={styles(colorScheme).content}>
        {renderContent()}
      </View>
    </ThemedView>
  );
}

const styles = (colorScheme: 'light' | 'dark') => StyleSheet.create({
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
    borderBottomColor: Colors[colorScheme].tint,
  },
  tabText: {
    marginTop: 4,
    fontSize: 12,
  },
  activeTabText: {
    color: Colors[colorScheme].tint,
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
  disabledButton: {
    opacity: 0.5,
  },
}); 