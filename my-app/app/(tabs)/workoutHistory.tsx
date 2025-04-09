import React, { useState } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, Modal, Button, useColorScheme as useRNColorScheme } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Link } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';
// Placeholder data - replace with actual data fetching
const mockWorkouts = [
  { id: '1', date: '2024-07-20', totalVolume: 1500, duration: '00:45:30', exercises: [{ name: 'Bench Press', sets: 3, reps: 8, weight: 100 }, { name: 'Squat', sets: 4, reps: 10, weight: 150 }] },
  { id: '2', date: '2024-07-18', totalVolume: 1200, duration: '00:35:10', exercises: [{ name: 'Deadlift', sets: 1, reps: 5, weight: 200 }, { name: 'Overhead Press', sets: 3, reps: 10, weight: 70 }] },
  // Add more mock workouts
];

interface Workout {
  id: string;
  date: string;
  totalVolume: number;
  duration: string;
  exercises: { name: string; sets: number; reps: number; weight: number }[];
}

const WorkoutItem = ({ item }: { item: Workout }) => {
  const colorScheme = useRNColorScheme() ?? 'light';
  const styles = getStyles(colorScheme);
  return (
    <Link href={{ pathname: "/(tabs)/workoutDetail", params: { workoutId: item.id } }} asChild>
      <TouchableOpacity style={styles.workoutItem}>
        <View>
          <ThemedText style={styles.itemDate}>{item.date}</ThemedText>
          <ThemedText style={styles.itemDuration}>Duration: {item.duration}</ThemedText>
        </View>
        <ThemedText style={styles.itemVolume}>{item.totalVolume} kg</ThemedText>
        <IconSymbol name="chevron.right" size={18} color={Colors[colorScheme].placeholderText} />
      </TouchableOpacity>
    </Link>
  );
};

const FilterModal = ({ visible, onClose, onApplyFilters }: { visible: boolean, onClose: () => void, onApplyFilters: (filters: any) => void }) => {
  const colorScheme = useRNColorScheme() ?? 'light';
  const styles = getStyles(colorScheme);
  // Add state for filters here if implementing fully

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <ThemedView style={styles.modalView}>
          <ThemedText type="subtitle" style={styles.modalText}>Filter Options</ThemedText>
          
          <View style={styles.filterInputGroup}>
             <ThemedText style={styles.filterLabel}>Date Range:</ThemedText>
             {/* Placeholder - Add Date Picker component here */}
             <ThemedText style={styles.filterPlaceholder}>Coming Soon!</ThemedText>
          </View>
          <View style={styles.filterInputGroup}>
             <ThemedText style={styles.filterLabel}>Exercise Name:</ThemedText>
             {/* Placeholder - Add Text Input component here */}
             <ThemedText style={styles.filterPlaceholder}>Coming Soon!</ThemedText>
          </View>
          
          <View style={styles.modalButtonContainer}>
            <TouchableOpacity style={[styles.modalButton, styles.applyButton]} onPress={() => { onApplyFilters({}); onClose(); }}>
               <ThemedText style={styles.applyButtonText}>Apply</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, styles.closeButton]} onPress={onClose}>
               <ThemedText style={styles.closeButtonText}>Close</ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
};

export default function WorkoutHistoryScreen() {
  const colorScheme = useRNColorScheme() ?? 'light';
  const styles = getStyles(colorScheme);
  const insets = useSafeAreaInsets();
  const [workouts, setWorkouts] = useState(mockWorkouts);
  const [filteredWorkouts, setFilteredWorkouts] = useState(mockWorkouts);
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);

  // Add data fetching logic here

  const applyFilters = (filters: any) => {
    // Implement filter logic based on selected filters
    console.log('Applying filters:', filters);
    // For now, just resetting to all workouts
    setFilteredWorkouts(workouts);
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.headerContainer}>
        <ThemedText type="title" style={styles.title}>History</ThemedText>
        <TouchableOpacity style={styles.filterButton} onPress={() => setFilterModalVisible(true)}>
          <IconSymbol name="line.3.horizontal.decrease.circle" size={24} color={Colors[colorScheme].tint} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredWorkouts}
        renderItem={({ item }) => <WorkoutItem item={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <FilterModal
        visible={isFilterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApplyFilters={applyFilters}
      />
    </ThemedView>
  );
}

const getStyles = (colorScheme: 'light' | 'dark') => StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  filterButton: {
    padding: 5,
  },
  listContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  workoutItem: {
    backgroundColor: Colors[colorScheme].cardBackground,
    padding: 18,
    borderRadius: 10,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemDate: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  itemDuration: {
    fontSize: 13,
    color: Colors[colorScheme].placeholderText,
  },
  itemVolume: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors[colorScheme].text,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalView: {
    margin: 20,
    backgroundColor: Colors[colorScheme].secondaryBackground,
    borderRadius: 15,
    padding: 25,
    paddingTop: 30,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '85%',
  },
  modalText: {
    marginBottom: 25,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
  },
  filterInputGroup: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  filterPlaceholder: {
    fontSize: 14,
    color: Colors[colorScheme].placeholderText,
    fontStyle: 'italic',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  modalButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  applyButton: {
    backgroundColor: Colors[colorScheme].tint,
  },
  applyButtonText: {
    color: colorScheme === 'dark' ? Colors.dark.buttonTextPrimary : Colors.light.buttonTextPrimary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  closeButton: {
    backgroundColor: Colors[colorScheme].secondaryBackground,
    borderWidth: 1,
    borderColor: Colors[colorScheme].borderColor,
  },
  closeButtonText: {
    color: Colors[colorScheme].text,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

// Add a placeholder WorkoutDetail screen
export function WorkoutDetailScreen() {
  // Fetch workout details based on route params
  // const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
  return (
    <ThemedView style={{ flex: 1, padding: 20 }}>
      <ThemedText type="title">Workout Details</ThemedText>
      {/* Display workout details here */}
    </ThemedView>
  );
} 