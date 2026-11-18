import Constants from 'expo-constants';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';

export default function AboutScreen() {
  const rows = [
    { label: 'Version', value: Constants.expoConfig?.version ?? 'unknown' },
    { label: 'Platform', value: `${Platform.OS} ${String(Platform.Version)}` },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>App name</Text>
      <Text style={styles.appName}>{Constants.expoConfig?.name ?? 'expo-test-2026'}</Text>
      <View style={styles.table}>
        {rows.map((row) => (
          <View key={row.label} style={styles.row}>
            <Text style={[styles.cell, styles.label]}>{row.label}</Text>
            <Text style={styles.cell}>{row.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 24,
    backgroundColor: colors.background,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  appName: { fontSize: 30, fontWeight: '700', letterSpacing: -0.4, color: colors.text, marginBottom: 20 },
  table: { gap: 8 },
  row: { flexDirection: 'row', gap: 16 },
  cell: { width: 120, fontSize: 16, color: colors.text },
  label: { textAlign: 'right', color: colors.textMuted },
});
