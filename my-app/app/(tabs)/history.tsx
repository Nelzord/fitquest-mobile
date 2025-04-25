import React, { useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, FlatList, ActivityIndicator, Modal, ScrollView, Dimensions } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivityChart } from '@/components/ActivityChart';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';

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

type WorkoutStats = {
  totalWorkouts: number;
  totalDuration: number;
  totalExercises: number;
  totalSets: number;
  totalVolume: number;
  favoriteExercise: string;
  highestVolumeSession: {
    volume: number;
    date: string;
  };
  longestSession: {
    duration: number;
    date: string;
  };
};

type ProgressionMetric = 'volume' | 'reps' | 'maxWeight';
type Exercise = {
  id: string;
  name: string;
};

type ProgressionData = {
  date: string;
  value: number;
};

type TimeRange = '5' | '10' | '30';
type SetRange = '5' | '10' | '20';

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
  const [showAllWorkouts, setShowAllWorkouts] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    sortBy: 'date',
    order: 'desc'
  });
  const [activeTab, setActiveTab] = useState<'activity' | 'stats' | 'progression'>('activity');
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = getStyles(colorScheme);
  const [activityData, setActivityData] = useState<{ date: string; count: number }[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [stats, setStats] = useState<WorkoutStats | null>(null);
  const [progressionMetric, setProgressionMetric] = useState<ProgressionMetric>('volume');
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [progressionData, setProgressionData] = useState<ProgressionData[]>([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('30');
  const [uniqueExercises, setUniqueExercises] = useState<Exercise[]>([]);
  const [setRange, setSetRange] = useState<SetRange>('10');

  useEffect(() => {
    if (user) {
      fetchWorkouts();
      fetchWorkoutStats();
      fetchExercises();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [workouts, filterOptions, selectedDate]);

  useEffect(() => {
    if (activeTab === 'progression') {
      fetchProgressionData();
    }
  }, [activeTab, progressionMetric, selectedExercise, setRange]);

  const fetchWorkouts = async () => {
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkouts(data || []);

      // Process data for activity chart
      const activityMap = new Map<string, number>();
      data?.forEach(workout => {
        const date = new Date(workout.created_at).toISOString().split('T')[0];
        activityMap.set(date, (activityMap.get(date) || 0) + 1);
      });

      setActivityData(Array.from(activityMap.entries()).map(([date, count]) => ({
        date,
        count,
      })));
    } catch (error) {
      console.error('Error fetching workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkoutStats = async () => {
    try {
      const { data: workouts, error } = await supabase
        .from('workouts')
        .select(`
          id,
          created_at,
          duration,
          exercises (
            id,
            name,
            type,
            sets (
              id,
              weight,
              reps
            )
          )
        `)
        .eq('user_id', user?.id);

      if (error) throw error;

      // Calculate basic stats
      const totalWorkouts = workouts?.length || 0;
      const totalDuration = workouts?.reduce((sum, workout) => sum + (workout.duration || 0), 0) || 0;
      const totalExercises = workouts?.reduce((sum, workout) => sum + (workout.exercises?.length || 0), 0) || 0;
      const totalSets = workouts?.reduce((sum, workout) => 
          sum + (workout.exercises?.reduce((exerciseSum, exercise) => 
          exerciseSum + (exercise.sets?.length || 0), 0) || 0), 0) || 0;
      const totalVolume = workouts?.reduce((sum, workout) => 
          sum + (workout.exercises?.reduce((exerciseSum, exercise) => 
            exerciseSum + (exercise.sets?.reduce((setSum, set) => 
            setSum + ((set.weight || 0) * (set.reps || 0)), 0) || 0), 0) || 0), 0) || 0;

      // Calculate favorite exercise
      const exerciseCounts = new Map<string, number>();
      workouts?.forEach(workout => {
        workout.exercises?.forEach(exercise => {
          if (exercise.type !== 'cardio') {
            exerciseCounts.set(exercise.name, (exerciseCounts.get(exercise.name) || 0) + 1);
          }
        });
      });
      const favoriteExercise = Array.from(exerciseCounts.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'No exercises';

      // Calculate highest volume session
      const highestVolumeSession = workouts?.reduce((max, workout) => {
        const volume = workout.exercises?.reduce((sum, exercise) => 
          sum + (exercise.sets?.reduce((setSum, set) => 
            setSum + ((set.weight || 0) * (set.reps || 0)), 0) || 0), 0) || 0;
        return volume > max.volume ? { volume, date: workout.created_at } : max;
      }, { volume: 0, date: '' });

      // Calculate longest session
      const longestSession = workouts?.reduce((max, workout) => {
        const duration = workout.duration || 0;
        return duration > max.duration ? { duration, date: workout.created_at } : max;
      }, { duration: 0, date: '' });

      const stats: WorkoutStats = {
        totalWorkouts,
        totalDuration,
        totalExercises,
        totalSets,
        totalVolume,
        favoriteExercise,
        highestVolumeSession: highestVolumeSession || { volume: 0, date: '' },
        longestSession: longestSession || { duration: 0, date: '' }
      };

      setStats(stats);
    } catch (error) {
      console.error('Error fetching workout stats:', error);
      setStats({
        totalWorkouts: 0,
        totalDuration: 0,
        totalExercises: 0,
        totalSets: 0,
        totalVolume: 0,
        favoriteExercise: 'No exercises',
        highestVolumeSession: { volume: 0, date: '' },
        longestSession: { duration: 0, date: '' }
      });
    }
  };

  const fetchExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('id, name, type')
        .order('name');

      if (error) throw error;
      
      // Group exercises by name and keep only one instance of each, excluding cardio
      const uniqueExercisesMap = new Map<string, Exercise>();
      data?.forEach(exercise => {
        if (!uniqueExercisesMap.has(exercise.name) && exercise.type !== 'cardio') {
          uniqueExercisesMap.set(exercise.name, exercise);
        }
      });
      
      const exercisesList = Array.from(uniqueExercisesMap.values());
      setUniqueExercises(exercisesList);

      // Find the most frequent exercise
      const exerciseCounts = new Map<string, number>();
      data?.forEach(exercise => {
        if (exercise.type !== 'cardio') {
          exerciseCounts.set(exercise.name, (exerciseCounts.get(exercise.name) || 0) + 1);
        }
      });

      const mostFrequentExercise = Array.from(exerciseCounts.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0];

      if (mostFrequentExercise) {
        const exercise = exercisesList.find(e => e.name === mostFrequentExercise);
        if (exercise) {
          setSelectedExercise(exercise.id);
        }
      }
    } catch (error) {
      console.error('Error fetching exercises:', error);
    }
  };

  const fetchProgressionData = async () => {
    try {
      // First get the exercise name if a specific exercise is selected
      const exerciseName = selectedExercise === null 
        ? null 
        : uniqueExercises.find(e => e.id === selectedExercise)?.name;

      if (!exerciseName && selectedExercise !== null) {
        console.error('Exercise not found');
        return;
      }

      // Fetch all workouts with their exercises and sets
      let query = supabase
        .from('workouts')
        .select(`
          created_at,
          exercises (
            id,
            name,
            sets (
              weight,
              reps
            )
          )
        `)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      // Process all sets for the specific exercise
      const allSets: { date: string; weight: number; reps: number }[] = [];
      data?.forEach(workout => {
        workout.exercises?.forEach(exercise => {
          // Only include sets from the selected exercise
          if (selectedExercise === null || exercise.name === exerciseName) {
            exercise.sets?.forEach(set => {
              allSets.push({
                date: workout.created_at,
                weight: set.weight || 0,
                reps: set.reps || 0
              });
            });
          }
        });
      });

      // Take the last X sets (already sorted by date descending)
      const selectedSets = allSets.slice(0, parseInt(setRange));

      // Process the selected sets into chart data
      const processedData = selectedSets.map(set => {
        let value = 0;
        switch (progressionMetric) {
          case 'volume':
            value = set.weight * set.reps;
            break;
          case 'reps':
            value = set.reps;
            break;
          case 'maxWeight':
            value = set.weight;
            break;
        }
        return {
          date: set.date,
          value: value
        };
      }).reverse(); // Reverse to show oldest to newest

      setProgressionData(processedData);
    } catch (error) {
      console.error('Error fetching progression data:', error);
    }
  };

  const handleDayPress = (date: string) => {
    setSelectedDate(selectedDate === date ? null : date);
  };

  const applyFilters = () => {
    let sortedWorkouts = [...workouts];
    
    // Apply date filter if selected
    if (selectedDate) {
      sortedWorkouts = sortedWorkouts.filter(workout => 
        new Date(workout.created_at).toISOString().split('T')[0] === selectedDate
      );
    }
    
    // Apply sorting
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

  const TabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'activity' && styles.activeTab]}
        onPress={() => setActiveTab('activity')}
      >
        <ThemedText style={[styles.tabText, activeTab === 'activity' && styles.activeTabText]}>
          Activity
        </ThemedText>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
        onPress={() => setActiveTab('stats')}
      >
        <ThemedText style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>
          Stats
        </ThemedText>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'progression' && styles.activeTab]}
        onPress={() => setActiveTab('progression')}
      >
        <ThemedText style={[styles.tabText, activeTab === 'progression' && styles.activeTabText]}>
          Progression
        </ThemedText>
      </TouchableOpacity>
    </View>
  );

  const renderProgressionContent = () => {
    const chartData = {
      labels: progressionData.length > 0 
        ? progressionData.map((_, index) => 
            setRange === '20' ? '' : `${new Date(progressionData[index].date).getMonth() + 1}/${new Date(progressionData[index].date).getDate()}`
          )
        : ['No Data'],
      datasets: [{
        data: progressionData.length > 0 
          ? progressionData.map(item => item.value)
          : [0]
      }]
    };

    return (
      <View style={styles.progressionContent}>
        <View style={styles.progressionFilters}>
          <TouchableOpacity
            style={styles.exercisePicker}
            onPress={() => setShowExercisePicker(true)}
          >
            <ThemedText>
              {selectedExercise ? uniqueExercises.find(e => e.id === selectedExercise)?.name : 'Select Exercise'}
            </ThemedText>
            <IconSymbol name="chevron.down" size={20} color={Colors[colorScheme].text} />
          </TouchableOpacity>
          
          <View style={styles.setRangeButtons}>
            {(['5', '10', '20'] as SetRange[]).map(range => (
              <TouchableOpacity
                key={range}
                style={[styles.setRangeButton, setRange === range && styles.activeSetRangeButton]}
                onPress={() => setSetRange(range)}
              >
                <ThemedText style={[styles.setRangeText, setRange === range && styles.activeSetRangeText]}>
                  {range === '20' ? 'All Time' : `Last ${range} sets`}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.metricButtons}>
            {(['volume', 'reps', 'maxWeight'] as ProgressionMetric[]).map(metric => (
              <TouchableOpacity
                key={metric}
                style={[styles.metricButton, progressionMetric === metric && styles.activeMetricButton]}
                onPress={() => setProgressionMetric(metric)}
              >
                <ThemedText style={[styles.metricText, progressionMetric === metric && styles.activeMetricText]}>
                  {metric === 'volume' ? 'Volume' : metric === 'reps' ? 'Reps' : 'Max Weight'}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.chartContainer}>
          <LineChart
            data={chartData}
            width={Dimensions.get('window').width - 32}
            height={220}
            chartConfig={{
              backgroundColor: Colors[colorScheme].background,
              backgroundGradientFrom: Colors[colorScheme].background,
              backgroundGradientTo: Colors[colorScheme].background,
              decimalPlaces: 0,
              color: (opacity = 1) => Colors[colorScheme].tint,
              labelColor: (opacity = 1) => Colors[colorScheme].text,
              style: {
                borderRadius: 16
              },
              propsForDots: {
                r: "6",
                strokeWidth: "2",
                stroke: Colors[colorScheme].tint
              },
              propsForLabels: {
                fontSize: setRange === '20' ? 8 : 12
              }
            }}
            bezier
            style={styles.chart}
          />
          {progressionData.length === 0 && (
            <View style={styles.noDataOverlay}>
              <ThemedText style={styles.noDataText}>
                {!selectedExercise 
                  ? 'Select an exercise to view progression'
                  : 'No data available for this exercise'}
              </ThemedText>
            </View>
          )}
        </View>

        {progressionData.length > 0 && (
          <View style={styles.progressionTable}>
            <View style={styles.tableHeader}>
              <ThemedText style={styles.tableHeaderText}>Date</ThemedText>
              <ThemedText style={styles.tableHeaderText}>
                {progressionMetric === 'volume' ? 'Volume' : progressionMetric === 'reps' ? 'Reps' : 'Max Weight'}
              </ThemedText>
            </View>
            <ScrollView style={styles.tableBody}>
              {progressionData.map((item, index) => (
                <View key={index} style={styles.tableRow}>
                  <ThemedText style={styles.tableCell}>
                    {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </ThemedText>
                  <ThemedText style={styles.tableCell}>
                    {item.value.toLocaleString()}
                  </ThemedText>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  const ExercisePickerModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showExercisePicker}
      onRequestClose={() => setShowExercisePicker(false)}
    >
      <View style={styles.modalOverlay}>
        <ThemedView style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Select Exercise</ThemedText>
            <TouchableOpacity onPress={() => setShowExercisePicker(false)}>
              <IconSymbol name="xmark.circle.fill" size={24} color={Colors[colorScheme].text} />
            </TouchableOpacity>
          </View>
          <ScrollView>
            {uniqueExercises.map(exercise => (
              <TouchableOpacity
                key={exercise.id}
                style={styles.exerciseOption}
                onPress={() => {
                  setSelectedExercise(exercise.id);
                  setShowExercisePicker(false);
                }}
              >
                <ThemedText>{exercise.name}</ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ThemedView>
      </View>
    </Modal>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'activity':
        return (
          <View style={styles.tabContent}>
      <ActivityChart 
        data={activityData} 
        onDayPress={handleDayPress}
        selectedDate={selectedDate || undefined}
      />
            <View style={styles.historyHeader}>
          <ThemedText style={styles.title}>
            {selectedDate 
              ? `Workouts on ${new Date(selectedDate).toLocaleDateString()}`
              : 'History'
            }
          </ThemedText>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <IconSymbol name="line.3.horizontal.decrease.circle" size={24} color={Colors[colorScheme].tint} />
        </TouchableOpacity>
            </View>
            <FlatList
              data={showAllWorkouts ? filteredWorkouts : filteredWorkouts.slice(0, 5)}
              renderItem={renderWorkoutItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                filteredWorkouts.length === 0 ? (
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
                ) : null
              }
              ListFooterComponent={
                !showAllWorkouts && filteredWorkouts.length > 5 ? (
                  <TouchableOpacity 
                    style={styles.seeMoreButton}
                    onPress={() => setShowAllWorkouts(true)}
                  >
                    <ThemedText style={styles.seeMoreText}>See More Workouts</ThemedText>
                    <IconSymbol 
                      name="chevron.down" 
                      size={20} 
                      color={Colors[colorScheme].text}
                    />
                  </TouchableOpacity>
                ) : null
              }
            />
          </View>
  );
      case 'stats':
        return (
          <View style={styles.tabContent}>
            {renderStats()}
          </View>
        );
      case 'progression':
        return (
          <View style={styles.tabContent}>
            {renderProgressionContent()}
            <ExercisePickerModal />
          </View>
        );
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const renderStats = () => {
    if (loading) {
      return <ThemedText>Loading stats...</ThemedText>;
    }

    if (!stats) {
      return <ThemedText>No stats available</ThemedText>;
    }

    return (
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="barbell" size={24} color={Colors[colorScheme].tint} />
          <ThemedText style={styles.statValue}>{stats.totalWorkouts}</ThemedText>
          <ThemedText style={styles.statLabel}>Total Workouts</ThemedText>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="time" size={24} color={Colors[colorScheme].tint} />
          <ThemedText style={styles.statValue}>{formatDuration(stats.totalDuration)}</ThemedText>
          <ThemedText style={styles.statLabel}>Total Time</ThemedText>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="fitness" size={24} color={Colors[colorScheme].tint} />
          <ThemedText style={styles.statValue}>{stats.totalExercises}</ThemedText>
          <ThemedText style={styles.statLabel}>Total Exercises</ThemedText>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="repeat" size={24} color={Colors[colorScheme].tint} />
          <ThemedText style={styles.statValue}>{stats.totalSets}</ThemedText>
          <ThemedText style={styles.statLabel}>Total Sets</ThemedText>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="scale" size={24} color={Colors[colorScheme].tint} />
          <ThemedText style={styles.statValue}>{stats.totalVolume.toLocaleString()} kg</ThemedText>
          <ThemedText style={styles.statLabel}>Total Volume</ThemedText>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="star" size={24} color={Colors[colorScheme].tint} />
          <ThemedText style={styles.statValue}>{stats.favoriteExercise}</ThemedText>
          <ThemedText style={styles.statLabel}>Favorite Exercise</ThemedText>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="trophy" size={24} color={Colors[colorScheme].tint} />
          <ThemedText style={styles.statValue}>{stats.highestVolumeSession?.volume?.toLocaleString() || '0'} kg</ThemedText>
          <ThemedText style={styles.statLabel}>Highest Volume</ThemedText>
          <ThemedText style={styles.statDate}>{formatDate(stats.highestVolumeSession?.date || '')}</ThemedText>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="timer" size={24} color={Colors[colorScheme].tint} />
          <ThemedText style={styles.statValue}>{formatDuration(stats.longestSession?.duration || 0)}</ThemedText>
          <ThemedText style={styles.statLabel}>Longest Session</ThemedText>
          <ThemedText style={styles.statDate}>{formatDate(stats.longestSession?.date || '')}</ThemedText>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <TabBar />
      {renderContent()}
      <FilterModal />
    </ThemedView>
  );
}

const getStyles = (colorScheme: 'light' | 'dark') => StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors[colorScheme].borderColor,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
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
  tabContent: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
  contentContainer: {
    padding: 16,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
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
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors[colorScheme].borderColor,
  },
  statsSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  seeMoreText: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressionContent: {
    flex: 1,
    padding: 16,
  },
  progressionFilters: {
    marginBottom: 16,
  },
  exercisePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: Colors[colorScheme].secondaryBackground,
    borderRadius: 8,
    marginBottom: 12,
  },
  metricButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    backgroundColor: Colors[colorScheme].secondaryBackground,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeMetricButton: {
    backgroundColor: Colors[colorScheme].tint,
  },
  metricText: {
    fontSize: 14,
  },
  activeMetricText: {
    color: 'white',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  exerciseOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors[colorScheme].borderColor,
  },
  setRangeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  setRangeButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    backgroundColor: Colors[colorScheme].secondaryBackground,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeSetRangeButton: {
    backgroundColor: Colors[colorScheme].tint,
  },
  setRangeText: {
    fontSize: 14,
  },
  activeSetRangeText: {
    color: 'white',
  },
  chartContainer: {
    position: 'relative',
  },
  noDataOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 16,
  },
  noDataText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  statDate: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
    textAlign: 'center',
  },
  progressionTable: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors[colorScheme].border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: Colors[colorScheme].tint + '20',
    borderBottomWidth: 1,
    borderBottomColor: Colors[colorScheme].border,
  },
  tableHeaderText: {
    flex: 1,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableBody: {
    maxHeight: 200,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors[colorScheme].border,
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
  },
}); 