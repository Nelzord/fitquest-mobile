import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, ActivityIndicator, Image, TextInput } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Avatar } from '@/components/Avatar';
import { MuscleGroupRadialChart } from '@/components/MuscleGroupRadialChart';
import { Ionicons } from '@expo/vector-icons';
import { EquippedItems } from '@/components/EquippedItems';

interface UserStats {
  user_id: string;
  gold: number;
  xp: number;
  level: number;
  chest_xp: number;
  back_xp: number;
  legs_xp: number;
  shoulders_xp: number;
  arms_xp: number;
  core_xp: number;
  cardio_xp: number;
  last_updated: string;
  total_workouts: number;
  total_exercises: number;
  total_sets: number;
  total_reps: number;
  total_weight: number;
  total_duration: number;
  muscle_groups: {
    [key: string]: {
      xp: number;
      level: number;
    };
  };
}

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

interface RankInfo {
  name: string;
  logo: any;
  color: string;
  minXP: number;
  letter: string;
}

const RANKS: RankInfo[] = [
  { name: 'Bronze', logo: require('@/assets/images/logos/bronzerank.png'), color: '#CD7F32', minXP: 0, letter: 'F' },
  { name: 'Silver', logo: require('@/assets/images/logos/silverrank.png'), color: '#C0C0C0', minXP: 50, letter: 'D' },
  { name: 'Gold', logo: require('@/assets/images/logos/goldrank.png'), color: '#FFD700', minXP: 150, letter: 'C' },
  { name: 'Platinum', logo: require('@/assets/images/logos/platinumrank.png'), color: '#E5E4E2', minXP: 300, letter: 'B' },
  { name: 'Diamond', logo: require('@/assets/images/logos/diamondrank.png'), color: '#B9F2FF', minXP: 500, letter: 'A' },
  { name: 'Master', logo: require('@/assets/images/logos/masterrank.png'), color: '#9932CC', minXP: 700, letter: 'S' },
  { name: 'Legend', logo: require('@/assets/images/logos/legendrank.png'), color: '#FF0000', minXP: 900, letter: 'SS' },
];

const getRankInfo = (xp: number): RankInfo => {
  return RANKS.reduce((currentRank, rank) => {
    return xp >= rank.minXP ? rank : currentRank;
  }, RANKS[0]);
};

type ProfileTab = 'profile' | 'friends' | 'premium';

const getStyles = (colorScheme: 'light' | 'dark') => StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 8,
  },
  header: {
    padding: 0,
    borderRadius: 12,
    marginBottom: 8,
  },
  profileInfo: {
    alignItems: 'center',
    paddingTop: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    opacity: 0.7,
  },
  statsCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  levelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  xpIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  xpText: {
    fontSize: 14,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  currencyContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
  },
  currencyText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  muscleGroupContainer: {
    gap: 12,
  },
  muscleGroupItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  muscleGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  muscleGroupName: {
    fontSize: 16,
    marginLeft: 8,
  },
  signOutButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 10,
  },
  signOutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  avatarSection: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 400,
    overflow: 'hidden',
    marginBottom: 16,
    borderRadius: 12,
  },
  avatar: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    gap: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    padding: 8,
    borderRadius: 8,
  },
  statText: {
    fontSize: 16,
    fontWeight: '500',
  },
  avatarContainer: {
    position: 'relative',
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  equippedItems: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  currencyIcon: {
    width: 20,
    height: 20,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors[colorScheme].borderColor,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors[colorScheme].tint,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabText: {
    color: Colors[colorScheme].tint,
    fontWeight: '600',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors[colorScheme].borderColor,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nameInput: {
    fontSize: 24,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: Colors[colorScheme].tint,
    paddingVertical: 4,
    minWidth: 100,
  },
  editButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: Colors[colorScheme].tint,
  },
  editButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default function ProfileScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout, user } = useAuth();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [activeTab, setActiveTab] = useState<ProfileTab>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.email?.split('@')[0] || 'User');
  const styles = getStyles(colorScheme);

  const fetchItems = useCallback(async () => {
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
        const inventoryItem = userInventory.find((ui: { item_id: number }) => ui.item_id === item.id);
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
  }, [user]);

  const fetchUserStats = useCallback(async () => {
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
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUserStats();
      fetchItems();
    }
  }, [user, fetchUserStats, fetchItems]);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchItems();
      }
    }, [user, fetchItems])
  );

  const calculateRequiredXP = (level: number) => {
    return Math.floor(100 * Math.pow(level, 1.5));
  };

  const getProgressPercentage = (currentXP: number, level: number) => {
    const requiredXP = calculateRequiredXP(level);
    return (currentXP / requiredXP) * 100;
  };

  const handleSignOut = async () => {
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleSaveName = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: displayName,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating display name:', error);
    }
  };

  const TabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
        onPress={() => setActiveTab('profile')}
      >
        <IconSymbol name="person" size={20} color={Colors[colorScheme].text} />
        <ThemedText style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>
          Profile
        </ThemedText>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
        onPress={() => setActiveTab('friends')}
      >
        <IconSymbol name="person.2" size={20} color={Colors[colorScheme].text} />
        <ThemedText style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
          Friends
        </ThemedText>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'premium' && styles.activeTab]}
        onPress={() => setActiveTab('premium')}
      >
        <IconSymbol name="star" size={20} color={Colors[colorScheme].text} />
        <ThemedText style={[styles.tabText, activeTab === 'premium' && styles.activeTabText]}>
          Premium
        </ThemedText>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <ScrollView 
            style={[styles.container, { paddingTop: insets.top }]}
            contentContainerStyle={[styles.contentContainer, { paddingBottom: 100 }]}
          >
            <ThemedView style={styles.header}>
              <View style={styles.profileInfo}>
                <View style={styles.nameContainer}>
                  {isEditing ? (
                    <TextInput
                      style={[styles.nameInput, { color: Colors[colorScheme].text }]}
                      value={displayName}
                      onChangeText={setDisplayName}
                      autoFocus
                    />
                  ) : (
                    <ThemedText style={styles.name}>{displayName}</ThemedText>
                  )}
                  <TouchableOpacity 
                    onPress={isEditing ? handleSaveName : () => setIsEditing(true)}
                    style={styles.editButton}
                  >
                    <ThemedText style={styles.editButtonText}>
                      {isEditing ? 'Save' : 'Edit'}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Image 
                      source={getRankInfo(
                        Math.floor((
                          (userStats?.chest_xp || 0) +
                          (userStats?.back_xp || 0) +
                          (userStats?.legs_xp || 0) +
                          (userStats?.shoulders_xp || 0) +
                          (userStats?.arms_xp || 0) +
                          (userStats?.core_xp || 0) +
                          (userStats?.cardio_xp || 0)
                        ) / 7)
                      ).logo} 
                      style={styles.currencyIcon}
                      resizeMode="contain"
                    />
                    <ThemedText style={styles.statText}>
                      {getRankInfo(
                        Math.floor((
                          (userStats?.chest_xp || 0) +
                          (userStats?.back_xp || 0) +
                          (userStats?.legs_xp || 0) +
                          (userStats?.shoulders_xp || 0) +
                          (userStats?.arms_xp || 0) +
                          (userStats?.core_xp || 0) +
                          (userStats?.cardio_xp || 0)
                        ) / 7)
                      ).name}
                    </ThemedText>
                  </View>
                  <View style={styles.statItem}>
                    <Image 
                      source={require('@/assets/images/logos/xp.png')} 
                      style={styles.currencyIcon}
                      resizeMode="contain"
                    />
                    <ThemedText style={styles.statText}>
                      {userStats?.xp || 0}
                    </ThemedText>
                  </View>
                  <View style={styles.statItem}>
                    <Image 
                      source={require('@/assets/images/logos/goldcoin.png')} 
                      style={styles.currencyIcon}
                      resizeMode="contain"
                    />
                    <ThemedText style={styles.statText}>
                      {userStats?.gold || 0}
                    </ThemedText>
                  </View>
                </View>
              </View>
            </ThemedView>

            <ThemedView style={styles.avatarSection}>
              <View style={styles.avatarContainer}>
                <EquippedItems items={items} style={styles.equippedItems} />
                <Avatar 
                  size={300}
                  style={styles.avatar}
                />
              </View>
            </ThemedView>

            <ThemedView style={styles.statsCard}>
              <View style={styles.levelContainer}>
                <ThemedText style={styles.levelText}>Level {userStats?.level || 0}</ThemedText>
                <View style={styles.xpContainer}>
                  <ThemedText style={styles.xpText}>
                    {userStats?.xp || 0}/{calculateRequiredXP(userStats?.level || 1)}
                  </ThemedText>
                  <Image 
                    source={require('@/assets/images/logos/xp.png')} 
                    style={styles.xpIcon}
                    resizeMode="contain"
                  />
                </View>
              </View>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar,
                    { 
                      width: `${getProgressPercentage(userStats?.xp || 0, userStats?.level || 1)}%`,
                      backgroundColor: Colors[colorScheme].tint
                    }
                  ]} 
                />
              </View>
            </ThemedView>

            <ThemedView style={styles.statsCard}>
              <ThemedText style={styles.sectionTitle}>Muscle Group Progress</ThemedText>
              <MuscleGroupRadialChart 
                muscleGroups={[
                  { name: 'Arms', xp: userStats?.arms_xp || 0 },
                  { name: 'Back', xp: userStats?.back_xp || 0 },
                  { name: 'Cardio', xp: userStats?.cardio_xp || 0 },
                  { name: 'Chest', xp: userStats?.chest_xp || 0 },
                  { name: 'Core', xp: userStats?.core_xp || 0 },
                  { name: 'Legs', xp: userStats?.legs_xp || 0 },
                  { name: 'Shoulders', xp: userStats?.shoulders_xp || 0 }
                ]} 
              />
            </ThemedView>

            <TouchableOpacity 
              style={[styles.signOutButton, { backgroundColor: Colors[colorScheme].danger }]} 
              onPress={handleSignOut}
            >
              <ThemedText style={styles.signOutText}>
                Sign Out
              </ThemedText>
            </TouchableOpacity>
          </ScrollView>
        );
      case 'friends':
        return (
          <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.historyHeader}>
              <ThemedText style={styles.title}>Friends</ThemedText>
            </View>
            <ThemedText>Friends feature coming soon!</ThemedText>
          </View>
        );
      case 'premium':
        return (
          <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.historyHeader}>
              <ThemedText style={styles.title}>Premium</ThemedText>
            </View>
            <ThemedText>Premium features coming soon!</ThemedText>
          </View>
        );
    }
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <TabBar />
      {renderContent()}
    </ThemedView>
  );
} 