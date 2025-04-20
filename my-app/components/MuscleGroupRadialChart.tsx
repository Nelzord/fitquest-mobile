import React, { useState } from 'react';
import { View, StyleSheet, Image, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { ThemedText } from './ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from './ui/IconSymbol';

interface MuscleGroupRadialChartProps {
  muscleGroups: {
    name: string;
    xp: number;
  }[];
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
  { name: 'Master', logo: require('@/assets/images/logos/masterrank.png'), color: '#FF4500', minXP: 700, letter: 'S' },
  { name: 'Legend', logo: require('@/assets/images/logos/legendrank.png'), color: '#FF0000', minXP: 900, letter: 'SS' },
];

const getRankInfo = (xp: number): RankInfo => {
  return RANKS.reduce((currentRank, rank) => {
    return xp >= rank.minXP ? rank : currentRank;
  }, RANKS[0]);
};

export function MuscleGroupRadialChart({ muscleGroups }: MuscleGroupRadialChartProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const [showRankInfo, setShowRankInfo] = useState(false);

  // Sort muscle groups by XP in descending order
  const sortedMuscleGroups = [...muscleGroups].sort((a, b) => b.xp - a.xp);

  // Calculate average XP
  const averageXP = Math.floor(
    muscleGroups.reduce((sum, group) => sum + group.xp, 0) / muscleGroups.length
  );
  const averageRank = getRankInfo(averageXP);

  const RankInfoModal = () => (
    <Modal
      visible={showRankInfo}
      transparent
      animationType="fade"
      onRequestClose={() => setShowRankInfo(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: Colors[colorScheme].background }]}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Rank Requirements</ThemedText>
            <TouchableOpacity onPress={() => setShowRankInfo(false)}>
              <IconSymbol name="xmark.circle.fill" size={24} color={Colors[colorScheme].text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.rankList}>
            {RANKS.map((rank) => (
              <View key={rank.name} style={styles.rankItem}>
                <Image source={rank.logo} style={styles.rankLogo} resizeMode="contain" />
                <View style={styles.rankDetails}>
                  <ThemedText style={styles.rankName}>{rank.name}</ThemedText>
                  <ThemedText style={styles.rankRequirement}>
                    {rank.minXP} - {rank.minXP + 199} XP
                  </ThemedText>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Muscle Group Progress</ThemedText>
        <TouchableOpacity onPress={() => setShowRankInfo(true)}>
          <IconSymbol name="info.circle" size={24} color={Colors[colorScheme].text} />
        </TouchableOpacity>
      </View>

      <View style={styles.averageRankContainer}>
        <Image source={averageRank.logo} style={styles.averageRankLogo} resizeMode="contain" />
        <View style={styles.averageRankInfo}>
          <ThemedText style={styles.averageRankLabel}>Average Rank</ThemedText>
          <ThemedText style={[styles.averageRankName, { color: averageRank.color }]}>
            {averageRank.name}
          </ThemedText>
        </View>
      </View>

      <View style={styles.muscleGroupsList}>
        {sortedMuscleGroups.map((group) => {
          const rankInfo = getRankInfo(group.xp);
          return (
            <View key={group.name} style={styles.muscleGroupItem}>
              <View style={styles.muscleGroupInfo}>
                <Image 
                  source={rankInfo.logo} 
                  style={styles.rankLogo}
                  resizeMode="contain"
                />
                <ThemedText style={styles.muscleGroupName}>{group.name}</ThemedText>
              </View>
              <View style={styles.xpContainer}>
                <ThemedText style={[styles.xpText, { color: rankInfo.color }]}>
                  {group.xp} XP
                </ThemedText>
                <ThemedText style={[styles.rankText, { color: rankInfo.color }]}>
                  {rankInfo.name}
                </ThemedText>
              </View>
            </View>
          );
        })}
      </View>

      <RankInfoModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  averageRankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  averageRankLogo: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  averageRankInfo: {
    flex: 1,
  },
  averageRankLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  averageRankName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  muscleGroupsList: {
    gap: 12,
  },
  muscleGroupItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
  },
  muscleGroupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankLogo: {
    width: 24,
    height: 24,
  },
  muscleGroupName: {
    fontSize: 16,
    fontWeight: '600',
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  xpText: {
    fontSize: 14,
    fontWeight: '500',
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  rankList: {
    gap: 12,
  },
  rankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
  },
  rankDetails: {
    marginLeft: 12,
  },
  rankName: {
    fontSize: 16,
    fontWeight: '600',
  },
  rankRequirement: {
    fontSize: 14,
    opacity: 0.7,
  },
});
