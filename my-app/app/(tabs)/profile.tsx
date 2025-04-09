import React from 'react';
import { StyleSheet, View, Image, TouchableOpacity, ScrollView, useColorScheme as useRNColorScheme } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol'; // Assuming IconSymbol exists
import { useRouter } from 'expo-router'; // Import useRouter
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth
import { Colors } from '@/constants/Colors'; // Import Colors
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Import for safe area

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

// Apply Theming to ProgressBar
const ProgressBar = ({ current, max }: { current: number, max: number }) => {
  const colorScheme = useRNColorScheme() ?? 'light';
  const styles = getStyles(colorScheme);
  const progress = max > 0 ? (current / max) * 100 : 0; // Prevent division by zero

  return (
    <View style={styles.progressBarContainer}>
      <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
    </View>
  );
};

// Apply Theming to Badge
const Badge = ({ name }: { name: string }) => {
  const colorScheme = useRNColorScheme() ?? 'light';
  const styles = getStyles(colorScheme);

  return (
    <View style={styles.badge}>
      {/* Consider using a themed icon color or a specific badge color */}
      <IconSymbol name="star.fill" size={30} color={Colors[colorScheme].tint} /> 
      <ThemedText style={styles.badgeText}>{name}</ThemedText>
    </View>
  );
};

export default function ProfileScreen() {
  const colorScheme = useRNColorScheme() ?? 'light';
  const styles = getStyles(colorScheme);
  const insets = useSafeAreaInsets(); // Get safe area insets
  const router = useRouter();
  const { logout, isGuest } = useAuth();

  // Add handleSignOut function
  const handleSignOut = async () => {
    try {
      await logout();
      router.replace('/(auth)/login'); // Navigate to login after logout
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Add data fetching for user profile
  // Add navigation logic for edit profile

  return (
    // Use ThemedView for background and add safe area padding
    <ThemedView style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer} // Add padding inside scroll
      >
        {/* Profile Header Section */}
        <ThemedView style={styles.profileHeader}>
          <Image source={{ uri: userData.avatarUrl }} style={styles.avatar} />
          <ThemedText type="title" style={styles.name}>{userData.name}</ThemedText>
          <ThemedText style={styles.level}>Level {userData.level}</ThemedText>
          <ProgressBar current={userData.currentXp} max={userData.maxXp} />
          <ThemedText style={styles.xpText}>{userData.currentXp} / {userData.maxXp} XP</ThemedText>
          <TouchableOpacity style={styles.editButton} onPress={() => console.log('Edit Profile Clicked')}>
            <ThemedText style={styles.editButtonText}>Edit Profile</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Stats Section */}
        <ThemedView style={styles.cardContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Stats</ThemedText>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>{userData.totalWorkouts}</ThemedText>
              <ThemedText style={styles.statLabel}>Workouts</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>{userData.currentStreak}</ThemedText>
              <ThemedText style={styles.statLabel}>Streak</ThemedText>
            </View>
          </View>
        </ThemedView>

        {/* Badges Section */}
        <ThemedView style={styles.cardContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Badges</ThemedText>
          <View style={styles.badgesGrid}>
            {userData.badges.map((badge, index) => (
              <Badge key={index} name={badge} />
            ))}
          </View>
        </ThemedView>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <ThemedText style={styles.signOutText}>
            Sign Out {isGuest ? '(Guest)' : ''}
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

// Function to generate styles based on color scheme
const getStyles = (colorScheme: 'light' | 'dark') => StyleSheet.create({
  container: {
    flex: 1,
    // Background color applied by ThemedView
  },
  scrollContainer: {
     paddingHorizontal: 15, // Add horizontal padding to content
     paddingBottom: 20, // Extra padding at the bottom of scroll content
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 30, // More vertical padding
    marginBottom: 20, // Space below header
    // Removed border - use cards for separation
  },
  avatar: {
    width: 110, // Slightly larger avatar
    height: 110,
    borderRadius: 55,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: Colors[colorScheme].tint, // Accent border
  },
  name: {
    marginBottom: 8,
    fontSize: 22, // Larger name
    fontWeight: 'bold',
  },
  level: {
    fontSize: 16,
    color: Colors[colorScheme].placeholderText, // Muted color
    marginBottom: 15,
  },
  progressBarContainer: {
    height: 8,
    width: '70%',
    backgroundColor: Colors[colorScheme].secondaryBackground, // Themed background
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors[colorScheme].tint, // Use theme tint color
    borderRadius: 4,
  },
  xpText: {
    fontSize: 13,
    color: Colors[colorScheme].placeholderText, // Muted color
    marginBottom: 20,
  },
  editButton: {
    backgroundColor: Colors[colorScheme].buttonSecondary, // Use secondary button style
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20, // More rounded
  },
  editButtonText: {
    color: Colors[colorScheme].buttonTextSecondary, // Use themed text
    fontWeight: 'bold',
    fontSize: 14,
  },
  cardContainer: { // New style for card sections
    backgroundColor: Colors[colorScheme].cardBackground,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000', // Optional shadow for depth
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: colorScheme === 'dark' ? 0.4 : 0.1,
    shadowRadius: 3,
    elevation: 3, // Android shadow
  },
  statsContainer: { // Remove old container style
    // padding: 20,
    // borderBottomWidth: 1,
    // borderBottomColor: Colors[colorScheme].borderColor,
  },
  badgesContainer: { // Remove old container style
    // padding: 20,
  },
  sectionTitle: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: Colors[colorScheme].text, // Use themed text
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 26, // Larger stat value
    fontWeight: 'bold',
    marginBottom: 5,
    color: Colors[colorScheme].text,
  },
  statLabel: {
    fontSize: 14,
    color: Colors[colorScheme].placeholderText, // Muted color
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20, // Increased gap
  },
  badge: {
    alignItems: 'center',
    width: 70, // Adjusted size
  },
  badgeText: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
    color: Colors[colorScheme].placeholderText, // Muted color
  },
  signOutButton: {
    backgroundColor: Colors[colorScheme].danger, // Use themed danger color
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 15, // Match horizontal padding of scroll view
    marginTop: 10, // Space above sign out
    marginBottom: 10, // Space below sign out
  },
  signOutText: {
    color: 'white', // Keep sign out text white for contrast
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 