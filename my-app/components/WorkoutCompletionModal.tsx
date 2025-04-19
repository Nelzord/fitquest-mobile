import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Modal, Animated, Easing, TouchableOpacity, Image, Text, ImageSourcePropType, ScrollView } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from './ui/IconSymbol';

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
  };
}

const WorkoutCompletionModal: React.FC<WorkoutCompletionModalProps> = ({
  visible,
  onClose,
  stats
}) => {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const [progress] = useState(new Animated.Value(0));
  const [showLevelUp, setShowLevelUp] = useState(false);

  useEffect(() => {
    if (visible) {
      // Reset animations
      progress.setValue(0);
      setShowLevelUp(false);

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
    }
  }, [visible]);

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
      width: '90%',
      maxWidth: 400,
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
      maxHeight: '80%',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginRight: 10,
    },
    statsContainer: {
      width: '100%',
      padding: 15,
      backgroundColor: Colors[colorScheme].cardBackground,
      borderRadius: 10,
    },
    rewardsContainer: {
      width: '100%',
      padding: 15,
      backgroundColor: Colors[colorScheme].cardBackground,
      borderRadius: 10,
    },
    rewardsTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 10,
      color: '#333'
    },
    rewardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    rewardLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: '#555',
      marginRight: 8
    },
    rewardValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: 'white',
      marginLeft: 8,
    },
    muscleGroupsContainer: {
      width: '100%',
      padding: 15,
      backgroundColor: Colors[colorScheme].cardBackground,
      borderRadius: 10,
      marginBottom: 30,
    },
    muscleGroupHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    itemIconsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    itemIconContainer: {
      marginLeft: 8,
      position: 'relative',
    },
    itemIcon: {
      width: 24,
      height: 24,
      marginRight: 25,
      borderRadius: 12,
    },
    itemIconWrapper: {
      width: 32,
      height: 32,
      marginLeft: 4,
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    bonusText: {
      fontSize: 10,
      color: 'white',
      fontWeight: 'bold',
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
    scrollContent: {
      width: '100%',
    },
    levelContainer: {
      width: '100%',
      marginBottom: 20,
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
    closeButton: {
      backgroundColor: Colors.light.tint,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    closeButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
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
            <IconSymbol name="trophy" size={32} color={Colors[colorScheme].tint} />
          </View>

          <ScrollView style={styles.scrollContent}>
            <ThemedText style={styles.sectionTitle}>Workout Stats</ThemedText>
            <View style={styles.statsContainer}>
              <StatRow label="Total Sets:" value={stats.totalSets} />
              <StatRow label="Total Reps:" value={stats.totalReps} />
              <StatRow label="Total Volume:" value={stats.totalVolume} />
            </View>

            <ThemedText style={styles.sectionTitle}>Rewards</ThemedText>
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

            <ThemedText style={styles.sectionTitle}>Muscle Group Gains</ThemedText>
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

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <ThemedText style={styles.closeButtonText}>Continue</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </View>
    </Modal>
  );
};

export default WorkoutCompletionModal; 