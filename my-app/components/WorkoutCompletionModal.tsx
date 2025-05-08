import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Modal, Animated, Easing, TouchableOpacity, Image, Text, ImageSourcePropType, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from './ui/IconSymbol';
import { generateWorkoutFeedback } from '@/lib/workoutFeedback';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';

interface WorkoutFeedback {
  overall: string;
  suggestions: string;
}

interface WorkoutCompletionModalProps {
  visible: boolean;
  onClose: () => void;
  stats: {
    totalSets: number;
    totalReps: number;
    totalVolume: number;
    xpGain: number;
    goldGain: number;
    currentLevel: number;
    newLevel: number;
    currentXP: number;
    requiredXP: number;
    itemBonuses: { name: string; effect: string }[];
    muscleGroupGains: {
      chest: { xp: number; gold: number };
      back: { xp: number; gold: number };
      legs: { xp: number; gold: number };
      shoulders: { xp: number; gold: number };
      arms: { xp: number; gold: number };
      core: { xp: number; gold: number };
      cardio: { xp: number; gold: number };
    };
    equippedItems: { name: string; image: ImageSourcePropType | null; xpBonus: { muscle_group: string; bonus: number } | null; goldBonus: { muscle_group: string; bonus: number } | null }[];
    workoutDetails: {
      name: string;
      sets: number;
      reps: number;
      weight: number;
    }[];
  };
  onFeedbackGenerated?: (feedback: { overall: string; suggestions: string }) => void;
}

type TabType = 'rewards' | 'analysis';

const WorkoutCompletionModal: React.FC<WorkoutCompletionModalProps> = ({
  visible,
  onClose,
  stats,
  onFeedbackGenerated
}) => {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const { user } = useAuth();
  const router = useRouter();
  const [progress] = useState(new Animated.Value(0));
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<WorkoutFeedback | null>(null);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('rewards');
  const [isLoadingPurchase, setIsLoadingPurchase] = useState(false);

  useEffect(() => {
    if (visible) {
      // Reset animations and states
      progress.setValue(0);
      setShowLevelUp(false);
      setAiFeedback(null);
      setIsLoadingFeedback(false);

      // Animate progress bar
      Animated.timing(progress, {
        toValue: 1,
        duration: 1500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();

      // Show level up animation if applicable
      if (stats.newLevel > stats.currentLevel) {
        setTimeout(() => setShowLevelUp(true), 1000);
      }

      // Generate AI feedback
      generateWorkoutFeedbackFromStats();
    }
  }, [visible]);

  const handleSuccessfulPurchase = async (receipt: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('premium')
        .upsert({
          user_id: user.id,
          activated_date: new Date().toISOString(),
          tokens: 100, // Initial tokens for premium users
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      Alert.alert('Success', 'Your premium subscription has been activated!');
      // Close the modal to refresh the state
      onClose();
    } catch (error) {
      console.error('Error updating premium status:', error);
      Alert.alert('Error', 'There was an error activating your premium subscription.');
    }
  };

  const handlePurchase = async () => {
    if (!user) return;

    // Show message in Expo Go
    if (Constants.appOwnership === 'expo') {
      Alert.alert(
        'Premium Not Available',
        'In-app purchases are not available in Expo Go. Please build the app to test premium features.'
      );
      return;
    }

    console.log('Starting premium purchase process...');
    setIsLoadingPurchase(true);
    try {
      console.log('Fetching product information...');
      const iapModule = await import('expo-in-app-purchases');
      const { responseCode, results } = await iapModule.getProductsAsync(['Premium']);
      
      console.log('Product fetch response:', { responseCode, results });
      
      if (responseCode === iapModule.IAPResponseCode.OK && results) {
        const product = results[0];
        if (product) {
          console.log('Initiating purchase for product:', product);
          await iapModule.purchaseItemAsync(product.productId);
        } else {
          console.log('No product found');
          Alert.alert('Error', 'Could not find premium product.');
        }
      } else {
        console.log('Error fetching product:', { responseCode });
        Alert.alert('Error', 'Could not fetch product information.');
      }
    } catch (error) {
      console.error('Error in purchase process:', error);
      Alert.alert('Error', 'There was an error processing your purchase.');
    } finally {
      setIsLoadingPurchase(false);
    }
  };

  const generateWorkoutFeedbackFromStats = async () => {
    if (!user) {
      setFeedbackError('You must be logged in to receive AI analysis.');
      return;
    }

    setIsLoadingFeedback(true);
    setFeedbackError(null);
    try {
      // Check if workout details are available
      if (!stats.workoutDetails || stats.workoutDetails.length === 0) {
        console.log('No workout details available:', stats);
        setFeedbackError('No workout details available for analysis.');
        return;
      }

      console.log('Generating feedback for workout details:', stats.workoutDetails);

      const workoutData = {
        exercises: stats.workoutDetails.map(exercise => ({
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          weight: exercise.weight
        })),
        totalVolume: stats.totalVolume,
        totalSets: stats.totalSets,
        totalReps: stats.totalReps,
        duration: 30, // Default duration
        intensity: stats.totalVolume > 10000 ? 'High' : stats.totalVolume > 5000 ? 'Medium' : 'Low'
      };

      console.log('Sending workout data to AI:', workoutData);

      const result = await generateWorkoutFeedback(workoutData, user.id);
      
      console.log('AI Feedback Result:', result);

      if (result.success) {
        if (typeof result.message === 'string') {
          const feedback = {
            overall: result.message,
            suggestions: 'No suggestions available.'
          };
          setAiFeedback(feedback);
          onFeedbackGenerated?.(feedback);
        } else {
          setAiFeedback(result.message);
          onFeedbackGenerated?.(result.message);
        }
      } else {
        setFeedbackError(typeof result.message === 'string' ? result.message : 'An error occurred');
      }
    } catch (error) {
      console.error('Error generating AI feedback:', error);
      setFeedbackError('Unable to generate AI analysis at this time.');
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', `${(stats.currentXP / stats.requiredXP) * 100}%`],
  });

  const renderMuscleGroupGains = () => {
    const muscleGroups = [
      { key: 'chest', label: 'Chest' },
      { key: 'back', label: 'Back' },
      { key: 'legs', label: 'Legs' },
      { key: 'shoulders', label: 'Shoulders' },
      { key: 'arms', label: 'Arms' },
      { key: 'core', label: 'Core' },
      { key: 'cardio', label: 'Cardio' }
    ];

    return muscleGroups.map(({ key, label }) => {
      const gains = stats.muscleGroupGains[key as keyof typeof stats.muscleGroupGains];
      if (gains.xp === 0 && gains.gold === 0) return null;

      // Find items that affect this muscle group and were actually used
      const relevantItems = stats.equippedItems.filter(item => {
        const xpBonus = item.xpBonus?.muscle_group === 'all' || item.xpBonus?.muscle_group === key;
        const goldBonus = item.goldBonus?.muscle_group === 'all' || item.goldBonus?.muscle_group === key;
        return (xpBonus && gains.xp > 0) || (goldBonus && gains.gold > 0);
      });

      return (
        <View key={key} style={styles.muscleGroupRow}>
          <View style={styles.muscleGroupHeader}>
            <ThemedText style={styles.muscleGroupLabel}>{label}</ThemedText>
          </View>
          <View style={styles.gainsRow}>
            <View style={styles.gainItem}>
              <Image source={require('@/assets/images/logos/xp.png')} style={styles.currencyIcon} />
              <ThemedText style={styles.gainText}>+{gains.xp}</ThemedText>
            </View>
            <View style={styles.gainItem}>
              <Image source={require('@/assets/images/logos/goldcoin.png')} style={styles.currencyIcon} />
              <ThemedText style={styles.gainText}>+{gains.gold}</ThemedText>
            </View>
          </View>
          {relevantItems.length > 0 && (
            <View style={styles.itemBonusRow}>
              {relevantItems.map((item, index) => (
                <View key={index} style={styles.itemBonusRow}>
                  {item.image && (
                    <Image source={item.image} style={styles.itemIcon} />
                  )}
                  <ThemedText style={styles.bonusText}>
                    (+{item.xpBonus?.bonus || item.goldBonus?.bonus}% XP from {item.name})
                  </ThemedText>
                </View>
              ))}
            </View>
          )}
        </View>
      );
    });
  };

  const TabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'rewards' && styles.activeTab]}
        onPress={() => setActiveTab('rewards')}
      >
        <IconSymbol name="trophy" size={20} color={Colors[colorScheme].text} />
        <ThemedText style={[styles.tabText, activeTab === 'rewards' && styles.activeTabText]}>
          Rewards
        </ThemedText>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'analysis' && styles.activeTab]}
        onPress={() => setActiveTab('analysis')}
      >
        <IconSymbol name="brain.head.profile" size={20} color={Colors[colorScheme].text} />
        <ThemedText style={[styles.tabText, activeTab === 'analysis' && styles.activeTabText]}>
          AI Analysis
        </ThemedText>
      </TouchableOpacity>
    </View>
  );

  const styles = StyleSheet.create({
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 15,
      color: 'white',
      marginTop: 20,
    },
    muscleGroupRow: {
      marginBottom: 15,
      padding: 10,
      backgroundColor: Colors[colorScheme].cardBackground,
      borderRadius: 10,
    },
    muscleGroupLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors[colorScheme].text,
    },
    bonusBadge: {
      position: 'absolute',
      top: -10,
      left: 16,
      backgroundColor: Colors[colorScheme].tint,
      borderRadius: 8,
      paddingHorizontal: 4,
      paddingVertical: 2,
      minWidth: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    gainText: {
      fontSize: 14,
      color: Colors[colorScheme].text,
      marginLeft: 5,
    },
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: '100%',
      height: '100%',
      backgroundColor: Colors[colorScheme].background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      paddingTop: 60,
      borderBottomWidth: 1,
      borderBottomColor: Colors[colorScheme].borderColor,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: Colors[colorScheme].text,
    },
    closeIcon: {
      padding: 8,
    },
    panelContainer: {
      flex: 1,
      backgroundColor: Colors[colorScheme].cardBackground,
      borderRadius: 12,
      overflow: 'hidden',
    },
    panelScroll: {
      flex: 1,
      padding: 16,
    },
    statsContainer: {
      marginBottom: 20,
    },
    rewardsContainer: {
      marginBottom: 20,
    },
    muscleGroupsContainer: {
      marginBottom: 20,
    },
    levelContainer: {
      marginBottom: 20,
    },
    aiFeedbackContainer: {
      flex: 1,
      padding: 16,
      backgroundColor: Colors[colorScheme].background,
      borderRadius: 8,
    },
    aiFeedbackText: {
      fontSize: 16,
      lineHeight: 24,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      gap: 12,
    },
    errorText: {
      fontSize: 16,
      color: Colors[colorScheme].danger,
      textAlign: 'center',
    },
    currencyIcon: {
      width: 20,
      height: 20,
      marginRight: 8,
    },
    statRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    statLabelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statLabel: {
      fontSize: 16,
      color: Colors[colorScheme].text,
      fontWeight: '600',
    },
    statValue: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors[colorScheme].text,
    },
    levelHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    levelText: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    xpContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    xpIcon: {
      width: 16,
      height: 16,
      marginLeft: 4,
    },
    xpText: {
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
    levelUpContainer: {
      alignItems: 'center',
      marginBottom: 20,
    },
    levelUpText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: Colors.light.tint,
    },
    newLevelText: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    muscleGroupHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    gainsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    gainItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    itemBonusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    itemIcon: {
      width: 24,
      height: 24,
      marginRight: 25,
      borderRadius: 12,
    },
    bonusText: {
      fontSize: 10,
      color: 'white',
      fontWeight: 'bold',
    },
    rewardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    rewardValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: 'white',
      marginLeft: 8,
    },
    tabBar: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: Colors[colorScheme].borderColor,
      marginBottom: 16,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      gap: 8,
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
    feedbackSection: {
      marginBottom: 24,
      backgroundColor: Colors[colorScheme].cardBackground,
      borderRadius: 8,
      padding: 16,
    },
    feedbackHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 8,
    },
    feedbackTitle: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    feedbackText: {
      fontSize: 16,
      lineHeight: 24,
      color: Colors[colorScheme].text,
    },
    suggestionText: {
      fontSize: 16,
      lineHeight: 24,
      color: Colors[colorScheme].text,
      marginBottom: 16,
    },
    workoutSummary: {
      backgroundColor: Colors[colorScheme].cardBackground,
      borderRadius: 8,
      padding: 16,
      marginTop: 20,
    },
    summaryTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 12,
    },
    exerciseRow: {
      marginBottom: 12,
    },
    exerciseName: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    exerciseDetails: {
      flexDirection: 'row',
      gap: 12,
    },
    exerciseDetail: {
      fontSize: 14,
      color: Colors[colorScheme].text,
      opacity: 0.8,
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
  });

  const StatRow = ({ label, value }: { label: string; value: number }) => {
    return (
      <View style={styles.statRow}>
        <View style={styles.statLabelContainer}>
          <ThemedText style={styles.statLabel}>{label}</ThemedText>
        </View>
        <ThemedText style={styles.statValue}>{value}</ThemedText>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <ThemedView style={styles.modalContent}>
          <View style={styles.header}>
            <ThemedText style={styles.title}>Workout Complete!</ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
              <IconSymbol name="xmark" size={24} color={Colors[colorScheme].text} />
            </TouchableOpacity>
          </View>

          <TabBar />

          <View style={styles.panelContainer}>
            {activeTab === 'rewards' ? (
              <ScrollView style={styles.panelScroll}>
                <View style={styles.statsContainer}>
                  <StatRow label="Total Sets:" value={stats.totalSets} />
                  <StatRow label="Total Reps:" value={stats.totalReps} />
                  <StatRow label="Total Volume:" value={stats.totalVolume} />
                </View>

                <View style={styles.rewardsContainer}>
                  <View style={styles.rewardRow}>
                    <Image
                      source={require('@/assets/images/logos/xp.png')}
                      style={styles.currencyIcon}
                    />
                    <ThemedText style={styles.rewardValue}>+{stats.xpGain}</ThemedText>
                  </View>
                  <View style={styles.rewardRow}>
                    <Image
                      source={require('@/assets/images/logos/goldcoin.png')}
                      style={styles.currencyIcon}
                    />
                    <ThemedText style={styles.rewardValue}>+{stats.goldGain}</ThemedText>
                  </View>
                </View>

                <View style={styles.muscleGroupsContainer}>
                  {renderMuscleGroupGains()}
                </View>

                <View style={styles.levelContainer}>
                  <View style={styles.levelHeader}>
                    <ThemedText style={styles.levelText}>Level {stats.currentLevel}</ThemedText>
                    <View style={styles.xpContainer}>
                      <ThemedText style={styles.xpText}>
                        {stats.currentXP}/{stats.requiredXP}
                      </ThemedText>
                      <Image 
                        source={require('@/assets/images/logos/xp.png')} 
                        style={styles.xpIcon}
                        resizeMode="contain"
                      />
                    </View>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <Animated.View
                      style={[
                        styles.progressBar,
                        { width: progressWidth, backgroundColor: Colors[colorScheme].tint }
                      ]}
                    />
                  </View>
                </View>

                {showLevelUp && (
                  <Animated.View
                    style={[
                      styles.levelUpContainer,
                      {
                        opacity: progress,
                        transform: [
                          {
                            scale: progress.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.8, 1],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <ThemedText style={styles.levelUpText}>Level Up!</ThemedText>
                    <ThemedText style={styles.newLevelText}>Level {stats.newLevel}</ThemedText>
                  </Animated.View>
                )}
              </ScrollView>
            ) : (
              <ScrollView style={styles.panelScroll}>
                {isLoadingFeedback ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
                    <ThemedText style={styles.loadingText}>Analyzing your workout...</ThemedText>
                  </View>
                ) : feedbackError ? (
                  <View style={styles.aiFeedbackContainer}>
                    <ScrollView>
                      <View style={styles.feedbackSection}>
                        {feedbackError === 'premium_benefits' ? (
                          <>
                            <View style={styles.feedbackHeader}>
                              <IconSymbol name="star" size={24} color={Colors[colorScheme].tint} />
                              <ThemedText style={styles.feedbackTitle}>Premium Benefits</ThemedText>
                            </View>
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
                          </>
                        ) : (
                          <>
                            <View style={styles.feedbackHeader}>
                              <IconSymbol name="exclamationmark.circle" size={24} color={Colors[colorScheme].tint} />
                              <ThemedText style={styles.feedbackTitle}>Monthly Limit Reached</ThemedText>
                            </View>
                            <ThemedText style={styles.feedbackText}>
                              {feedbackError}
                            </ThemedText>
                            <ThemedText style={styles.feedbackText}>
                              Your AI analysis requests will reset at the start of next month.
                            </ThemedText>
                          </>
                        )}
                      </View>
                    </ScrollView>
                  </View>
                ) : (
                  <View style={styles.aiFeedbackContainer}>
                    <ScrollView>
                      <View style={styles.feedbackSection}>
                        <View style={styles.feedbackHeader}>
                          <IconSymbol name="checkmark.circle" size={24} color={Colors[colorScheme].tint} />
                          <ThemedText style={styles.feedbackTitle}>Overall Performance</ThemedText>
                        </View>
                        <ThemedText style={styles.feedbackText}>
                          {aiFeedback?.overall || 'No feedback available.'}
                        </ThemedText>
                      </View>

                      <View style={styles.feedbackSection}>
                        <View style={styles.feedbackHeader}>
                          <IconSymbol name="lightbulb" size={24} color={Colors[colorScheme].tint} />
                          <ThemedText style={styles.feedbackTitle}>Suggestions</ThemedText>
                        </View>
                        <ThemedText style={styles.suggestionText}>
                          {aiFeedback?.suggestions || 'No suggestions available.'}
                        </ThemedText>
                      </View>

                      {stats.workoutDetails && stats.workoutDetails.length > 0 && (
                        <View style={styles.workoutSummary}>
                          <ThemedText style={styles.summaryTitle}>Workout Summary</ThemedText>
                          {stats.workoutDetails.map((exercise, index) => (
                            <View key={index} style={styles.exerciseRow}>
                              <ThemedText style={styles.exerciseName}>{exercise.name}</ThemedText>
                              <View style={styles.exerciseDetails}>
                                <ThemedText style={styles.exerciseDetail}>
                                  {exercise.sets} sets × {exercise.reps} reps
                                </ThemedText>
                                {exercise.weight > 0 && (
                                  <ThemedText style={styles.exerciseDetail}>
                                    @ {exercise.weight} lbs
                                  </ThemedText>
                                )}
                              </View>
                            </View>
                          ))}
                        </View>
                      )}
                    </ScrollView>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
};

export default WorkoutCompletionModal; 