import { Redirect } from 'expo-router';

export default function TabIndexRedirect() {
  // Redirect to the startWorkout screen as the default for the (tabs) group
  return <Redirect href="/(tabs)/startWorkout" />;
} 