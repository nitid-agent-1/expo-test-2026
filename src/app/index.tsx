import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello, world!</Text>
      <Text style={styles.subtitle}>expo-test-2026</Text>
      <Link href="/about" asChild>
        <Pressable style={styles.button} accessibilityRole="button">
          <Text style={styles.buttonText}>About this app</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#fff' },
  title: { fontSize: 32, fontWeight: '700' },
  subtitle: { fontSize: 16, color: '#666' },
  button: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, backgroundColor: '#0a7ea4' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
