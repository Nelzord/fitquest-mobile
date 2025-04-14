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

type TabType = 'stats' | 'achievements' | 'items';

interface WorkoutStats {
  totalWorkouts: number;
  totalDuration: number;
  totalExercises: number;
  totalSets: number;
  totalVolume: number;
}

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

export default function InventoryScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const [activeTab, setActiveTab] = useState<TabType>('stats');
  const [stats, setStats] = useState<WorkoutStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWorkoutStats();
      fetchItems();
    }
  }, [user]);

  const fetchWorkoutStats = async () => {
    try {
      const { data: workouts, error } = await supabase
        .from('workouts')
        .select(`
          id,
          duration,
          exercises (
            id,
            sets (
              id,
              weight,
              reps
            )
          )
        `)
        .eq('user_id', user?.id);

      if (error) throw error;

      const stats: WorkoutStats = {
        totalWorkouts: workouts?.length || 0,
        totalDuration: workouts?.reduce((sum, workout) => sum + (workout.duration || 0), 0) || 0,
        totalExercises: workouts?.reduce((sum, workout) => sum + (workout.exercises?.length || 0), 0) || 0,
        totalSets: workouts?.reduce((sum, workout) => 
          sum + (workout.exercises?.reduce((exerciseSum, exercise) => 
            exerciseSum + (exercise.sets?.length || 0), 0) || 0), 0) || 0,
        totalVolume: workouts?.reduce((sum, workout) => 
          sum + (workout.exercises?.reduce((exerciseSum, exercise) => 
            exerciseSum + (exercise.sets?.reduce((setSum, set) => 
              setSum + ((set.weight || 0) * (set.reps || 0)), 0) || 0), 0) || 0), 0) || 0,
      };

      setStats(stats);
    } catch (error) {
      console.error('Error fetching workout stats:', error);
    } finally {
      setLoading(false);
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

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const renderStats = () => {
    if (loading) {
      return <ThemedText>Loading stats...</ThemedText>;
    }

    if (!stats) {
      return <ThemedText>No stats available</ThemedText>;
    }

    return (
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="barbell" size={24} color={Colors[colorScheme].tint} />
          <ThemedText style={styles.statValue}>{stats.totalWorkouts}</ThemedText>
          <ThemedText style={styles.statLabel}>Total Workouts</ThemedText>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="time" size={24} color={Colors[colorScheme].tint} />
          <ThemedText style={styles.statValue}>{formatDuration(stats.totalDuration)}</ThemedText>
          <ThemedText style={styles.statLabel}>Total Time</ThemedText>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="fitness" size={24} color={Colors[colorScheme].tint} />
          <ThemedText style={styles.statValue}>{stats.totalExercises}</ThemedText>
          <ThemedText style={styles.statLabel}>Total Exercises</ThemedText>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="repeat" size={24} color={Colors[colorScheme].tint} />
          <ThemedText style={styles.statValue}>{stats.totalSets}</ThemedText>
          <ThemedText style={styles.statLabel}>Total Sets</ThemedText>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="scale" size={24} color={Colors[colorScheme].tint} />
          <ThemedText style={styles.statValue}>{stats.totalVolume.toLocaleString()} kg</ThemedText>
          <ThemedText style={styles.statLabel}>Total Volume</ThemedText>
        </View>
      </View>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'stats':
        return (
          <ScrollView style={styles.tabContent}>
            <ThemedText style={styles.sectionTitle}>Your Stats</ThemedText>
            {renderStats()}
          </ScrollView>
        );
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
            <ThemedText style={styles.sectionTitle}>Items</ThemedText>
            <InventoryGrid
              items={items}
              onItemPress={handleItemPress}
            />
          </View>
        );
    }
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
          onPress={() => setActiveTab('stats')}
        >
          <Ionicons name="stats-chart" size={24} color={activeTab === 'stats' ? Colors[colorScheme].tint : Colors[colorScheme].tabIconDefault} />
          <ThemedText style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>Stats</ThemedText>
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
          <View style={styles.modalContent}>
            {selectedItem && (
              <>
                <View style={styles.modalHeader}>
                  <ThemedText style={styles.modalTitle}>{selectedItem.name}</ThemedText>
                  <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                <View style={styles.itemDetails}>
                  <ThemedText style={styles.detailText}>Slot: {selectedItem.slot_type}</ThemedText>
                  <ThemedText style={styles.detailText}>Rarity: {selectedItem.rarity}</ThemedText>
                  <ThemedText style={styles.detailText}>Effect: {selectedItem.effect}</ThemedText>
                </View>

                {selectedItem.is_owned && (
                  <TouchableOpacity
                    style={[
                      styles.equipButton,
                      selectedItem.is_equipped && styles.equippedButton
                    ]}
                    onPress={() => handleEquipItem(selectedItem)}
                  >
                    <ThemedText style={styles.equipButtonText}>
                      {selectedItem.is_equipped ? 'Equipped' : 'Equip'}
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
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
  equipButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  equippedButton: {
    backgroundColor: '#666',
  },
  equipButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 