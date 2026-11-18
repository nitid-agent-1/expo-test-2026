import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { colors } from '@/constants/theme';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello, world!</Text>
      <View style={styles.buttons}>
        <PrimaryButton title="Read a poem" onPress={() => router.push('/poem')} />
        <PrimaryButton title="About this app" variant="outline" onPress={() => router.push('/about')} />
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
