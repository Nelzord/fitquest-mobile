import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/ui/IconSymbol';

type Exercise = {
  id: string;
  name: string;
  type: 'standard' | 'bodyweight' | 'timed';
  sets: {
    id: string;
    reps: number | null;
    weight: number | null;
    duration: number | null;
    distance: number | null;
  }[];
};

type Workout = {
  id: string;
  created_at: string;
  notes: string | null;
  duration: number | null;
  exercises: Exercise[];
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

export default function WorkoutDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();

  useEffect(() => {
    fetchWorkoutDetails();
  }, [id]);

  const fetchWorkoutDetails = async () => {
    try {
      const { data: workoutData, error: workoutError } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', id)
        .single();

      if (workoutError) throw workoutError;

      const { data: exercisesData, error: exercisesError } = await supabase
        .from('exercises')
        .select('*, sets(*)')
        .eq('workout_id', id)
        .order('created_at', { ascending: true });

      if (exercisesError) throw exercisesError;

      setWorkout({
        ...workoutData,
        exercises: exercisesData,
      });
    } catch (error) {
      console.error('Error fetching workout details:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderSetDetails = (exercise: Exercise, set: Exercise['sets'][0]) => {
    if (exercise.type === 'standard') {
      return (
        <>
          <ThemedText style={styles.setValue}>{`${set.reps ?? 0} reps`}</ThemedText>
          <ThemedText style={styles.setValue}>{`${set.weight ?? 0} lbs`}</ThemedText>
        </>
      );
    }
    if (exercise.type === 'bodyweight') {
      return <ThemedText style={styles.setValue}>{`${set.reps ?? 0} reps`}</ThemedText>;
    }
    if (exercise.type === 'timed') {
      return (
        <>
          {set.duration !== null && <ThemedText style={styles.setValue}>{`${set.duration} min`}</ThemedText>}
          {set.distance !== null && <ThemedText style={styles.setValue}>{`${set.distance} mi`}</ThemedText>}
        </>
      );
    }
    return null;
  };

  const renderExercise = (exercise: Exercise) => (
    <View key={exercise.id} style={styles.exerciseContainer}>
      <ThemedText style={styles.exerciseName}>{exercise.name}</ThemedText>
      <View style={styles.setsContainer}>
        {exercise.sets.map((set, index) => (
          <View key={set.id} style={styles.setRow}>
            <ThemedText style={styles.setNumber}>{`Set ${index + 1}`}</ThemedText>
            {renderSetDetails(exercise, set)}
          </View>
        ))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={colorScheme ? Colors[colorScheme].tint : Colors.light.tint} />
      </ThemedView>
    );
  }

  if (!workout) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Workout not found</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.dateTimeContainer}>
          <ThemedText style={styles.date}>{formatDate(workout.created_at)}</ThemedText>
          <ThemedText style={styles.time}>{formatTime(workout.created_at)}</ThemedText>
        </View>
        {workout.duration && (
          <View style={styles.durationContainer}>
            <IconSymbol name="clock" size={16} color={colorScheme ? Colors[colorScheme].tint : Colors.light.tint} />
            <ThemedText style={styles.duration}>{`${workout.duration} min`}</ThemedText>
          </View>
        )}
      </View>

      {workout.notes && (
        <View style={styles.notesContainer}>
          <ThemedText style={styles.notes}>{workout.notes}</ThemedText>
        </View>
      )}

      <View style={styles.exercisesContainer}>
        {workout.exercises.map(renderExercise)}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.secondaryBackground,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  date: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  time: {
    fontSize: 16,
    color: Colors.light.placeholderText,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  duration: {
    fontSize: 14,
  },
  notesContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.secondaryBackground,
  },
  notes: {
    fontSize: 14,
    color: Colors.light.placeholderText,
  },
  exercisesContainer: {
    padding: 16,
  },
  exerciseContainer: {
    marginBottom: 24,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  setsContainer: {
    backgroundColor: Colors.light.secondaryBackground,
    borderRadius: 8,
    padding: 8,
  },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.secondaryBackground,
  },
  setNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    minWidth: 60,
  },
  setValue: {
    fontSize: 14,
    marginLeft: 8,
    textAlign: 'right',
    minWidth: 60,
  },
}); 