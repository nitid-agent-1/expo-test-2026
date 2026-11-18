import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';
import { copy, format } from '@/copy';

import { NARRATION_LANGUAGES } from './languages';
import { useNarration } from './NarrationProvider';

/** Language picker and global mute, shown at the right of every screen's header. */
export function HeaderControls() {
  const { language, muted, toggleMuted } = useNarration();
  const languageName = NARRATION_LANGUAGES.find((l) => l.code === language)?.name ?? language;

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={format(copy.narration.languageButton, { language: languageName })}
        hitSlop={8}
        onPress={() => router.push('/language')}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        <SymbolView name={{ ios: 'globe', android: 'language', web: 'language' }} size={20} tintColor={colors.accent} />
        <Text style={styles.code}>{language.toUpperCase()}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={muted ? copy.narration.unmute : copy.narration.mute}
        hitSlop={8}
        onPress={toggleMuted}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        <SymbolView
          name={
            muted
              ? { ios: 'speaker.slash.fill', android: 'volume_off', web: 'volume_off' }
              : { ios: 'speaker.wave.2.fill', android: 'volume_up', web: 'volume_up' }
          }
          size={20}
          tintColor={colors.accent}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  button: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  pressed: { opacity: 0.6 },
  code: { color: colors.accent, fontSize: 13, fontWeight: '700' },
});
