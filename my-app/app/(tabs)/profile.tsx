import React, { useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useColorScheme } from '@/hooks/useColorScheme';

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
}

// Placeholder data
const userData = {
  name: 'John Doe',
  level: 15,
  currentXp: 650,
  maxXp: 1000,
  avatarUrl: 'https://via.placeholder.com/100', // Replace with actual avatar URL or local asset
  totalWorkouts: 58,
  currentStreak: 12,
  badges: ['Badge1', 'Badge2', 'Badge3'],
};

export default function ProfileScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout, isGuest, user } = useAuth();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
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
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
      </ThemedView>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.contentContainer}
    >
      <ThemedView style={styles.header}>
        <View style={styles.profileInfo}>
          <ThemedText style={styles.name}>{user?.email?.split('@')[0] || 'User'}</ThemedText>
          <ThemedText style={styles.email}>{user?.email}</ThemedText>
        </View>
      </ThemedView>

      <ThemedView style={styles.statsCard}>
        <View style={styles.levelContainer}>
          <ThemedText style={styles.levelText}>Level {userStats?.level || 1}</ThemedText>
          <View style={styles.xpContainer}>
            <IconSymbol name="star.fill" size={16} color={Colors[colorScheme].tint} />
            <ThemedText style={styles.xpText}>
              {userStats?.xp || 0} / {calculateRequiredXP(userStats?.level || 1)} XP
            </ThemedText>
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
        <View style={styles.currencyContainer}>
          <View style={styles.currencyItem}>
            <IconSymbol name="dollarsign.circle.fill" size={24} color={Colors[colorScheme].tint} />
            <ThemedText style={styles.currencyText}>{userStats?.gold || 0}</ThemedText>
          </View>
        </View>
      </ThemedView>

      <ThemedView style={styles.statsCard}>
        <ThemedText style={styles.sectionTitle}>Muscle Group Progress</ThemedText>
        <View style={styles.muscleGroupContainer}>
          <MuscleGroupItem 
            name="Chest" 
            xp={userStats?.chest_xp || 0} 
            icon="figure.arms.open" 
          />
          <MuscleGroupItem 
            name="Back" 
            xp={userStats?.back_xp || 0} 
            icon="figure.arms.open" 
          />
          <MuscleGroupItem 
            name="Legs" 
            xp={userStats?.legs_xp || 0} 
            icon="figure.walk" 
          />
          <MuscleGroupItem 
            name="Shoulders" 
            xp={userStats?.shoulders_xp || 0} 
            icon="figure.arms.open" 
          />
          <MuscleGroupItem 
            name="Arms" 
            xp={userStats?.arms_xp || 0} 
            icon="figure.arms.open" 
          />
          <MuscleGroupItem 
            name="Core" 
            xp={userStats?.core_xp || 0} 
            icon="figure.core.training" 
          />
          <MuscleGroupItem 
            name="Cardio" 
            xp={userStats?.cardio_xp || 0} 
            icon="figure.run" 
          />
        </View>
      </ThemedView>

      <TouchableOpacity 
        style={[styles.signOutButton, { backgroundColor: Colors[colorScheme].danger }]} 
        onPress={handleSignOut}
      >
        <ThemedText style={styles.signOutText}>
          Sign Out {isGuest ? '(Guest)' : ''}
        </ThemedText>
      </TouchableOpacity>
    </ScrollView>
  );
}

function MuscleGroupItem({ name, xp, icon }: { name: string; xp: number; icon: string }) {
  const colorScheme = useColorScheme() ?? 'light';
  return (
    <View style={styles.muscleGroupItem}>
      <View style={styles.muscleGroupHeader}>
        <IconSymbol name={icon as any} size={20} color={Colors[colorScheme].tint} />
        <ThemedText style={styles.muscleGroupName}>{name}</ThemedText>
      </View>
      <View style={styles.xpContainer}>
        <IconSymbol name="star.fill" size={16} color={Colors[colorScheme].tint} />
        <ThemedText style={styles.xpText}>{xp}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  profileInfo: {
    alignItems: 'center',
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
  },
  xpText: {
    marginLeft: 4,
    fontSize: 16,
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
}); 