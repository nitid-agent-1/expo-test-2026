import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { colors } from '@/constants/theme';
import { copy } from '@/copy';

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerTintColor: colors.accent, headerTitleStyle: { color: colors.text } }}>
        <Stack.Screen name="index" options={{ title: copy.nav.home }} />
        <Stack.Screen name="about" options={{ title: copy.nav.about }} />
        <Stack.Screen name="poem" options={{ title: copy.nav.poem }} />
        <Stack.Screen name="questions" options={{ title: copy.nav.questions }} />
        <Stack.Screen
          name="summary"
          options={{ title: copy.nav.summary, headerBackVisible: false, gestureEnabled: false }}
        />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
