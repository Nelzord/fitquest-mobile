import React, { useEffect, useState, useCallback, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, ActivityIndicator, Image, TextInput, Alert, Clipboard, Modal, Linking } from 'react-native';
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
import Constants from 'expo-constants';

// Define types for IAP
type IAPModule = typeof import('expo-in-app-purchases');
type IAPResponse = {
  responseCode: number;
  results?: Array<{
    acknowledged: boolean;
    transactionReceipt?: string;
    productId: string;
    purchaseState: number;
    purchaseTime: number;
    orderId: string;
  }>;
  errorCode?: number;
};

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
  power: number;
}

interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  requester_id: string;
  friend_name: string;
  friend_email: string;
  friend_level: number;
  friend_rank: RankInfo;
}

interface PremiumStatus {
  isActive: boolean;
  activatedDate: string | null;
  tokens: number;
}

const RANKS: RankInfo[] = [
  { name: 'Bronze', logo: require('@/assets/images/logos/bronzerank.png'), color: '#CD7F32', minXP: 0, letter: 'F', power: 0 },
  { name: 'Silver', logo: require('@/assets/images/logos/silverrank.png'), color: '#C0C0C0', minXP: 50, letter: 'D', power: 1 },
  { name: 'Gold', logo: require('@/assets/images/logos/goldrank.png'), color: '#FFD700', minXP: 150, letter: 'C', power: 2 },
  { name: 'Platinum', logo: require('@/assets/images/logos/platinumrank.png'), color: '#E5E4E2', minXP: 300, letter: 'B', power: 3 },
  { name: 'Diamond', logo: require('@/assets/images/logos/diamondrank.png'), color: '#B9F2FF', minXP: 500, letter: 'A', power: 4 },
  { name: 'Master', logo: require('@/assets/images/logos/masterrank.png'), color: '#9932CC', minXP: 700, letter: 'S', power: 5 },
  { name: 'Legend', logo: require('@/assets/images/logos/legendrank.png'), color: '#FF0000', minXP: 900, letter: 'SS', power: 6 },
];

const ITEM_POWER_LEVELS = {
  common: 5,
  uncommon: 7,
  rare: 10,
  epic: 20,
  legendary: 50
};

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
  friendsContainer: {
    flex: 1,
    padding: 16,
  },
  friendCodeSection: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors[colorScheme].background,
  },
  friendCodeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  friendCode: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  friendCodeHint: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
  addFriendSection: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 8,
  },
  friendInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors[colorScheme].borderColor,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  addFriendButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addFriendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  requestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors[colorScheme].background,
    marginBottom: 8,
  },
  friendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors[colorScheme].background,
    marginBottom: 8,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '500',
  },
  friendEmail: {
    fontSize: 14,
    opacity: 0.7,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  declineButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  friendInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  friendStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  rankIcon: {
    width: 24,
    height: 24,
  },
  friendLevel: {
    fontSize: 14,
    opacity: 0.7,
  },
  friendActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendActionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  viewProfileButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  removeFriendButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  friendCodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'center',
  },
  toggleButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  friendCodeContainer: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors[colorScheme].background,
    marginBottom: 8,
  },
  premiumCard: {
    padding: 16,
    borderRadius: 12,
    margin: 16,
    gap: 16,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 8,
  },
  benefitTextContainer: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    opacity: 0.8,
  },
  premiumButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 24,
  },
  premiumButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  powerLevelContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  powerLevelText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  friendProfileModal: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: Colors[colorScheme].cardBackground,
    borderRadius: 12,
    padding: 20,
  },
  friendProfileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  friendProfileTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  friendProfileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  friendProfileStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  friendProfileStatText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendProfileDetails: {
    marginBottom: 20,
    gap: 12,
  },
  friendProfileDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors[colorScheme].borderColor,
  },
  friendProfileDetailLabel: {
    fontSize: 16,
    opacity: 0.7,
  },
  friendProfileDetailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  muscleGroupList: {
    gap: 12,
  },
  muscleGroupListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors[colorScheme].background,
    borderRadius: 8,
  },
  muscleGroupInfoContainer: {
    gap: 4,
  },
  muscleGroupLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  muscleGroupXPValue: {
    fontSize: 14,
    opacity: 0.7,
  },
  muscleGroupRankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  muscleGroupRankLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  const [friends, setFriends] = useState<Friend[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<Friend[]>([]);
  const [newFriendId, setNewFriendId] = useState('');
  const [loadingFriends, setLoadingFriends] = useState(true);
  const isFetching = useRef(false);
  const [showFriendCode, setShowFriendCode] = useState(false);
  const [friendStats, setFriendStats] = useState<{ [key: string]: UserStats }>({});
  const [showFriendProfile, setShowFriendProfile] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [premiumStatus, setPremiumStatus] = useState<PremiumStatus | null>(null);
  const [isLoadingPurchase, setIsLoadingPurchase] = useState(false);

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

  const fetchFriends = useCallback(async () => {
    console.log('FetchFriends called with user:', user?.id);
    if (!user) {
      console.log('No user object available');
      return;
    }
    if (isFetching.current) {
      console.log('Already fetching, skipping');
      return;
    }
    
    try {
      console.log('Starting fetchFriends');
      isFetching.current = true;
      setLoadingFriends(true);
      
      // Get all friend relationships
      const { data: friendsData, error: friendsError } = await supabase
        .from('friends')
        .select('*')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

      if (friendsError) {
        console.error('Error fetching friends:', friendsError);
        throw friendsError;
      }

      console.log('Fetched friends data:', friendsData);

      if (!friendsData || friendsData.length === 0) {
        console.log('No friends data found, setting empty arrays');
        setFriends([]);
        setOutgoingRequests([]);
        setIncomingRequests([]);
        return;
      }

      // Get all friend IDs (the other user in the relationship)
      const friendIds = new Set<string>();
      friendsData.forEach((friend: any) => {
        // Add the ID that is not the current user's ID
        if (friend.user_id === user.id) {
          friendIds.add(friend.friend_id);
        } else {
          friendIds.add(friend.user_id);
        }
      });

      console.log('Friend IDs to fetch:', Array.from(friendIds));

      // Fetch friend names from users table
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name')
        .in('id', Array.from(friendIds));

      if (usersError) {
        console.error('Error fetching user names:', usersError);
        throw usersError;
      }

      // Fetch friend stats from user_stats table
      const { data: statsData, error: statsError } = await supabase
        .from('user_stats')
        .select('user_id, level, chest_xp, back_xp, legs_xp, shoulders_xp, arms_xp, core_xp, cardio_xp')
        .in('user_id', Array.from(friendIds));

      if (statsError) {
        console.error('Error fetching user stats:', statsError);
        throw statsError;
      }

      // Create a map of friend IDs to their data
      const friendMap = new Map<string, any>();

      // If no users found, create placeholder entries
      if (!usersData || usersData.length === 0) {
        // Create a map with just IDs for missing users
        Array.from(friendIds).forEach(id => {
          friendMap.set(id, {
            name: `User ${id.substring(0, 8)}...`,
            level: 1,
            rankInfo: getRankInfo(0)
          });
        });
      } else {
        // Process found users
        usersData.forEach((userData: any) => {
          const userStats = statsData?.find((stat: any) => stat.user_id === userData.id);
          
          if (userStats) {
            const avgXP = Math.floor((
              (userStats.chest_xp || 0) +
              (userStats.back_xp || 0) +
              (userStats.legs_xp || 0) +
              (userStats.shoulders_xp || 0) +
              (userStats.arms_xp || 0) +
              (userStats.core_xp || 0) +
              (userStats.cardio_xp || 0)
            ) / 7);
            const rankInfo = getRankInfo(avgXP);
            
            friendMap.set(userData.id, {
              name: userData.name,
              level: userStats.level,
              rankInfo: rankInfo
            });
          } else {
            friendMap.set(userData.id, {
              name: userData.name,
              level: 1,
              rankInfo: getRankInfo(0)
            });
          }
        });
      }

      // Format the friends data with names and stats
      const formattedFriends = friendsData.map((f: any) => {
        const friendId = f.user_id === user.id ? f.friend_id : f.user_id;
        const friendData = friendMap.get(friendId);
        
        return {
          ...f,
          friend_name: friendData?.name || `User ${friendId.substring(0, 8)}...`,
          friend_level: friendData?.level || 1,
          friend_rank: friendData?.rankInfo || getRankInfo(0)
        };
      });

      // Update state in a single batch
      setFriends(formattedFriends.filter((f: Friend) => f.status === 'accepted'));
      setOutgoingRequests(formattedFriends.filter((f: Friend) => 
        f.status === 'pending' && f.requester_id === user.id
      ));
      setIncomingRequests(formattedFriends.filter((f: Friend) => 
        f.status === 'pending' && f.requester_id !== user.id
      ));
    } catch (error) {
      console.error('Error in fetchFriends:', error);
      setFriends([]);
      setOutgoingRequests([]);
      setIncomingRequests([]);
    } finally {
      setLoadingFriends(false);
      isFetching.current = false;
    }
  }, [user?.id]);

  const fetchAllUsers = async () => {
    try {
      const { data: allUsers, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all users:', error);
        return;
      }
    } catch (err) {
      console.error('Error in fetchAllUsers:', err);
    }
  };

  // Single effect for friends
  useEffect(() => {
    console.log('Friends useEffect mounted');
    let mounted = true;

    const loadFriends = async () => {
      if (mounted) {
        console.log('Loading friends...');
        await fetchAllUsers();
        await fetchFriends();
      }
    };

    loadFriends();

    return () => {
      console.log('Friends useEffect cleanup');
      mounted = false;
    };
  }, [fetchFriends]);

  const handleAddFriend = async () => {
    if (!user || !newFriendId) return;
    
    try {
      const { error } = await supabase
        .from('friends')
        .insert({
          user_id: user.id,
          friend_id: newFriendId,
          status: 'pending',
          requester_id: user.id
        });

      if (error) throw error;
      setNewFriendId('');
      fetchFriends();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send friend request');
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (error) throw error;
      fetchFriends();
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;
      fetchFriends();
    } catch (error) {
      console.error('Error declining friend request:', error);
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', requestId);

      if (error) throw error;
      fetchFriends();
    } catch (error) {
      console.error('Error deleting friend request:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserStats();
      fetchItems();
      fetchFriends();
    }
  }, [user, fetchUserStats, fetchItems, fetchFriends]);

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

  const copyFriendCode = () => {
    if (user?.id) {
      Clipboard.setString(user.id);
      Alert.alert('Copied!', 'Your friend code has been copied to clipboard');
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

  const fetchFriendStats = async (friendId: string) => {
    if (isLoadingStats) {
      return;
    }
    
    try {
      setIsLoadingStats(true);
      
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', friendId)
        .single();

      if (error) {
        throw error;
      }
      
      setFriendStats(prev => ({
        ...prev,
        [friendId]: data
      }));
    } catch (error) {
      console.error('Error in fetchFriendStats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const FriendProfileModal = ({ friend, visible, onClose }: { friend: Friend, visible: boolean, onClose: () => void }) => {
    const [localFriendStats, setLocalFriendStats] = useState<UserStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
      if (!visible || !friend.friend_id) {
        return;
      }

      const existingStats = friendStats[friend.friend_id];
      if (existingStats) {
        setLocalFriendStats(existingStats);
        return;
      }

      if (!isLoading) {
        setIsLoading(true);
        fetchFriendStats(friend.friend_id)
          .finally(() => {
            setIsLoading(false);
          });
      }
    }, [visible, friend.friend_id]);

    useEffect(() => {
      if (friend.friend_id && friendStats[friend.friend_id]) {
        setLocalFriendStats(friendStats[friend.friend_id]);
      }
    }, [friend.friend_id, friendStats[friend.friend_id]]);

    const displayName = friend.friend_name.split('@')[0];

    if (!visible) {
      return null;
    }

    const getMuscleGroupRank = (xp: number) => {
      return RANKS.reduce((currentRank, rank) => {
        return xp >= rank.minXP ? rank : currentRank;
      }, RANKS[0]);
    };

    const muscleGroups = [
      { name: 'Chest', xp: localFriendStats?.chest_xp || 0 },
      { name: 'Back', xp: localFriendStats?.back_xp || 0 },
      { name: 'Legs', xp: localFriendStats?.legs_xp || 0 },
      { name: 'Shoulders', xp: localFriendStats?.shoulders_xp || 0 },
      { name: 'Arms', xp: localFriendStats?.arms_xp || 0 },
      { name: 'Core', xp: localFriendStats?.core_xp || 0 },
      { name: 'Cardio', xp: localFriendStats?.cardio_xp || 0 }
    ];

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.friendProfileModal}>
            <View style={styles.friendProfileHeader}>
              <ThemedText style={[styles.friendProfileTitle, { fontSize: 16 }]}>
                {displayName}'s Muscle Ranks
              </ThemedText>
              <TouchableOpacity onPress={onClose}>
                <IconSymbol name="xmark.circle.fill" size={24} color={Colors[colorScheme].text} />
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
                <ThemedText style={{ marginTop: 10 }}>Loading stats...</ThemedText>
              </View>
            ) : (
              <View style={styles.muscleGroupList}>
                {muscleGroups.map((group) => {
                  const rank = getMuscleGroupRank(group.xp);
                  return (
                    <View key={group.name} style={styles.muscleGroupListItem}>
                      <View style={styles.muscleGroupInfoContainer}>
                        <ThemedText style={styles.muscleGroupLabel}>{group.name}</ThemedText>
                      </View>
                      <View style={styles.muscleGroupRankContainer}>
                        <Image 
                          source={rank.logo} 
                          style={styles.rankIcon}
                          resizeMode="contain"
                        />
                        <ThemedText style={styles.muscleGroupRankLabel}>{rank.name}</ThemedText>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </ThemedView>
        </View>
      </Modal>
    );
  };

  const renderFriendItem = (friend: Friend, isRequest: boolean = false, isIncoming: boolean = false) => {
    const displayName = friend.friend_name.split('@')[0];
    
    return (
      <View key={friend.id} style={styles.friendItem}>
        <View style={styles.friendInfo}>
          <View>
            <ThemedText style={styles.friendName}>{displayName}</ThemedText>
            <View style={styles.friendStats}>
              <Image 
                source={friend.friend_rank?.logo} 
                style={styles.rankIcon}
                resizeMode="contain"
              />
              <ThemedText style={styles.friendLevel}>Level {friend.friend_level}</ThemedText>
            </View>
          </View>
          <View style={styles.friendActions}>
            {isRequest ? (
              <View style={styles.requestActions}>
                {isIncoming ? (
                  <>
                    <TouchableOpacity 
                      style={[styles.acceptButton, { backgroundColor: Colors[colorScheme].tint }]}
                      onPress={() => handleAcceptRequest(friend.id)}
                    >
                      <ThemedText style={styles.buttonText}>Accept</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.declineButton, { backgroundColor: Colors[colorScheme].danger }]}
                      onPress={() => handleDeclineRequest(friend.id)}
                    >
                      <ThemedText style={styles.buttonText}>Decline</ThemedText>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity 
                    style={[styles.deleteButton, { backgroundColor: Colors[colorScheme].danger }]}
                    onPress={() => handleDeleteRequest(friend.id)}
                  >
                    <ThemedText style={styles.buttonText}>Delete</ThemedText>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.friendActionButtons}>
                <TouchableOpacity 
                  style={[styles.viewProfileButton, { backgroundColor: Colors[colorScheme].tint }]}
                  onPress={() => {
                    setSelectedFriend(friend);
                    setShowFriendProfile(true);
                  }}
                >
                  <ThemedText style={styles.buttonText}>View Profile</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.removeFriendButton, { backgroundColor: Colors[colorScheme].danger }]}
                  onPress={() => handleDeleteRequest(friend.id)}
                >
                  <ThemedText style={styles.buttonText}>Remove</ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderFriendsContent = () => {
    if (loadingFriends) {
      return <ActivityIndicator size="large" color={Colors[colorScheme].tint} />;
    }

    return (
      <ScrollView style={styles.friendsContainer}>
        <View style={styles.friendCodeSection}>
          <ThemedText style={styles.friendCodeTitle}>Your Friend Code</ThemedText>
          <TouchableOpacity 
            style={styles.friendCodeContainer}
            onPress={() => {
              if (showFriendCode && user?.id) {
                Clipboard.setString(user.id);
                Alert.alert('Copied!', 'Your friend code has been copied to clipboard');
              }
            }}
          >
            <ThemedText style={styles.friendCode}>
              {showFriendCode ? user?.id : '••••••••••••••••'}
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleButton, { backgroundColor: Colors[colorScheme].tint }]}
            onPress={() => setShowFriendCode(!showFriendCode)}
          >
            <ThemedText style={styles.toggleButtonText}>
              {showFriendCode ? 'Hide Code' : 'Show Code'}
            </ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.addFriendSection}>
          <TextInput
            style={[styles.friendInput, { color: Colors[colorScheme].text }]}
            placeholder="Enter friend code"
            value={newFriendId}
            onChangeText={setNewFriendId}
            placeholderTextColor={Colors[colorScheme].text}
          />
          <TouchableOpacity 
            style={[styles.addFriendButton, { backgroundColor: Colors[colorScheme].tint }]}
            onPress={handleAddFriend}
          >
            <ThemedText style={styles.addFriendButtonText}>Add Friend</ThemedText>
          </TouchableOpacity>
        </View>

        {incomingRequests.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Incoming Requests</ThemedText>
            {incomingRequests.map(request => renderFriendItem(request, true, true))}
          </View>
        )}

        {outgoingRequests.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Outgoing Requests</ThemedText>
            {outgoingRequests.map(request => renderFriendItem(request, true, false))}
          </View>
        )}

        {friends.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Friends</ThemedText>
            {friends.map(friend => renderFriendItem(friend))}
          </View>
        )}
      </ScrollView>
    );
  };

  const calculateTotalPowerLevel = () => {
    let totalPower = 0;
    
    // Calculate power from muscle groups
    const muscleGroups = [
      { xp: userStats?.chest_xp || 0 },
      { xp: userStats?.back_xp || 0 },
      { xp: userStats?.legs_xp || 0 },
      { xp: userStats?.shoulders_xp || 0 },
      { xp: userStats?.arms_xp || 0 },
      { xp: userStats?.core_xp || 0 },
      { xp: userStats?.cardio_xp || 0 }
    ];

    muscleGroups.forEach(group => {
      const rank = getRankInfo(group.xp);
      totalPower += rank.power;
    });

    // Calculate power from equipped items
    const equippedItems = items.filter(item => item.is_equipped);
    equippedItems.forEach(item => {
      totalPower += ITEM_POWER_LEVELS[item.rarity] || 0;
    });

    return totalPower;
  };

  const renderPremiumContent = () => {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView style={styles.contentContainer}>
          <ThemedView style={styles.premiumCard}>
            <ThemedText style={styles.premiumTitle}>
              {premiumStatus?.isActive ? 'Premium Active' : 'Premium Benefits'}
            </ThemedText>
            
            {premiumStatus?.isActive ? (
              <>
                <View style={styles.benefitItem}>
                  <IconSymbol name="checkmark.circle" size={24} color={Colors[colorScheme].tint} />
                  <View style={styles.benefitTextContainer}>
                    <ThemedText style={styles.benefitTitle}>Premium Active</ThemedText>
                    <ThemedText style={styles.benefitDescription}>
                      Activated on {new Date(premiumStatus.activatedDate!).toLocaleDateString()}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.benefitItem}>
                  <IconSymbol name="star.circle" size={24} color={Colors[colorScheme].tint} />
                  <View style={styles.benefitTextContainer}>
                    <ThemedText style={styles.benefitTitle}>Tokens</ThemedText>
                    <ThemedText style={styles.benefitDescription}>
                      You have {premiumStatus.tokens} tokens
                    </ThemedText>
                  </View>
                </View>
              </>
            ) : (
              <>
                <View style={styles.benefitItem}>
                  <IconSymbol name="xmark.circle" size={24} color={Colors[colorScheme].tint} />
                  <View style={styles.benefitTextContainer}>
                    <ThemedText style={styles.benefitTitle}>No Ads</ThemedText>
                    <ThemedText style={styles.benefitDescription}>
                      Enjoy an uninterrupted workout experience without any advertisements
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.benefitItem}>
                  <IconSymbol name="star.circle" size={24} color={Colors[colorScheme].tint} />
                  <View style={styles.benefitTextContainer}>
                    <ThemedText style={styles.benefitTitle}>Double XP & Gold</ThemedText>
                    <ThemedText style={styles.benefitDescription}>
                      Earn twice the XP and gold from every workout to level up faster
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.benefitItem}>
                  <IconSymbol name="brain.head.profile" size={24} color={Colors[colorScheme].tint} />
                  <View style={styles.benefitTextContainer}>
                    <ThemedText style={styles.benefitTitle}>AI Workout Analysis</ThemedText>
                    <ThemedText style={styles.benefitDescription}>
                      Get personalized tips and analysis on your workouts from our AI
                    </ThemedText>
                  </View>
                </View>
              </>
            )}
          </ThemedView>
          
          {!premiumStatus?.isActive && (
            <TouchableOpacity 
              style={[styles.premiumButton, { backgroundColor: Colors[colorScheme].tint }]}
              onPress={handlePurchase}
              disabled={isLoadingPurchase}
            >
              {isLoadingPurchase ? (
                <ActivityIndicator color="white" />
              ) : (
                <ThemedText style={styles.premiumButtonText}>Join Premium Now</ThemedText>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    );
  };

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
              <View style={styles.powerLevelContainer}>
                <ThemedText style={styles.powerLevelText}>
                  Total Power Level: {calculateTotalPowerLevel()}
                </ThemedText>
              </View>
            </ThemedView>

            <ThemedView style={styles.statsCard}>
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
            {renderFriendsContent()}
          </View>
        );
      case 'premium':
        return renderPremiumContent();
    }
  };

  const handlePurchase = () => {
    Linking.openURL('https://buy.stripe.com/test_cN2eXL5Ewfaz9Ve144');
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
      {selectedFriend && (
        <FriendProfileModal 
          friend={selectedFriend}
          visible={showFriendProfile}
          onClose={() => {
            setShowFriendProfile(false);
            setSelectedFriend(null);
          }}
        />
      )}
    </ThemedView>
  );
} 