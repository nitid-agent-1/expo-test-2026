import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { colors } from '@/constants/theme';

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerTintColor: colors.accent, headerTitleStyle: { color: colors.text } }}>
        <Stack.Screen name="index" options={{ title: 'Home' }} />
        <Stack.Screen name="about" options={{ title: 'About' }} />
        <Stack.Screen name="poem" options={{ title: 'Poem' }} />
        <Stack.Screen name="questions" options={{ title: 'Questions' }} />
        <Stack.Screen
          name="summary"
          options={{ title: 'Summary', headerBackVisible: false, gestureEnabled: false }}
        />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
