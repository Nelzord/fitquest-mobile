import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Exercise = {
  id: string;
  name: string;
  type: 'standard' | 'bodyweight' | 'timed';
  sets: {
    id: string;
    reps: string | null;
    weight: string | null;
    duration: string | null;
    distance: string | null;
    completed: boolean;
  }[];
};

type Workout = {
  id: string;
  created_at: string;
  notes: string | null;
  duration: number | null;
  exercises: Exercise[];
};

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme() ?? 'light';
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const styles = getStyles(colorScheme);

  useEffect(() => {
    fetchWorkoutDetails();
  }, [id]);

  const fetchWorkoutDetails = async () => {
    try {
      // Fetch workout details
      const { data: workoutData, error: workoutError } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', id)
        .single();

      if (workoutError) throw workoutError;

      // Fetch exercises for this workout
      const { data: exercisesData, error: exercisesError } = await supabase
        .from('exercises')
        .select('*')
        .eq('workout_id', id);

      if (exercisesError) throw exercisesError;

      // Fetch sets for each exercise
      const exercisesWithSets = await Promise.all(
        exercisesData.map(async (exercise) => {
          const { data: setsData, error: setsError } = await supabase
            .from('sets')
            .select('*')
            .eq('exercise_id', exercise.id);

          if (setsError) throw setsError;

          return {
            ...exercise,
            sets: setsData,
          };
        })
      );

      setWorkout({
        ...workoutData,
        exercises: exercisesWithSets,
      });
    } catch (error) {
      console.error('Error fetching workout details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
      </ThemedView>
    );
  }

  if (!workout) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <ThemedText>Workout not found</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color={Colors[colorScheme].tint} />
        </TouchableOpacity>
        <ThemedText style={styles.title}>Workout Details</ThemedText>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <ThemedText style={styles.date}>
            {new Date(workout.created_at).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </ThemedText>
          {workout.duration && (
            <View style={styles.durationContainer}>
              <IconSymbol name="clock" size={16} color={Colors[colorScheme].tint} />
              <ThemedText style={styles.duration}>
                {formatDuration(workout.duration)}
              </ThemedText>
            </View>
          )}

          {workout.notes && (
            <View style={styles.notesContainer}>
              <ThemedText style={styles.notesLabel}>Notes</ThemedText>
              <ThemedText style={styles.notes}>{workout.notes}</ThemedText>
            </View>
          )}

          <View style={styles.exercisesContainer}>
            <ThemedText style={styles.exercisesTitle}>Exercises</ThemedText>
            {workout.exercises.map((exercise) => (
              <View key={exercise.id} style={styles.exerciseItem}>
                <ThemedText style={styles.exerciseName}>{exercise.name}</ThemedText>
                <View style={styles.setsContainer}>
                  {exercise.sets.map((set, index) => (
                    <View key={set.id} style={styles.setItem}>
                      <ThemedText style={styles.setNumber}>Set {index + 1}</ThemedText>
                      {exercise.type === 'standard' && (
                        <>
                          <ThemedText style={styles.setDetail}>
                            {set.reps || '0'} reps
                          </ThemedText>
                          <ThemedText style={styles.setDetail}>
                            {set.weight || '0'} kg
                          </ThemedText>
                        </>
                      )}
                      {exercise.type === 'bodyweight' && (
                        <ThemedText style={styles.setDetail}>
                          {set.reps || '0'} reps
                        </ThemedText>
                      )}
                      {exercise.type === 'timed' && (
                        <>
                          <ThemedText style={styles.setDetail}>
                            {set.duration || '0:00'}
                          </ThemedText>
                          <ThemedText style={styles.setDetail}>
                            {set.distance || '0'} m
                          </ThemedText>
                        </>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const getStyles = (colorScheme: 'light' | 'dark') => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors[colorScheme].background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors[colorScheme].borderColor,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  date: {
    fontSize: 16,
    color: Colors[colorScheme].placeholderText,
    marginBottom: 8,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  duration: {
    fontSize: 16,
    color: Colors[colorScheme].tint,
  },
  notesContainer: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: Colors[colorScheme].secondaryBackground,
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  notes: {
    fontSize: 14,
    color: Colors[colorScheme].placeholderText,
  },
  exercisesContainer: {
    marginBottom: 16,
  },
  exercisesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  exerciseItem: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: Colors[colorScheme].secondaryBackground,
    borderRadius: 8,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  setsContainer: {
    gap: 12,
  },
  setItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 12,
    backgroundColor: Colors[colorScheme].background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors[colorScheme].borderColor,
  },
  setNumber: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 60,
  },
  setDetail: {
    fontSize: 14,
    color: Colors[colorScheme].text,
  },
}); 