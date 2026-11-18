import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { colors } from '@/constants/theme';
import { copy } from '@/copy';
import { HeaderControls } from '@/narration/HeaderControls';
import { NarrationProvider } from '@/narration/NarrationProvider';

export default function RootLayout() {
  return (
    <NarrationProvider>
      <Stack
        screenOptions={{
          headerTintColor: colors.accent,
          headerTitleStyle: { color: colors.text },
          headerRight: () => <HeaderControls />,
        }}>
        <Stack.Screen name="index" options={{ title: copy.nav.home }} />
        <Stack.Screen name="about" options={{ title: copy.nav.about }} />
        <Stack.Screen name="poem" options={{ title: copy.nav.poem }} />
        <Stack.Screen name="questions" options={{ title: copy.nav.questions }} />
        <Stack.Screen
          name="summary"
          options={{ title: copy.nav.summary, headerBackVisible: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="language"
          options={{
            title: copy.nav.language,
            presentation: 'formSheet',
            sheetAllowedDetents: [0.5, 1],
            sheetGrabberVisible: true,
            headerRight: () => null,
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </NarrationProvider>
  );
}
