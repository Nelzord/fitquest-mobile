import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface ActivityChartProps {
  data: { date: string; count: number }[];
  onDayPress?: (date: string) => void;
  selectedDate?: string;
}

type SquareData = {
  date?: string;
  count?: number;
};

const { width } = Dimensions.get('window');
const PADDING = 16;
const COLUMNS = 7;
const SQUARE_GAP = 2;
const AVAILABLE_WIDTH = width - PADDING * 2;
const SQUARE_SIZE = Math.floor((AVAILABLE_WIDTH - (SQUARE_GAP * (COLUMNS - 1))) / COLUMNS) / 1.5;
const LEGEND_SQUARE_SIZE = 8;

export const ActivityChart: React.FC<ActivityChartProps> = ({
  data,
  onDayPress,
  selectedDate
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const today = new Date();

  // Generate exactly 28 days including today (no blanks)
  const past30: SquareData[] = [];
  for (let i = 0; i < 28; i++) {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0); // Set to start of day to avoid timezone issues
    date.setDate(today.getDate() - (27 - i));
    const iso = date.toISOString().split('T')[0];
    const match = data.find(d => d.date === iso);
    past30.push({ date: iso, count: match?.count || 0 });
  }

  // Final grid squares: just past30, no padding
  const squares: SquareData[] = [...past30];

  // Split into rows of 7 squares
  const rows: SquareData[][] = [];
  for (let i = 0; i < squares.length; i += 7) {
    rows.push(squares.slice(i, i + 7));
  }

  const getColor = (count?: number) => {
    if (count == null || count === 0) return '#E1E4E8';
    if (count <= 2) return '#9BE9A8';
    if (count <= 4) return '#40C463';
    if (count <= 6) return '#30A14E';
    return '#216E39';
  };

  const getTextColor = (count?: number) => {
    if (count == null || count === 0) return Colors[colorScheme].text;
    return '#FFFFFF';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 1); // Add one day to the displayed date
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Past 30 Days</ThemedText>
      </View>

      <View style={styles.chartContainer}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((item, colIndex) => (
              <TouchableOpacity
                key={`${rowIndex}-${colIndex}`}
                disabled={!item.date}
                onPress={() => item.date && onDayPress?.(item.date)}
                style={[
                  styles.square,
                  {
                    backgroundColor: getColor(item.count),
                    borderWidth: item.date && selectedDate === item.date ? 2 : 0,
                    borderColor: Colors[colorScheme].tint,
                  },
                ]}
              >
                {item.date && (
                  <ThemedText style={[styles.squareText, { color: getTextColor(item.count) }]}>
                    {formatDate(item.date)}
                  </ThemedText>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      <View style={styles.legend}>
        <ThemedText style={styles.legendText}>Less</ThemedText>
        <View style={styles.legendSquares}>
          {[0, 2, 4, 6, 8].map((count) => (
            <View
              key={count}
              style={[
                styles.legendSquare,
                { backgroundColor: getColor(count) },
              ]}
            />
          ))}
        </View>
        <ThemedText style={styles.legendText}>More</ThemedText>
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: PADDING,
    borderRadius: 12,
    marginBottom: 16,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  chartContainer: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 3,
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  square: {
    width: SQUARE_SIZE,
    height: SQUARE_SIZE,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  squareText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  legendSquares: {
    flexDirection: 'row',
    gap: 4,
  },
  legendSquare: {
    width: LEGEND_SQUARE_SIZE,
    height: LEGEND_SQUARE_SIZE,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 12,
    opacity: 0.7,
  },
});
