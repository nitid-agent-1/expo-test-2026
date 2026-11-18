import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { colors } from '@/constants/theme';
import { copy } from '@/copy';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{copy.home.title}</Text>
      <View style={styles.buttons}>
        <PrimaryButton title={copy.home.readPoem} onPress={() => router.push('/poem')} />
        <PrimaryButton title={copy.home.about} variant="outline" onPress={() => router.push('/about')} />
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
