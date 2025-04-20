import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, FlatList, Modal, Alert } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { getItemImage } from './EquippedItems';

type Achievement = {
  id: string;
  title: string;
  requirement: string;
  description: string;
  item_id: string | null;
  is_unlocked: boolean;
  unlocked_at: string | null;
  itemName?: string | null;
};

type UserStats = {
  level: number;
  xp: number;
  legs_xp: number;
  chest_xp: number;
  back_xp: number;
  shoulders_xp: number;
  arms_xp: number;
  core_xp: number;
  cardio_xp: number;
};

export function AchievementsList() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const styles = getStyles(colorScheme);

  useEffect(() => {
    if (user) {
      fetchAchievements();
      fetchUserStats();
    }
  }, [user]);

  const fetchUserStats = async () => {
    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setUserStats(data);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const checkRequirement = (requirement: string): boolean => {
    if (!userStats) return false;

    // Parse the requirement string (e.g., "level >= 2", "xp >= 1000", "legs_xp >= 500")
    const [stat, operator, value] = requirement.split(' ');
    const statValue = userStats[stat as keyof UserStats];
    const numValue = parseFloat(value);

    switch (operator) {
      case '>=':
        return statValue >= numValue;
      case '<=':
        return statValue <= numValue;
      case '>':
        return statValue > numValue;
      case '<':
        return statValue < numValue;
      case '==':
        return statValue === numValue;
      default:
        return false;
    }
  };

  const checkAndUnlockAchievements = async () => {
    if (!userStats) return;

    for (const achievement of achievements) {
      if (!achievement.is_unlocked && checkRequirement(achievement.requirement)) {
        try {
          // First check if the achievement is already unlocked
          const { data: existingUnlock, error: checkError } = await supabase
            .from('user_achievements')
            .select('*')
            .eq('user_id', user?.id)
            .eq('achievement_id', achievement.id)
            .single();

          if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
            throw checkError;
          }

          // If achievement is already unlocked, just update local state
          if (existingUnlock) {
            setAchievements(prev => prev.map(a => 
              a.id === achievement.id 
                ? { ...a, is_unlocked: true, unlocked_at: existingUnlock.unlocked_at }
                : a
            ));
            continue;
          }

          // If not already unlocked, insert the new unlock
          const { error } = await supabase
            .from('user_achievements')
            .insert({
              user_id: user?.id,
              achievement_id: achievement.id
            });

          if (error) throw error;

          // If the achievement has an item reward, add it to the user's inventory
          if (achievement.item_id) {
            try {
              // First check if the user already has this item
              const { data: existingItem, error: checkItemError } = await supabase
                .from('inventory')
                .select('*')
                .eq('user_id', user?.id)
                .eq('item_id', achievement.item_id)
                .single();

              if (checkItemError && checkItemError.code !== 'PGRST116') {
                console.error('Error checking existing item:', checkItemError);
                throw checkItemError;
              }

              // If item doesn't exist, add it
              if (!existingItem) {
                const { error: inventoryError } = await supabase
                  .from('inventory')
                  .insert({
                    user_id: user?.id,
                    item_id: achievement.item_id,
                    quantity: 1
                  });

                if (inventoryError) {
                  console.error('Error adding item to inventory:', inventoryError);
                  // Log the full error details
                  console.error('Error details:', {
                    code: inventoryError.code,
                    message: inventoryError.message,
                    details: inventoryError.details,
                    hint: inventoryError.hint
                  });
                  throw inventoryError;
                }
              } else {
                // If item exists, increment quantity
                const { error: updateError } = await supabase
                  .from('inventory')
                  .update({ quantity: existingItem.quantity + 1 })
                  .eq('user_id', user?.id)
                  .eq('item_id', achievement.item_id);

                if (updateError) {
                  console.error('Error updating item quantity:', updateError);
                  throw updateError;
                }
              }
            } catch (itemError: any) {
              console.error('Error handling item reward:', itemError);
              // Continue with achievement unlock even if item handling fails
            }
          }

          // Update local state
          setAchievements(prev => prev.map(a => 
            a.id === achievement.id 
              ? { ...a, is_unlocked: true, unlocked_at: new Date().toISOString() }
              : a
          ));

          // Show unlock modal
          setUnlockedAchievement(achievement);
          setShowUnlockModal(true);
        } catch (error: any) {
          console.error('Error unlocking achievement:', error);
          // If it's a duplicate key error, just update local state
          if (error.code === '23505') {
            setAchievements(prev => prev.map(a => 
              a.id === achievement.id 
                ? { ...a, is_unlocked: true }
                : a
            ));
          }
        }
      }
    }
  };

  useEffect(() => {
    if (userStats && achievements.length > 0) {
      checkAndUnlockAchievements();
    }
  }, [userStats, achievements]);

  const fetchAchievements = async () => {
    try {
      const { data: achievementsData, error } = await supabase
        .from('achievements')
        .select(`
          *,
          items!achievements_item_id_fkey (
            name
          ),
          user_achievements!left (
            unlocked_at
          )
        `)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const achievements = achievementsData.map(achievement => ({
        ...achievement,
        is_unlocked: !!achievement.user_achievements?.[0],
        unlocked_at: achievement.user_achievements?.[0]?.unlocked_at || null,
        itemName: achievement.items?.name || null
      }));

      setAchievements(achievements);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderAchievement = ({ item }: { item: Achievement }) => {
    const isUnlocked = item.is_unlocked;
    const itemName = item.itemName;

    return (
      <ThemedView style={styles.achievementCard}>
        <View style={styles.achievementContent}>
          <View style={styles.achievementIconContainer}>
            {isUnlocked && itemName ? (
              <Image
                source={getItemImage(itemName)}
                style={styles.achievementIcon}
                resizeMode="contain"
              />
            ) : (
              <ThemedText style={styles.questionMark}>?</ThemedText>
            )}
          </View>
          <View style={styles.achievementTextContainer}>
            <ThemedText style={styles.achievementTitle}>
              {isUnlocked ? item.title : '???'}
            </ThemedText>
            <ThemedText style={styles.achievementDescription}>
              {item.description}
            </ThemedText>
            {item.item_id && (
              <ThemedText style={styles.itemUnlockText}>
                Item Unlock: {isUnlocked ? itemName : '???'}
              </ThemedText>
            )}
          </View>
        </View>
      </ThemedView>
    );
  };

  const UnlockModal = () => (
    <Modal
      visible={showUnlockModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowUnlockModal(false)}
    >
      <View style={styles.modalOverlay}>
        <ThemedView style={styles.modalContent}>
          <ThemedText style={styles.modalTitle}>Achievement Unlocked!</ThemedText>
          {unlockedAchievement && (
            <>
              <ThemedText style={styles.modalAchievementTitle}>
                {unlockedAchievement.title}
              </ThemedText>
              <ThemedText style={styles.modalDescription}>
                {unlockedAchievement.description}
              </ThemedText>
              {unlockedAchievement.item_id && (
                <View style={styles.modalItemContainer}>
                  <Image
                    source={getItemImage(unlockedAchievement.itemName || '')}
                    style={styles.modalItemImage}
                    resizeMode="contain"
                  />
                  <ThemedText style={styles.modalItemText}>New Item Unlocked!</ThemedText>
                </View>
              )}
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowUnlockModal(false)}
              >
                <ThemedText style={styles.modalButtonText}>Awesome!</ThemedText>
              </TouchableOpacity>
            </>
          )}
        </ThemedView>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading achievements...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <>
      <FlatList
        data={achievements}
        renderItem={renderAchievement}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
      <UnlockModal />
    </>
  );
}

const getStyles = (colorScheme: 'light' | 'dark') => StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  listContainer: {
    padding: 8,
  },
  achievementCard: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors[colorScheme].secondaryBackground,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  achievementContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  achievementIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors[colorScheme].secondaryBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  achievementIcon: {
    width: 40,
    height: 40,
  },
  questionMark: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors[colorScheme].text,
  },
  achievementTextContainer: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: Colors[colorScheme].placeholderText,
    marginBottom: 4,
  },
  itemUnlockText: {
    fontSize: 14,
    color: Colors[colorScheme].tint,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: Colors[colorScheme].tint,
  },
  modalAchievementTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    color: Colors[colorScheme].placeholderText,
  },
  modalItemContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalItemImage: {
    width: 80,
    height: 80,
    marginBottom: 8,
  },
  modalItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors[colorScheme].tint,
  },
  modalButton: {
    backgroundColor: Colors[colorScheme].tint,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 