import { Stack } from 'expo-router';

export default function HomeLayout() {
  return (
    <Stack initialRouteName="home">
      <Stack.Screen
        name="home"
        options={{ headerShown: false, gestureEnabled: false, animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="focus-session"
        options={{ headerShown: false, animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="paywall"
        options={{
          headerShown: false,
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="timer"
        options={{
          headerShown: false,
          gestureEnabled: false,
          animation: 'fade',
          presentation: 'fullScreenModal',
        }}
      />
      <Stack.Screen
        name="session-complete"
        options={{ headerShown: false, gestureEnabled: false, animation: 'slide_from_right' }}
      />
    </Stack>
  );
}
