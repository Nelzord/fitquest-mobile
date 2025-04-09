import React from 'react';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useLocalSearchParams } from 'expo-router';

export default function WorkoutDetailScreen() {
  // Fetch workout details based on route params
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();

  return (
    <ThemedView style={{ flex: 1, padding: 20 }}>
      <ThemedText type="title">Workout Details</ThemedText>
      <ThemedText>Workout ID: {workoutId}</ThemedText>
      {/* Display full workout details here */}
    </ThemedView>
  );
} 