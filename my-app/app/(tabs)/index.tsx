import { Redirect } from 'expo-router';

// Remove unused imports
// import { Image, StyleSheet, Platform, TouchableOpacity } from 'react-native';
// import { useRouter } from 'expo-router';
// import { HelloWave } from '@/components/HelloWave';
// import ParallaxScrollView from '@/components/ParallaxScrollView';
// import { ThemedText } from '@/components/ThemedText';
// import { ThemedView } from '@/components/ThemedView';

export default function TabIndexRedirect() {
  // Redirect to the startWorkout screen as the default for the (tabs) group
  return <Redirect href="/(tabs)/startWorkout" />;
}

// Remove unused styles
// const styles = StyleSheet.create({...});
