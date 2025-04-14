import { Redirect } from 'expo-router';

export const screenOptions = {
  tabBarButton: () => null,
};

export default function Index() {
  return <Redirect href="/(tabs)/startWorkout" />;
} 