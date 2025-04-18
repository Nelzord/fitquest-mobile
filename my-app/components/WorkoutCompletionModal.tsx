import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Modal, Animated, Easing, TouchableOpacity, Image } from 'react-native';
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
  };
}

export function WorkoutCompletionModal({ visible, onClose, stats }: WorkoutCompletionModalProps) {
  const colorScheme = useColorScheme() ?? 'light';
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

          <View style={styles.statsContainer}>
            <StatRow label="Total Sets" value={stats.totalSets} />
            <StatRow label="Total Reps" value={stats.totalReps} />
            <StatRow label="Total Volume" value={stats.totalVolume} />
            <View style={styles.statRow}>
              <View style={styles.statLabelContainer}>
                <Image 
                  source={require('@/assets/images/logos/xp.png')} 
                  style={styles.currencyIcon}
                  resizeMode="contain"
                />
                <ThemedText style={styles.statLabel}>XP Gained</ThemedText>
              </View>
              <ThemedText style={styles.statValue}>{stats.xpGain}</ThemedText>
            </View>
            <View style={styles.statRow}>
              <View style={styles.statLabelContainer}>
                <Image 
                  source={require('@/assets/images/logos/goldcoin.png')} 
                  style={styles.currencyIcon}
                  resizeMode="contain"
                />
                <ThemedText style={styles.statLabel}>Gold Gained</ThemedText>
              </View>
              <ThemedText style={styles.statValue}>{stats.goldGain}</ThemedText>
            </View>
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

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <ThemedText style={styles.closeButtonText}>Continue</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </View>
    </Modal>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  const colorScheme = useColorScheme() ?? 'light';
  return (
    <View style={styles.statRow}>
      <View style={styles.statLabelContainer}>
        <ThemedText style={styles.statLabel}>{label}</ThemedText>
      </View>
      <ThemedText style={styles.statValue}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  statLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 16,
    marginLeft: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
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
}); 