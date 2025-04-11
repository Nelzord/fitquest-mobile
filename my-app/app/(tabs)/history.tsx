import React, { useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, FlatList, ActivityIndicator, Modal } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Workout = {
  id: string;
  created_at: string;
  notes: string | null;
  duration: number | null;
  total_sets: number;
  total_exercises: number;
  total_volume: number;
};

type FilterOptions = {
  sortBy: 'date' | 'sets' | 'volume' | 'exercises';
  order: 'asc' | 'desc';
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

export default function HistoryScreen() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [filteredWorkouts, setFilteredWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    sortBy: 'date',
    order: 'desc'
  });
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = getStyles(colorScheme);

  useEffect(() => {
    if (user) {
      fetchWorkouts();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [workouts, filterOptions]);

  const fetchWorkouts = async () => {
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setWorkouts(data || []);
    } catch (error) {
      console.error('Error fetching workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let sortedWorkouts = [...workouts];
    
    switch (filterOptions.sortBy) {
      case 'date':
        sortedWorkouts.sort((a, b) => 
          filterOptions.order === 'asc' 
            ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case 'sets':
        sortedWorkouts.sort((a, b) => 
          filterOptions.order === 'asc' 
            ? a.total_sets - b.total_sets
            : b.total_sets - a.total_sets
        );
        break;
      case 'volume':
        sortedWorkouts.sort((a, b) => 
          filterOptions.order === 'asc' 
            ? a.total_volume - b.total_volume
            : b.total_volume - a.total_volume
        );
        break;
      case 'exercises':
        sortedWorkouts.sort((a, b) => 
          filterOptions.order === 'asc' 
            ? a.total_exercises - b.total_exercises
            : b.total_exercises - a.total_exercises
        );
        break;
    }
    
    setFilteredWorkouts(sortedWorkouts);
  };

  const renderWorkoutItem = ({ item }: { item: Workout }) => (
    <Link href={{ pathname: '/workout', params: { id: item.id } }} asChild>
      <TouchableOpacity style={styles.workoutItem}>
        <View style={styles.workoutHeader}>
          <ThemedText style={styles.workoutDate}>
            {formatDate(item.created_at)}
          </ThemedText>
          <ThemedText style={styles.workoutTime}>
            {formatTime(item.created_at)}
          </ThemedText>
        </View>
        
        <View style={styles.workoutStats}>
          <View style={styles.statItem}>
            <IconSymbol name="dumbbell" size={16} color={Colors[colorScheme].tint} />
            <ThemedText style={styles.statText}>{item.total_exercises} exercises</ThemedText>
          </View>
          <View style={styles.statItem}>
            <IconSymbol name="repeat" size={16} color={Colors[colorScheme].tint} />
            <ThemedText style={styles.statText}>{item.total_sets} sets</ThemedText>
          </View>
          <View style={styles.statItem}>
            <IconSymbol name="chart.bar" size={16} color={Colors[colorScheme].tint} />
            <ThemedText style={styles.statText}>{item.total_volume.toFixed(0)} volume</ThemedText>
          </View>
        </View>

        {item.notes && (
          <ThemedText style={styles.notes} numberOfLines={2}>
            {item.notes}
          </ThemedText>
        )}
      </TouchableOpacity>
    </Link>
  );

  const FilterModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showFilterModal}
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <ThemedView style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Filter Workouts</ThemedText>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <IconSymbol name="xmark.circle.fill" size={24} color={Colors[colorScheme].text} />
            </TouchableOpacity>
          </View>

          <View style={styles.filterSection}>
            <ThemedText style={styles.filterLabel}>Sort By</ThemedText>
            <View style={styles.filterOptions}>
              {(['date', 'sets', 'volume', 'exercises'] as const).map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.filterOption,
                    filterOptions.sortBy === option && styles.selectedFilterOption
                  ]}
                  onPress={() => setFilterOptions(prev => ({ ...prev, sortBy: option }))}
                >
                  <ThemedText style={[
                    styles.filterOptionText,
                    filterOptions.sortBy === option && styles.selectedFilterOptionText
                  ]}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <ThemedText style={styles.filterLabel}>Order</ThemedText>
            <View style={styles.filterOptions}>
              {(['asc', 'desc'] as const).map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.filterOption,
                    filterOptions.order === option && styles.selectedFilterOption
                  ]}
                  onPress={() => setFilterOptions(prev => ({ ...prev, order: option }))}
                >
                  <ThemedText style={[
                    styles.filterOptionText,
                    filterOptions.order === option && styles.selectedFilterOptionText
                  ]}>
                    {option === 'asc' ? 'Ascending' : 'Descending'}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => setShowFilterModal(false)}
          >
            <ThemedText style={styles.applyButtonText}>Apply Filters</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>History</ThemedText>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <IconSymbol name="line.3.horizontal.decrease.circle" size={24} color={Colors[colorScheme].tint} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
        </View>
      ) : (
        <FlatList
          data={filteredWorkouts}
          renderItem={renderWorkoutItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <IconSymbol name="dumbbell" size={48} color={Colors[colorScheme].tint} />
              <ThemedText style={styles.emptyText}>No workouts recorded yet</ThemedText>
              <TouchableOpacity 
                style={styles.startButton}
                onPress={() => router.push('/(tabs)/startWorkout')}
              >
                <ThemedText style={styles.startButtonText}>Start Your First Workout</ThemedText>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <FilterModal />
    </ThemedView>
  );
}

const getStyles = (colorScheme: 'light' | 'dark') => StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  workoutItem: {
    backgroundColor: Colors[colorScheme].secondaryBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  workoutDate: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  workoutTime: {
    fontSize: 14,
    color: Colors[colorScheme].placeholderText,
  },
  workoutStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
  },
  notes: {
    fontSize: 14,
    color: Colors[colorScheme].placeholderText,
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: Colors[colorScheme].tint,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  startButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  filterButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: Colors[colorScheme].background,
    borderRadius: 12,
    padding: 20,
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
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors[colorScheme].borderColor,
  },
  selectedFilterOption: {
    backgroundColor: Colors[colorScheme].tint,
    borderColor: Colors[colorScheme].tint,
  },
  filterOptionText: {
    fontSize: 14,
  },
  selectedFilterOptionText: {
    color: 'white',
  },
  applyButton: {
    backgroundColor: Colors[colorScheme].tint,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  applyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 