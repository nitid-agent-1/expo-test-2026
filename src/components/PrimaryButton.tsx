import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '@/constants/theme';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'filled' | 'outline';
  disabled?: boolean;
};

export function PrimaryButton({ title, onPress, variant = 'filled', disabled = false }: Props) {
  const outline = variant === 'outline';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        outline ? styles.outline : styles.filled,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}>
      <Text style={[styles.label, outline && styles.outlineLabel, disabled && styles.disabledLabel]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filled: { backgroundColor: colors.accent },
  outline: { borderWidth: 1.5, borderColor: colors.accent, backgroundColor: colors.background },
  disabled: { backgroundColor: colors.disabledBg, borderColor: colors.disabledBg },
  pressed: { opacity: 0.8 },
  label: { color: '#ffffff', fontSize: 17, fontWeight: '600' },
  outlineLabel: { color: colors.accent },
  disabledLabel: { color: colors.textMuted },
});
