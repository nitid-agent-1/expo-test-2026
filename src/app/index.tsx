import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { colors } from '@/constants/theme';
import { copy } from '@/copy';
import { NarrationSection } from '@/narration/NarrationSection';
import { homeScript } from '@/narration/scripts';
import { useScreenNarration } from '@/narration/useScreenNarration';

export default function HomeScreen() {
  useScreenNarration(homeScript);

  return (
    <View style={styles.container}>
      <NarrationSection id="home.title">
        <Text style={styles.title}>{copy.home.title}</Text>
      </NarrationSection>
      <View style={styles.buttons}>
        <NarrationSection id="home.readPoem">
          <PrimaryButton title={copy.home.readPoem} onPress={() => router.push('/poem')} />
        </NarrationSection>
        <NarrationSection id="home.about">
          <PrimaryButton title={copy.home.about} variant="outline" onPress={() => router.push('/about')} />
        </NarrationSection>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    padding: 24,
    backgroundColor: colors.background,
  },
  title: { fontSize: 34, fontWeight: '700', letterSpacing: -0.5, color: colors.text },
  buttons: { width: 240, gap: 16 },
});
