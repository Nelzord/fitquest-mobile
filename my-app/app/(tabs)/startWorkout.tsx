import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StyleSheet, View, TextInput, FlatList, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, SectionList, Modal, useColorScheme as useRNColorScheme, Keyboard, TouchableWithoutFeedback, ActivityIndicator, ImageSourcePropType, Alert, AppState } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol'; // Assuming IconSymbol exists
import commonWorkoutsJson from '@/assets/data/commonWorkouts.json'; // Import as raw JSON
import { Colors } from '@/constants/Colors'; // Import Colors
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Import for safe area
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import WorkoutCompletionModal from '@/components/WorkoutCompletionModal';
import { getItemImage } from '@/components/EquippedItems';

interface CommonExercise {
  name: string;
  muscle: string;
  equipment?: string;
  type: 'standard' | 'bodyweight' | 'timed';
}

interface WorkoutCategory {
  name: string;
  exercises: CommonExercise[];
}

interface WorkoutData {
  categories: WorkoutCategory[];
}

// Process the raw JSON to create a correctly typed data structure
const commonWorkoutsData: WorkoutData = {
  categories: commonWorkoutsJson.categories.map(category => ({
    ...category,
    exercises: category.exercises.map(exercise => ({
      ...exercise,
      // Assert the type here to satisfy TypeScript
      type: exercise.type as CommonExercise['type'], 
    })),
  })),
};

// Define the structure for a single set/entry
interface Set {
  id: string;
  completed: boolean;
  reps?: string;      // Optional: For standard/bodyweight
  weight?: string;    // Optional: For standard only
  duration?: string;  // Optional: For timed (e.g., "MM:SS")
  distance?: string;  // Optional: For timed (e.g., "5km")
}

interface Exercise {
  id: string;
  name: string;
  type: 'standard' | 'bodyweight' | 'timed'; // Add type to main exercise state
  sets: Set[]; // Can represent sets or timed entries
}

interface Workout {
  id: string;
  created_at: string;
  notes?: string;
  exercises: Exercise[];
}

interface ItemBonus {
  muscle_group: string;
  bonus: number;
}

interface EquippedItem {
  item_id: number;
  items: {
    name: string;
    xp_bonus: ItemBonus;
    gold_bonus: ItemBonus;
    effect: string;
  };
}

interface WorkoutCompletionStats {
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
  equippedItems: {
    name: string;
    image: ImageSourcePropType | null;
    xpBonus: ItemBonus | null;
    goldBonus: ItemBonus | null;
  }[];
}

// Update props to include set handlers
const ExerciseItem = ({
  item,
  onUpdateName,
  onAddSet,
  onUpdateSet,
  onRemoveSet,
  onRemoveExercise,
}: {
  item: Exercise;
  onUpdateName: (id: string, name: string) => void;
  onAddSet: (exerciseId: string) => void;
  onUpdateSet: (exerciseId: string, setId: string, field: keyof Set, value: string | boolean) => void;
  onRemoveSet: (exerciseId: string, setId: string) => void;
  onRemoveExercise: (id: string) => void;
}) => {
  const colorScheme = useRNColorScheme() ?? 'light';
  const styles = getStyles(colorScheme);
  const [isMinimized, setIsMinimized] = useState(false);

  // Helper to render the correct set row inputs based on type
  const renderSetInputs = (set: Set) => {
    switch (item.type) {
      case 'standard':
        return (
          <>
            <TextInput
              style={[styles.exerciseInput, styles.numericInput, styles.setInput]}
              placeholder="Reps"
              value={set.reps ?? ''} // Use ?? '' for optional fields
              onChangeText={(text) => onUpdateSet(item.id, set.id, 'reps', text)}
              keyboardType="numeric"
              editable={!set.completed}
              placeholderTextColor={Colors[colorScheme].placeholderText}
            />
            <TextInput
              style={[styles.exerciseInput, styles.numericInput, styles.setInput]}
              placeholder="Wt"
              value={set.weight ?? ''} // Use ?? '' for optional fields
              onChangeText={(text) => onUpdateSet(item.id, set.id, 'weight', text)}
              keyboardType="numeric"
              editable={!set.completed}
              placeholderTextColor={Colors[colorScheme].placeholderText}
            />
          </>
        );
      case 'bodyweight':
        return (
          <TextInput
            style={[styles.exerciseInput, styles.numericInput, styles.setInput, styles.singleSetInput] // Style to take more space
            }
            placeholder="Reps"
            value={set.reps ?? ''} // Use ?? '' for optional fields
            onChangeText={(text) => onUpdateSet(item.id, set.id, 'reps', text)}
            keyboardType="numeric"
            editable={!set.completed}
            placeholderTextColor={Colors[colorScheme].placeholderText}
          />
        );
      case 'timed':
        return (
          <>
            <TextInput
              style={[styles.exerciseInput, styles.numericInput, styles.setInput]}
              placeholder="MM:SS"
              value={set.duration ?? ''} // Use ?? '' for optional fields
              onChangeText={(text) => onUpdateSet(item.id, set.id, 'duration', text)}
              keyboardType="numbers-and-punctuation" // Allow colon
              editable={!set.completed}
              placeholderTextColor={Colors[colorScheme].placeholderText}
            />
            <TextInput
              style={[styles.exerciseInput, styles.numericInput, styles.setInput]}
              placeholder="Dist."
              value={set.distance ?? ''} // Use ?? '' for optional fields
              onChangeText={(text) => onUpdateSet(item.id, set.id, 'distance', text)}
              keyboardType="default"
              editable={!set.completed}
              placeholderTextColor={Colors[colorScheme].placeholderText}
            />
          </>
        );
      default:
        return null;
    }
  };

  // Helper to render the correct header based on type
  const renderSetHeader = () => {
    switch (item.type) {
      case 'standard':
        return (
          <>
            <ThemedText style={styles.setRowHeaderTextAction}></ThemedText>
            <ThemedText style={styles.setRowHeaderText}>Set</ThemedText>
            <ThemedText style={styles.setRowHeaderTextReps}>Reps</ThemedText>
            <ThemedText style={styles.setRowHeaderTextWeight}>Weight</ThemedText>
            <ThemedText style={styles.setRowHeaderTextDone}>Done</ThemedText>
          </>
        );
      case 'bodyweight':
        return (
          <>
            <ThemedText style={styles.setRowHeaderTextAction}></ThemedText>
            <ThemedText style={styles.setRowHeaderText}>Set</ThemedText>
            <ThemedText style={[styles.setRowHeaderTextReps, styles.singleSetInputHeader]}>Reps</ThemedText> 
            <ThemedText style={styles.setRowHeaderTextDone}>Done</ThemedText>
          </>
        );
      case 'timed':
        return (
          <>
            <ThemedText style={styles.setRowHeaderTextAction}></ThemedText>
            <ThemedText style={styles.setRowHeaderText}>Set</ThemedText>
            <ThemedText style={styles.setRowHeaderText}>Duration</ThemedText>
            <ThemedText style={styles.setRowHeaderText}>Distance</ThemedText>
            <ThemedText style={styles.setRowHeaderTextDone}>Done</ThemedText>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.exercisePanel}>
      {/* Panel Header */} 
      <View style={styles.panelHeader}>
        {/* Minimize Button (Wraps Input and Chevron) */}
        <TouchableOpacity 
          style={styles.minimizeTouchable} 
          onPress={() => setIsMinimized(!isMinimized)} 
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <TextInput
            style={styles.exerciseNameInput}
            placeholder="Exercise Name"
            value={item.name}
            onChangeText={(text) => onUpdateName(item.id, text)}
            placeholderTextColor={Colors[colorScheme].placeholderText}
          />
          <IconSymbol 
            name={isMinimized ? "chevron.down" : "chevron.up"} 
            size={20} 
            color={Colors[colorScheme].icon} 
            style={styles.chevronIcon}
          />
        </TouchableOpacity>
        {/* Delete Exercise Button */}
        <TouchableOpacity 
          onPress={() => onRemoveExercise(item.id)} 
          style={styles.deleteExerciseButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <IconSymbol name="trash" size={18} color={Colors[colorScheme].danger} />
        </TouchableOpacity>
      </View>

      {/* Panel Body (Conditionally Rendered) */}
      {!isMinimized && (
        <View style={styles.panelBodySetsContainer}>
          {/* Header Row for Sets (Dynamically Rendered) */}
          {item.sets.length > 0 && (
            <View style={styles.setRowHeader}>
              {renderSetHeader()} 
            </View>
          )}

          {/* Map through sets and render each row */}
          {item.sets.map((set, index) => (
            <View key={set.id} style={[styles.setRow, set.completed ? styles.setRowCompleted : null]}>
              {/* Remove Set Button */}
              <TouchableOpacity 
                style={styles.removeSetButton} 
                onPress={() => onRemoveSet(item.id, set.id)}
                disabled={set.completed}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <IconSymbol 
                  name="minus.circle" 
                  size={18} 
                  color={set.completed ? Colors[colorScheme].placeholderText : Colors[colorScheme].danger} 
                />
              </TouchableOpacity>

              {/* Set Number */}
              <ThemedText style={styles.setNumber}>{index + 1}</ThemedText>
              
              {/* Render dynamic inputs based on type */}
              {renderSetInputs(set)}
              
              {/* Completed Checkmark */}
              <TouchableOpacity 
                style={styles.setCheckmarkButton} 
                onPress={() => onUpdateSet(item.id, set.id, 'completed', !set.completed)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <IconSymbol 
                  name={set.completed ? "checkmark.circle.fill" : "circle"} 
                  size={22} 
                  color={set.completed ? Colors[colorScheme].tint : Colors[colorScheme].icon}
                />
              </TouchableOpacity>
            </View>
          ))}

          {/* Add Set/Entry Button */}
          <TouchableOpacity 
            style={styles.addSetButton} 
            onPress={() => onAddSet(item.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <IconSymbol name="plus.circle" size={18} color={Colors[colorScheme].tint} />
            <ThemedText style={styles.addSetText}>Add Set</ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// Renamed and modified component for the top control panel
const TopWorkoutControlPanel = ({ 
  time, 
  onFinish,
  onReset,
  onCancel,
  isWorkoutActive,
  isSaving
}: {
  time: number,
  onFinish: () => void,
  onReset: () => void,
  onCancel: () => void,
  isWorkoutActive: boolean,
  isSaving: boolean
}) => {
  const colorScheme = useRNColorScheme() ?? 'light';
  const styles = getStyles(colorScheme);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCancelPress = () => {
    setShowCancelConfirm(true);
  };

  const handleConfirmCancel = () => {
    setShowCancelConfirm(false);
    onCancel();
  };

  const handleCancelCancel = () => {
    setShowCancelConfirm(false);
  };

  if (!isWorkoutActive) {
    return null;
  }

  return (
    <>
      <View style={[
        styles.topPanelContainer,
        styles.topPanelActive
      ]}>
        <View style={styles.timerContainer}>
          <ThemedText style={styles.timerText}>{formatTime(time)}</ThemedText>
          <TouchableOpacity 
            style={styles.resetButton}
            onPress={onReset}
          >
            <IconSymbol name="arrow.clockwise" size={16} color={Colors[colorScheme].tint} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.cancelWorkoutButton}
            onPress={handleCancelPress}
          >
            <IconSymbol name="xmark" size={16} color={Colors[colorScheme].danger} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          onPress={onFinish}
          activeOpacity={0.7}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={Colors[colorScheme].danger} />
          ) : (
            <ThemedText style={[styles.panelActionText, { color: Colors[colorScheme].danger }]}>
              Finish Workout
            </ThemedText>
          )}
        </TouchableOpacity>
      </View>

      {/* Cancel Confirmation Modal */}
      <Modal
        visible={showCancelConfirm}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmationModal}>
            <ThemedText style={styles.confirmationTitle}>Cancel Workout?</ThemedText>
            <ThemedText style={styles.confirmationText}>
              Are you sure you want to cancel this workout? All progress will be lost.
            </ThemedText>
            <View style={styles.confirmationButtons}>
              <TouchableOpacity 
                style={[styles.confirmationButton, styles.cancelButton]}
                onPress={handleCancelCancel}
              >
                <ThemedText style={styles.cancelButtonText}>No, Continue</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmationButton, styles.confirmButton]}
                onPress={handleConfirmCancel}
              >
                <ThemedText style={styles.confirmButtonText}>Yes, Cancel</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const DurationFilterModal = ({ visible, onClose, onApplyFilters }: { visible: boolean, onClose: () => void, onApplyFilters: (filters: any) => void }) => {
  const colorScheme = useRNColorScheme() ?? 'light';
  const styles = getStyles(colorScheme);
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);

  const durations = [
    { label: 'Under 15 min', value: '15' },
    { label: '15-30 min', value: '30' },
    { label: '30-45 min', value: '45' },
    { label: '45-60 min', value: '60' },
    { label: 'Over 60 min', value: '60+' },
  ];

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <ThemedView style={styles.modalView}>
          <ThemedText type="subtitle" style={styles.modalText}>Filter by Duration</ThemedText>
          
          {durations.map((duration) => (
            <TouchableOpacity
              key={duration.value}
              style={[
                styles.durationButton,
                selectedDuration === duration.value && styles.durationButtonActive
              ]}
              onPress={() => setSelectedDuration(duration.value)}
            >
              <ThemedText style={[
                styles.durationButtonText,
                selectedDuration === duration.value && styles.durationButtonTextActive
              ]}>
                {duration.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
          
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.applyButton]} 
              onPress={() => {
                onApplyFilters({ duration: selectedDuration });
                onClose();
              }}
            >
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

export default function StartWorkoutScreen() {
  const colorScheme = useRNColorScheme() ?? 'light';
  const styles = getStyles(colorScheme);
  const insets = useSafeAreaInsets();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [notes, setNotes] = useState('');
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [isBrowsingModalVisible, setIsBrowsingModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [time, setTime] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isDurationFilterVisible, setDurationFilterVisible] = useState(false);
  const [durationFilter, setDurationFilter] = useState<string | null>(null);
  const { user } = useAuth();
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionStats, setCompletionStats] = useState<WorkoutCompletionStats | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [backgroundTime, setBackgroundTime] = useState<number | null>(null);
  const appState = useRef(AppState.currentState);

  // Memoize filtered data - now includes category filtering
  const filteredWorkoutData = useMemo(() => {
    let categories = commonWorkoutsData.categories;

    // Filter by selected category first
    if (selectedCategory) {
      categories = categories.filter(category => category.name === selectedCategory);
    }

    // Then filter by search term
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      categories = categories
        .map(category => ({
          ...category,
          exercises: category.exercises.filter(
            exercise =>
              exercise.name.toLowerCase().includes(lowerCaseSearchTerm) ||
              exercise.muscle.toLowerCase().includes(lowerCaseSearchTerm) ||
              exercise.equipment?.toLowerCase().includes(lowerCaseSearchTerm)
          ),
        }))
        .filter(category => category.exercises.length > 0);
    }

    // Format for SectionList
    return categories.map(category => ({
      title: category.name,
      data: category.exercises,
    }));

  }, [searchTerm, commonWorkoutsData, selectedCategory]);

  const workoutCategories = useMemo(() => [
    'All',
    ...commonWorkoutsData.categories.map(cat => cat.name)
  ], [commonWorkoutsData]);

  const addExercise = () => {
    setIsBrowsingModalVisible(true);
  };

  // Updated to receive the full exercise object from modal
  const addSelectedExercise = (exercise: CommonExercise) => {
    let initialSets: Set[] = [];
    // Start with one empty set for standard/bodyweight types
    if (exercise.type === 'standard' || exercise.type === 'bodyweight') {
      initialSets.push({ id: Date.now().toString(), completed: false, reps: '', weight: exercise.type === 'standard' ? '' : undefined });
    }
    // For timed, start with an empty set array (user adds entries)
    // Or could start with one entry: { id: Date.now().toString(), completed: false, duration: '', distance: '' }

    setExercises([...exercises, { 
      id: Date.now().toString(), 
      name: exercise.name, 
      type: exercise.type, // Set the type
      sets: initialSets
    }]);
    setIsBrowsingModalVisible(false);
    setSearchTerm('');
    setSelectedCategory(null); // Reset category filter too
  };

  const updateExerciseName = (id: string, name: string) => {
    setExercises(exercises.map(ex => ex.id === id ? { ...ex, name: name } : ex));
  };

  // Updated addSet to handle different types and copy previous set values
  const addSet = (exerciseId: string) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        let newSet: Set;
        const lastSet = ex.sets[ex.sets.length - 1]; // Get the last set
        
        if (ex.type === 'standard') {
          newSet = { 
            id: Date.now().toString(), 
            completed: false, 
            reps: lastSet?.reps ?? '', 
            weight: lastSet?.weight ?? '' 
          };
        } else if (ex.type === 'bodyweight') {
          newSet = { 
            id: Date.now().toString(), 
            completed: false, 
            reps: lastSet?.reps ?? '' 
          };
        } else { // Timed
          newSet = { 
            id: Date.now().toString(), 
            completed: false, 
            duration: lastSet?.duration ?? '', 
            distance: lastSet?.distance ?? '' 
          };
        }
        return { ...ex, sets: [...ex.sets, newSet] };
      }
      return ex;
    }));
  };

  // updateSet signature might need adjustment later if field names change significantly
  const updateSet = (exerciseId: string, setId: string, field: keyof Set, value: string | boolean) => {
    // ... existing logic should work if field names are valid keys of Set ...
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          sets: ex.sets.map(set => {
            if (set.id === setId) {
              return { ...set, [field]: value };
            }
            return set;
          })
        };
      }
      return ex;
    }));
  };

  const removeSet = (exerciseId: string, setId: string) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          sets: ex.sets.filter(set => set.id !== setId) // Filter out the set
        };
      }
      return ex;
    }));
  };

  const removeExercise = (exerciseId: string) => {
    setExercises(exercises.filter(ex => ex.id !== exerciseId));
  };

  // Timer Logic Effect
  useEffect(() => {
    if (isWorkoutActive) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000) as unknown as NodeJS.Timeout;
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setTime(0); // Reset timer when workout is not active
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isWorkoutActive]);

  // AppState Effect for background timer
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (isWorkoutActive) {
        // Only process the first background event and ignore subsequent ones
        if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
          console.log('App went to background at:', new Date().toISOString());
          setBackgroundTime(Date.now());
        }
        // Only process the first active event after being in background
        else if (appState.current.match(/inactive|background/) && nextAppState === 'active' && backgroundTime) {
          console.log('App came to foreground at:', new Date().toISOString());
          const elapsedTime = Math.floor((Date.now() - backgroundTime) / 1000);
          console.log('Time spent in background:', elapsedTime, 'seconds');
          setTime(prevTime => prevTime + elapsedTime);
          setBackgroundTime(null);
        }
      }
      console.log('App state changed from', appState.current, 'to', nextAppState);
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isWorkoutActive, backgroundTime]);

  const startWorkout = () => {
    setIsWorkoutActive(true);
    setTime(0);
  };

  const calculateRequiredXP = (level: number) => {
    return Math.floor(100 * Math.pow(level, 1.5));
  };

  const updateUserStats = async (totalSets: number) => {
    if (!user) return;

    // Get current user stats
    const { data: currentStats, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (statsError) {
      console.error('Error fetching user stats:', statsError);
      return;
    }

    // Get user's equipped items and their bonuses
    const { data: equippedItems, error: itemsError } = await supabase
      .from('user_inventory')
      .select(`
        item_id,
        items (
          name,
          xp_bonus,
          gold_bonus,
          effect
        )
      `)
      .eq('user_id', user.id)
      .eq('is_equipped', true) as { data: EquippedItem[] | null, error: any };

    if (itemsError) {
      console.error('Error fetching equipped items:', itemsError);
      return;
    }

    // Calculate muscle group XP and gold gains
    const muscleGroupGains = exercises.reduce((acc, exercise) => {
      const completedSets = exercise.sets.filter(set => set.completed).length;
      if (completedSets === 0) return acc;

      // Find the exercise in commonWorkoutsData to get its muscle group
      const commonExercise = commonWorkoutsData.categories
        .flatMap(cat => cat.exercises)
        .find(ex => ex.name === exercise.name);

      if (commonExercise) {
        const muscleGroups = commonExercise.muscle.toLowerCase();
        const xpPerSet = 10; // Base XP per set
        const goldPerSet = 2; // Base gold per set

        // Determine primary muscle group based on the category the exercise is in
        const primaryCategory = commonWorkoutsData.categories.find(cat => 
          cat.exercises.some(ex => ex.name === exercise.name)
        )?.name.toLowerCase();

        // Only apply XP to the primary muscle group
        if (primaryCategory) {
          const xpBonus = equippedItems?.length ? equippedItems.reduce((bonus, item) => {
            const xpBonus = item.items?.xp_bonus;
            if (xpBonus?.muscle_group === 'all' || xpBonus?.muscle_group === primaryCategory) {
              return bonus + xpBonus.bonus;
            }
            return bonus;
          }, 0) : 0;
          const goldBonus = equippedItems?.length ? equippedItems.reduce((bonus, item) => {
            const goldBonus = item.items?.gold_bonus;
            if (goldBonus?.muscle_group === 'all' || goldBonus?.muscle_group === primaryCategory) {
              return bonus + goldBonus.bonus;
            }
            return bonus;
          }, 0) : 0;

          // Map category names to the correct stat fields
          const statField = primaryCategory === 'chest' ? 'chest' :
                           primaryCategory === 'back' ? 'back' :
                           primaryCategory === 'legs' ? 'legs' :
                           primaryCategory === 'shoulders' ? 'shoulders' :
                           primaryCategory === 'arms' ? 'arms' :
                           primaryCategory === 'core' ? 'core' :
                           primaryCategory === 'cardio' ? 'cardio' : null;

          if (statField) {
            acc[`${statField}_xp`] += completedSets * xpPerSet * (1 + xpBonus / 100);
            acc[`${statField}_gold`] += completedSets * goldPerSet * (1 + goldBonus / 100);
          }
        }
      }

      return acc;
    }, {
      chest_xp: 0,
      back_xp: 0,
      legs_xp: 0,
      shoulders_xp: 0,
      arms_xp: 0,
      core_xp: 0,
      cardio_xp: 0,
      chest_gold: 0,
      back_gold: 0,
      legs_gold: 0,
      shoulders_gold: 0,
      arms_gold: 0,
      core_gold: 0,
      cardio_gold: 0
    });

    // Calculate total XP and gold gains
    const totalXPGain = Object.entries(muscleGroupGains)
      .filter(([key]) => key.endsWith('_xp'))
      .reduce((sum, [_, xp]) => sum + xp, 0);
    const totalGoldGain = Object.entries(muscleGroupGains)
      .filter(([key]) => key.endsWith('_gold'))
      .reduce((sum, [_, gold]) => sum + gold, 0);

    // Calculate new XP and check for level up
    const newXP = (currentStats?.xp || 0) + totalXPGain;
    const currentLevel = currentStats?.level || 1;
    const requiredXP = calculateRequiredXP(currentLevel);
    const newLevel = newXP >= requiredXP ? currentLevel + 1 : currentLevel;

    // Update user stats with muscle group XP and gold
    const { error: updateError } = await supabase
      .from('user_stats')
      .upsert({
        user_id: user.id,
        xp: Math.round(newXP),
        gold: Math.round((currentStats?.gold || 0) + totalGoldGain),
        level: newLevel,
        chest_xp: Math.round((currentStats?.chest_xp || 0) + muscleGroupGains.chest_xp),
        back_xp: Math.round((currentStats?.back_xp || 0) + muscleGroupGains.back_xp),
        legs_xp: Math.round((currentStats?.legs_xp || 0) + muscleGroupGains.legs_xp),
        shoulders_xp: Math.round((currentStats?.shoulders_xp || 0) + muscleGroupGains.shoulders_xp),
        arms_xp: Math.round((currentStats?.arms_xp || 0) + muscleGroupGains.arms_xp),
        core_xp: Math.round((currentStats?.core_xp || 0) + muscleGroupGains.core_xp),
        cardio_xp: Math.round((currentStats?.cardio_xp || 0) + muscleGroupGains.cardio_xp),
        last_updated: new Date().toISOString()
      });

    if (updateError) {
      console.error('Error updating user stats:', updateError);
    }

    return {
      xpGain: totalXPGain,
      goldGain: totalGoldGain,
      newLevel,
      leveledUp: newLevel > currentLevel,
      newXP,
      itemBonuses: equippedItems?.map(item => ({
        name: item.items?.name || '',
        effect: item.items?.effect || ''
      })) || [],
      muscleGroupGains: {
        chest: { xp: Math.floor(muscleGroupGains.chest_xp), gold: Math.floor(muscleGroupGains.chest_gold) },
        back: { xp: Math.floor(muscleGroupGains.back_xp), gold: Math.floor(muscleGroupGains.back_gold) },
        legs: { xp: Math.floor(muscleGroupGains.legs_xp), gold: Math.floor(muscleGroupGains.legs_gold) },
        shoulders: { xp: Math.floor(muscleGroupGains.shoulders_xp), gold: Math.floor(muscleGroupGains.shoulders_gold) },
        arms: { xp: Math.floor(muscleGroupGains.arms_xp), gold: Math.floor(muscleGroupGains.arms_gold) },
        core: { xp: Math.floor(muscleGroupGains.core_xp), gold: Math.floor(muscleGroupGains.core_gold) },
        cardio: { xp: Math.floor(muscleGroupGains.cardio_xp), gold: Math.floor(muscleGroupGains.cardio_gold) }
      },
      equippedItems: equippedItems?.map(item => ({
        name: item.items?.name || '',
        image: item.items?.name ? getItemImage(item.items.name) : null,
        xpBonus: item.items?.xp_bonus || null,
        goldBonus: item.items?.gold_bonus || null
      })) || []
    };
  };

  const finishWorkout = async () => {
    if (!user) {
      console.error('No user found');
      return;
    }

    // Validate all sets before saving
    const invalidSets = exercises.flatMap(exercise => {
      return exercise.sets.filter(set => {
        if (set.completed) {
          // Check for missing required fields
          if (exercise.type === 'standard' && (!set.reps || !set.weight)) {
            return true;
          }
          if (exercise.type === 'bodyweight' && !set.reps) {
            return true;
          }
          if (exercise.type === 'timed' && !set.duration) {
            return true;
          }

          // Check for exceeded limits
          if (exercise.type === 'standard' || exercise.type === 'bodyweight') {
            const reps = parseInt(set.reps || '0');
            if (reps > 100) {
              return true;
            }
            if (exercise.type === 'standard') {
              const weight = parseFloat(set.weight || '0');
              const volume = reps * weight;
              if (volume > 20000) {
                return true;
              }
            }
          }
        }
        return false;
      }).map(set => ({
        exerciseName: exercise.name,
        setNumber: exercise.sets.indexOf(set) + 1,
        type: exercise.type,
        reps: set.reps,
        weight: set.weight,
        error: (() => {
          if (!set.reps && !set.weight) return 'reps and weight required';
          if (!set.reps) return 'reps required';
          if (!set.weight) return 'weight required';
          if (parseInt(set.reps) > 100) return 'reps cannot exceed 100';
          if (exercise.type === 'standard' && parseFloat(set.weight) * parseInt(set.reps) > 20000) {
            return 'volume (reps × weight) cannot exceed 20,000';
          }
          return '';
        })()
      }));
    });

    if (invalidSets.length > 0) {
      // Show error message with details about invalid sets
      const errorMessage = `Please fix the following sets:\n${invalidSets.map(set => 
        `- ${set.exerciseName} (Set ${set.setNumber}): ${set.error}`
      ).join('\n')}`;
      
      Alert.alert(
        'Invalid Sets',
        errorMessage,
        [{ text: 'OK' }]
      );
      return;
    }

    setIsSaving(true);
    try {
      // Calculate total sets, reps, and volume for XP/gold calculation
      const totalSets = exercises.reduce((sum, exercise) => 
        sum + exercise.sets.filter(set => set.completed).length, 0
      );
      const totalReps = exercises.reduce((sum, exercise) => 
        sum + exercise.sets.filter(set => set.completed).reduce((s, set) => 
          s + (set.reps ? parseInt(set.reps) : 0), 0
        ), 0
      );
      const totalVolume = exercises.reduce((sum, exercise) => 
        sum + exercise.sets.filter(set => set.completed).reduce((s, set) => {
          if (exercise.type === 'standard' && set.weight && set.reps) {
            return s + (parseInt(set.reps) * parseFloat(set.weight));
          } else if (exercise.type === 'bodyweight' && set.reps) {
            return s + parseInt(set.reps);
          } else if (exercise.type === 'timed' && set.duration) {
            return s + parseInt(set.duration);
          }
          return s;
        }, 0), 0
      );

      // 1. Create the workout record
      const { data: workoutData, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          user_id: user.id,
          notes: notes,
          duration: Math.floor(time / 60), // Convert seconds to minutes
        })
        .select()
        .single();

      if (workoutError) {
        console.error('Workout error:', workoutError);
        throw workoutError;
      }

      // 2. Create exercise records
      for (const exercise of exercises) {
        const { data: exerciseData, error: exerciseError } = await supabase
          .from('exercises')
          .insert({
            workout_id: workoutData.id,
            name: exercise.name,
            type: exercise.type,
          })
          .select()
          .single();

        if (exerciseError) throw exerciseError;

        // 3. Create set records
        for (const set of exercise.sets) {
          if (!set.completed) continue; // Skip incomplete sets

          // Parse duration string into minutes if it exists
          let durationInMinutes = null;
          if (set.duration) {
            const [minutes, seconds] = set.duration.split(':').map(Number);
            durationInMinutes = Math.round(minutes + (seconds / 60)); // Round to nearest integer
          }

          const { error: setError } = await supabase
            .from('sets')
            .insert({
              exercise_id: exerciseData.id,
              reps: set.reps ? parseInt(set.reps) : null,
              weight: set.weight ? parseFloat(set.weight) : null,
              duration: durationInMinutes,
              distance: set.distance ? parseFloat(set.distance) : null,
              completed: set.completed,
            });

          if (setError) throw setError;
        }
      }

      // 4. Update user stats with XP and gold
      const statsUpdate = await updateUserStats(totalSets);

      // Set completion stats for the modal
      setCompletionStats({
        totalSets,
        totalReps,
        totalVolume: Math.round(totalVolume),
        xpGain: statsUpdate?.xpGain || 0,
        goldGain: statsUpdate?.goldGain || 0,
        currentLevel: statsUpdate?.newLevel || 1,
        newLevel: statsUpdate?.newLevel || 1,
        currentXP: statsUpdate?.newXP || 0,
        requiredXP: calculateRequiredXP(statsUpdate?.newLevel || 1),
        itemBonuses: statsUpdate?.itemBonuses || [],
        muscleGroupGains: statsUpdate?.muscleGroupGains || {
          chest: { xp: 0, gold: 0 },
          back: { xp: 0, gold: 0 },
          legs: { xp: 0, gold: 0 },
          shoulders: { xp: 0, gold: 0 },
          arms: { xp: 0, gold: 0 },
          core: { xp: 0, gold: 0 },
          cardio: { xp: 0, gold: 0 }
        },
        equippedItems: statsUpdate?.equippedItems || []
      });

      // Show completion modal
      setShowCompletionModal(true);

      // Reset the workout state
      setIsWorkoutActive(false);
      setExercises([]);
      setNotes('');
      setTime(0);

    } catch (error) {
      console.error('Error saving workout:', error);
      Alert.alert(
        'Error',
        'Failed to save workout. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSaving(false);
    }
  };

  const resetTimer = () => {
    setTime(0);
  };

  const applyDurationFilter = (filters: any) => {
    setDurationFilter(filters.duration);
  };

  const filterWorkouts = (workouts: any[]) => {
    let filtered = workouts;
    
    if (selectedCategory && selectedCategory !== 'All') {
      filtered = filtered.filter(workout => workout.category === selectedCategory);
    }
    
    if (durationFilter) {
      filtered = filtered.filter(workout => {
        const duration = parseInt(workout.duration);
        if (durationFilter === '60+') {
          return duration > 60;
        }
        const maxDuration = parseInt(durationFilter);
        return duration <= maxDuration;
      });
    }
    
    return filtered;
  };

  const handleCancelWorkout = () => {
    setIsWorkoutActive(false);
    setExercises([]);
    setNotes('');
    setTime(0);
  };

  // Add function to fetch recent workouts
  const fetchRecentWorkouts = async () => {
    if (!user) return;
    
    try {
      const { data: workouts, error } = await supabase
        .from('workouts')
        .select(`
          id,
          created_at,
          notes,
          exercises (
            id,
            name,
            type,
            sets (
              id,
              reps,
              weight,
              duration,
              distance,
              completed
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentWorkouts(workouts || []);
    } catch (error) {
      console.error('Error fetching recent workouts:', error);
    }
  };

  // Add function to import a workout
  const importWorkout = (workout: Workout) => {
    const importedExercises = workout.exercises.map(exercise => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: exercise.name,
      type: exercise.type,
      sets: exercise.sets.map(set => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        completed: false,
        reps: set.reps?.toString() || '',
        weight: set.weight?.toString() || '',
        duration: set.duration?.toString() || '',
        distance: set.distance?.toString() || ''
      }))
    }));

    setExercises(importedExercises);
    setNotes(workout.notes || '');
    setShowImportModal(false);
    setIsWorkoutActive(true);
  };

  // Add useEffect to fetch recent workouts when component mounts
  useEffect(() => {
    fetchRecentWorkouts();
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ThemedView style={[styles.mainContentContainer, { paddingTop: insets.top }]}>
          <TopWorkoutControlPanel 
            time={time} 
            onFinish={finishWorkout}
            onReset={resetTimer}
            onCancel={handleCancelWorkout}
            isWorkoutActive={isWorkoutActive} 
            isSaving={isSaving}
          />

          {!isWorkoutActive ? (
            <View style={styles.startButtonsContainer}>
              <TouchableOpacity 
                style={styles.startButton}
                onPress={startWorkout}
                activeOpacity={0.7}
              >
                <ThemedText style={styles.startButtonText}>Start Workout</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.importButton}
                onPress={() => setShowImportModal(true)}
                activeOpacity={0.7}
              >
                <IconSymbol name="arrow.down.circle" size={20} color={Colors[colorScheme].tint} />
                <ThemedText style={styles.importButtonText}>Import Previous Routine</ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView 
              contentContainerStyle={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <FlatList
                data={filterWorkouts(exercises)}
                renderItem={({ item }) => (
                  <ExerciseItem 
                    item={item} 
                    onUpdateName={updateExerciseName} 
                    onAddSet={addSet}
                    onUpdateSet={updateSet}
                    onRemoveSet={removeSet}
                    onRemoveExercise={removeExercise}
                  />
                )}
                keyExtractor={(item, index) => item.id + index}
                style={styles.exerciseList}
                scrollEnabled={false}
                ListFooterComponent={() => {
                  if (!isWorkoutActive) return null;
                  return (
                    <TouchableOpacity style={styles.addButton} onPress={addExercise}>
                      <IconSymbol name="plus.circle.fill" size={20} color={Colors[colorScheme].tint} />
                      <ThemedText style={styles.addButtonText}> Add Exercise</ThemedText>
                    </TouchableOpacity>
                  );
                }}
              />

              {isWorkoutActive && (
                <TextInput
                  style={styles.notesInput}
                  placeholder="Workout Notes (Optional)"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  placeholderTextColor={Colors[colorScheme].placeholderText}
                />
              )}
            </ScrollView>
          )}
        </ThemedView>
      </TouchableWithoutFeedback>

      {/* Add Import Modal */}
      <Modal
        visible={showImportModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.importModal}>
            <ThemedText style={styles.importModalTitle}>Select a Previous Workout</ThemedText>
            <ScrollView style={styles.importModalList}>
              {recentWorkouts.map((workout) => (
                <TouchableOpacity
                  key={workout.id}
                  style={styles.importWorkoutItem}
                  onPress={() => importWorkout(workout)}
                >
                  <ThemedText style={styles.importWorkoutDate}>
                    {new Date(workout.created_at).toLocaleDateString()}
                  </ThemedText>
                  <ThemedText style={styles.importWorkoutExercises}>
                    {workout.exercises.length} exercises
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.importModalCloseButton}
              onPress={() => setShowImportModal(false)}
            >
              <ThemedText style={styles.importModalCloseButtonText}>Cancel</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={false}
        visible={isBrowsingModalVisible}
        onRequestClose={() => {
          setIsBrowsingModalVisible(false);
          setSearchTerm('');
        }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ThemedView style={styles.modalContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search exercises..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholderTextColor={Colors[colorScheme].placeholderText}
            />

            <View style={styles.filterContainer}>
              <View style={styles.filterGrid}>
                {workoutCategories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.filterButton,
                      selectedCategory === category || (category === 'All' && !selectedCategory) ? styles.filterButtonActive : null,
                    ]}
                    onPress={() => setSelectedCategory(category === 'All' ? null : category)}
                  >
                    <ThemedText style={[
                      styles.filterButtonText,
                      selectedCategory === category || (category === 'All' && !selectedCategory) ? styles.filterButtonTextActive : null,
                    ]}>
                      {category}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <SectionList
              sections={filteredWorkoutData}
              keyExtractor={(item, index) => item.name + index}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => addSelectedExercise(item)}>
                  <ThemedText style={styles.modalItemText}>{item.name}</ThemedText>
                  <ThemedText style={styles.modalItemSubText}>{item.muscle} {item.equipment ? `(${item.equipment})` : ''}</ThemedText>
                </TouchableOpacity>
              )}
              renderSectionHeader={({ section: { title } }) => (
                <ThemedText style={styles.modalSectionHeader}>{title}</ThemedText>
              )}
              stickySectionHeadersEnabled={false}
              style={styles.modalList}
              indicatorStyle={colorScheme === 'dark' ? 'white' : 'black'}
            />
            <TouchableOpacity style={styles.closeButton} onPress={() => { setIsBrowsingModalVisible(false); setSearchTerm(''); setSelectedCategory(null); }}>
              <ThemedText style={styles.closeButtonText}>Close</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </TouchableWithoutFeedback>
      </Modal>

      <DurationFilterModal
        visible={isDurationFilterVisible}
        onClose={() => setDurationFilterVisible(false)}
        onApplyFilters={applyDurationFilter}
      />

      <WorkoutCompletionModal
        visible={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        stats={completionStats || {
          totalSets: 0,
          totalReps: 0,
          totalVolume: 0,
          xpGain: 0,
          goldGain: 0,
          currentLevel: 1,
          newLevel: 1,
          currentXP: 0,
          requiredXP: 100,
          itemBonuses: [],
          muscleGroupGains: {
            chest: { xp: 0, gold: 0 },
            back: { xp: 0, gold: 0 },
            legs: { xp: 0, gold: 0 },
            shoulders: { xp: 0, gold: 0 },
            arms: { xp: 0, gold: 0 },
            core: { xp: 0, gold: 0 },
            cardio: { xp: 0, gold: 0 }
          },
          equippedItems: []
        }}
      />
    </KeyboardAvoidingView>
  );
}

const getStyles = (colorScheme: 'light' | 'dark') => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors[colorScheme].background,
  },
  mainContentContainer: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  innerContainer: {
  },
  title: {
    marginBottom: 25,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
  },
  exerciseList: {
    marginBottom: 20,
  },
  exercisePanel: {
    backgroundColor: Colors[colorScheme].cardBackground,
    borderRadius: 10,
    marginBottom: 15,
    padding: 15,
    shadowColor: '#000', // Basic shadow for panel effect
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  exercisePanelCompleted: {
    backgroundColor: Colors[colorScheme].secondaryBackground,
    opacity: 0.7, // Make it slightly faded
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 5,
  },
  minimizeTouchable: { // Touchable area for minimizing
    flexDirection: 'row',
    flex: 1, // Take most space
    alignItems: 'center',
    marginRight: 10, // Space before delete button
  },
  exerciseNameInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: Colors[colorScheme].text,
    // Removed marginRight here, handled by minimizeTouchable
    paddingVertical: 5,
  },
  chevronIcon: { // Style for chevron
    marginLeft: 5,
  },
  deleteExerciseButton: { // Style for delete button
    padding: 8, 
  },
  checkmarkButton: {
    padding: 5, // Easier to tap
  },
  panelBodySetsContainer: {
    gap: 5,
    paddingTop: 5,
  },
  setRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    paddingHorizontal: 5,
  },
  setRowHeaderText: {
    flex: 1,
    textAlign: 'left',
    fontSize: 11,
    color: Colors[colorScheme].placeholderText,
    fontWeight: '500',
    paddingHorizontal: 8,
  },
  setRowHeaderTextAction: {
    flexBasis: 30,
    flexGrow: 0,
    flexShrink: 0,
  },
  setRowHeaderTextReps: {
    flex: 0.8,
    textAlign: 'left',
    fontSize: 11,
    color: Colors[colorScheme].placeholderText,
    fontWeight: '500',
    paddingHorizontal: 0,
    marginLeft: -18,
  },
  setRowHeaderTextWeight: {
    flex: 1,
    textAlign: 'right',
    fontSize: 11,
    color: Colors[colorScheme].placeholderText,
    fontWeight: '500',
    paddingHorizontal: 0,
    marginRight: -4,
  },
  setRowHeaderTextDone: {
    flex: 1,
    textAlign: 'right',
    fontSize: 11,
    color: Colors[colorScheme].placeholderText,
    fontWeight: '500',
    paddingHorizontal: 2,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', 
    gap: 5,
    marginBottom: 5,
    paddingVertical: 3,
    paddingHorizontal: 5,
    borderRadius: 6,
    backgroundColor: Colors[colorScheme].secondaryBackground,
  },
  setRowCompleted: {
    backgroundColor: Colors[colorScheme].background,
    opacity: 0.6,
  },
  removeSetButton: {
    padding: 5,
    minWidth: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors[colorScheme].text,
    minWidth: 25,
    textAlign: 'center',
  },
  setInput: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 14,
  },
  setCheckmarkButton: {
    padding: 5,
    minWidth: 30,
    alignItems: 'center',
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors[colorScheme].tint,
    borderStyle: 'dashed',
  },
  addSetText: {
    fontSize: 14,
    color: Colors[colorScheme].tint,
    marginLeft: 4,
  },
  exerciseInput: {
    borderWidth: 1,
    borderColor: Colors[colorScheme].inputBorder,
    borderRadius: 8,
    fontSize: 15, 
    backgroundColor: Colors[colorScheme].inputBackground,
    color: Colors[colorScheme].inputText,
  },
  numericInput: {
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors[colorScheme].tint,
    marginBottom: 25,
    backgroundColor: Colors[colorScheme].secondaryBackground,
  },
  addButtonText: {
    color: Colors[colorScheme].tint,
    marginLeft: 8,
    fontWeight: 'bold',
    fontSize: 16,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: Colors[colorScheme].inputBorder,
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    marginBottom: 25,
    textAlignVertical: 'top',
    backgroundColor: Colors[colorScheme].inputBackground,
    color: Colors[colorScheme].inputText,
    fontSize: 15,
  },
  modalContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    backgroundColor: Colors[colorScheme].background,
  },
  searchInput: {
    height: 45,
    borderColor: Colors[colorScheme].inputBorder,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginHorizontal: 15,
    marginBottom: 15,
    backgroundColor: Colors[colorScheme].inputBackground,
    color: Colors[colorScheme].inputText,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  filterContainer: {
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1, 
    borderBottomColor: Colors[colorScheme].borderColor,
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 10,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors[colorScheme].secondaryBackground,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: Colors[colorScheme].tint,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors[colorScheme].text,
  },
  filterButtonTextActive: {
    color: Colors[colorScheme].background,
  },
  modalList: {
    flex: 1,
    paddingHorizontal: 15,
  },
  modalSectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 10,
    color: Colors[colorScheme].text,
    backgroundColor: Colors[colorScheme].background,
  },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: Colors[colorScheme].cardBackground,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modalItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors[colorScheme].text,
    marginBottom: 4,
  },
  modalItemSubText: {
    fontSize: 14,
    color: Colors[colorScheme].placeholderText,
  },
  closeButton: {
    backgroundColor: Colors[colorScheme].danger,
    marginHorizontal: 15,
    marginBottom: Platform.OS === 'ios' ? 30 : 20,
    marginTop: 10,
    paddingVertical: 16, 
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Style for the top control panel
  topPanelContainer: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors[colorScheme].borderColor,
    marginBottom: 15,
  },
  topPanelInactive: {
    backgroundColor: Colors[colorScheme].secondaryBackground,
    justifyContent: 'center',
  },
  topPanelActive: {
    backgroundColor: Colors[colorScheme].secondaryBackground,
  },
  timerText: { 
    fontSize: 24,
    fontWeight: '600',
    color: Colors[colorScheme].danger,
  },
  panelActionText: { 
    fontSize: 20, 
    fontWeight: 'bold',
    color: Colors[colorScheme].tint,
  },
  singleSetInput: { // Style for bodyweight reps input
    flex: 2.2, // Take up space of Reps and Weight
  },
  singleSetInputHeader: { // Style for bodyweight reps header
    flex: 2.2, // Match input flex
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resetButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors[colorScheme].secondaryBackground,
  },
  cancelWorkoutButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors[colorScheme].secondaryBackground,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  confirmationModal: {
    backgroundColor: Colors[colorScheme].cardBackground,
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  confirmationText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: Colors[colorScheme].placeholderText,
  },
  confirmationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  confirmationButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors[colorScheme].secondaryBackground,
  },
  confirmButton: {
    backgroundColor: Colors[colorScheme].danger,
  },
  cancelButtonText: {
    color: Colors[colorScheme].text,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '600',
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
  durationButton: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors[colorScheme].borderColor,
  },
  durationButtonActive: {
    backgroundColor: Colors[colorScheme].tint,
    borderColor: Colors[colorScheme].tint,
  },
  durationButtonText: {
    fontSize: 16,
    textAlign: 'center',
  },
  durationButtonTextActive: {
    color: colorScheme === 'dark' ? Colors.dark.buttonTextPrimary : Colors.light.buttonTextPrimary,
    fontWeight: 'bold',
  },
  modalButtons: {
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
  startButtonsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors[colorScheme].tint,
    marginBottom: 25,
    backgroundColor: Colors[colorScheme].secondaryBackground,
  },
  startButtonText: {
    color: Colors[colorScheme].tint,
    marginLeft: 12,
    fontWeight: 'bold',
    fontSize: 20,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors[colorScheme].tint,
    backgroundColor: Colors[colorScheme].secondaryBackground,
  },
  importButtonText: {
    color: Colors[colorScheme].tint,
    marginLeft: 8,
    fontWeight: 'bold',
    fontSize: 16,
  },
  importModal: {
    width: '80%',
    maxHeight: '80%',
    backgroundColor: Colors[colorScheme].cardBackground,
    borderRadius: 12,
    padding: 20,
  },
  importModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  importModalList: {
    maxHeight: '70%',
  },
  importWorkoutItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors[colorScheme].borderColor,
  },
  importWorkoutDate: {
    fontSize: 16,
    fontWeight: '600',
  },
  importWorkoutExercises: {
    fontSize: 14,
    color: Colors[colorScheme].placeholderText,
    marginTop: 4,
  },
  importModalCloseButton: {
    marginTop: 15,
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors[colorScheme].secondaryBackground,
    alignItems: 'center',
  },
  importModalCloseButtonText: {
    color: Colors[colorScheme].text,
    fontWeight: '600',
  },
}); 