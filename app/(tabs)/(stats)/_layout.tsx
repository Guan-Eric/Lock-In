import { Stack } from 'expo-router';

export default function StatsLayout() {
  return (
    <Stack initialRouteName="stats">
      <Stack.Screen
        name="stats"
        options={{ headerShown: false, gestureEnabled: false, animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="paywall"
        options={{
          headerShown: false,
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}
