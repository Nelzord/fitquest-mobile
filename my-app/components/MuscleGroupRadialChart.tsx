import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { ThemedText } from './ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import Svg, { Path, Text as SvgText } from 'react-native-svg';

interface MuscleGroupRadialChartProps {
  muscleGroups: {
    name: string;
    xp: number;
  }[];
}

// XP needed for each rank is now halved
const MAX_XP = 1000;
const MIN_RADIUS = 20;
const MIN_LABEL_RADIUS = 40;

const RANKS = ['F', 'D', 'C', 'B', 'A', 'S', 'SS'];
const RANK_COLORS = {
  F: '#FF0000',
  D: '#FF6B00',
  C: '#FFD700',
  B: '#00FF00',
  A: '#00BFFF',
  S: '#9400D3',
  SS: '#FF00FF',
};

const getRank = (xp: number): string => {
  if (xp >= 900) return 'SS';
  if (xp >= 700) return 'S';
  if (xp >= 500) return 'A';
  if (xp >= 300) return 'B';
  if (xp >= 150) return 'C';
  if (xp >= 50) return 'D';
  return 'F';
};

const polarToCartesian = (cx: number, cy: number, r: number, angleRad: number) => {
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
};

export function MuscleGroupRadialChart({ muscleGroups }: MuscleGroupRadialChartProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const { width } = Dimensions.get('window');
  const chartSize = width * 0.95;
  const center = chartSize / 2;
  const maxRadius = center * 0.85;
  const sliceSpacing = 0.06;

  const arcAngle = (2 * Math.PI) / muscleGroups.length - sliceSpacing;

  return (
    <View style={styles.container}>
      <Svg width={chartSize} height={chartSize}>
        {muscleGroups.map((group, index) => {
          const rank = getRank(group.xp);
          const percentage = group.xp / MAX_XP;
          const outerRadius = Math.max(maxRadius * percentage, MIN_RADIUS);

          const baseAngle = (index * 2 * Math.PI) / muscleGroups.length;
          const startAngle = baseAngle - arcAngle / 2 - Math.PI / 2;
          const endAngle = baseAngle + arcAngle / 2 - Math.PI / 2;

          const start = polarToCartesian(center, center, outerRadius, startAngle);
          const end = polarToCartesian(center, center, outerRadius, endAngle);

          const largeArcFlag = arcAngle > Math.PI ? 1 : 0;

          const pathData = [
            `M ${center} ${center}`,
            `L ${start.x} ${start.y}`,
            `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
            `Z`,
          ].join(' ');

          const labelAngle = baseAngle - Math.PI / 2;
          const labelRadius = Math.max(outerRadius, MIN_LABEL_RADIUS) + 60;
          const labelPos = polarToCartesian(center, center, labelRadius, labelAngle);

          const shortLabel = group.name;

          return (
            <React.Fragment key={group.name}>
              <Path d={pathData} fill={RANK_COLORS[rank as keyof typeof RANK_COLORS]} />

              {/* Muscle group label */}
              <SvgText
                x={labelPos.x}
                y={labelPos.y - 18}
                textAnchor="middle"
                fill={Colors[colorScheme].text}
                fontSize="9"
                fontWeight="bold"
              >
                {shortLabel}
              </SvgText>

              {/* XP number */}
              <SvgText
                x={labelPos.x}
                y={labelPos.y - 2}
                textAnchor="middle"
                fill={RANK_COLORS[rank as keyof typeof RANK_COLORS]}
                fontSize="11"
                fontWeight="bold"
              >
                {group.xp}
              </SvgText>

              {/* XP label */}
              <SvgText
                x={labelPos.x}
                y={labelPos.y + 10}
                textAnchor="middle"
                fill={RANK_COLORS[rank as keyof typeof RANK_COLORS]}
                fontSize="10"
                fontWeight="bold"
              >
                XP
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>

      <View style={styles.legend}>
        {RANKS.map((rank) => (
          <View key={rank} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: RANK_COLORS[rank as keyof typeof RANK_COLORS] }]} />
            <ThemedText style={styles.legendText}>{rank}</ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 16,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});
