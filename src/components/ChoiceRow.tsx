import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';

type Props = {
  label: string;
  selected: boolean;
  kind: 'radio' | 'checkbox';
  onPress: () => void;
};

export function ChoiceRow({ label, selected, kind, onPress }: Props) {
  const isRadio = kind === 'radio';
  return (
    <Pressable
      accessibilityRole={isRadio ? 'radio' : 'checkbox'}
      accessibilityState={isRadio ? { selected } : { checked: selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.row, selected && styles.rowSelected, pressed && styles.pressed]}>
      <View
        style={[
          styles.indicator,
          isRadio ? styles.radio : styles.checkbox,
          selected && styles.indicatorSelected,
        ]}>
        {selected && (isRadio ? <View style={styles.radioDot} /> : <Text style={styles.check}>✓</Text>)}
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flex: 1,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  rowSelected: { borderWidth: 2, borderColor: colors.accent, backgroundColor: colors.accentTint },
  pressed: { opacity: 0.8 },
  indicator: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  radio: { borderRadius: 11 },
  checkbox: { borderRadius: 5 },
  indicatorSelected: { borderColor: colors.accent },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
  check: { color: colors.accent, fontSize: 15, fontWeight: '800', lineHeight: 18 },
  label: { flexShrink: 1, fontSize: 17, color: colors.text },
});
