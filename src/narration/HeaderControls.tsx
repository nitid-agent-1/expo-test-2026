import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';
import { copy, format } from '@/copy';

import { NARRATION_LANGUAGES } from './languages';
import { useNarration, useNarrationProgress, useNarrationState } from './NarrationProvider';

const ICON = 20;
// Buttons are 36pt wide; hitSlop brings each touch target to 44pt.
const HIT_SLOP = 4;

/** A thin bar that fills as the current screen is narrated. Re-renders on its own. */
function ProgressBar() {
  const progress = useNarrationProgress();
  const percent = Math.round(progress * 100);
  return (
    <View
      style={styles.track}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={copy.narration.progress}
      accessibilityValue={{ min: 0, max: 100, now: percent }}>
      <View style={[styles.fill, { width: `${progress * 100}%` }]} />
    </View>
  );
}

/** Narration language, progress, restart and play/pause, shown at the right of every screen's header. */
export function HeaderControls() {
  const { language, togglePlayback, restart } = useNarration();
  const { running } = useNarrationState();
  const languageName = NARRATION_LANGUAGES.find((l) => l.code === language)?.name ?? language;

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={format(copy.narration.languageButton, { language: languageName })}
        hitSlop={HIT_SLOP}
        onPress={() => router.push('/language')}
        style={({ pressed }) => [styles.button, styles.languageButton, pressed && styles.pressed]}>
        <SymbolView name={{ ios: 'globe', android: 'language', web: 'language' }} size={ICON} tintColor={colors.accent} />
        <Text style={styles.code}>{language.toUpperCase()}</Text>
      </Pressable>
      <ProgressBar />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={copy.narration.restart}
        hitSlop={HIT_SLOP}
        onPress={restart}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        <SymbolView
          name={{ ios: 'arrow.counterclockwise', android: 'replay', web: 'replay' }}
          size={ICON}
          tintColor={colors.accent}
        />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={running ? copy.narration.pause : copy.narration.play}
        hitSlop={HIT_SLOP}
        onPress={togglePlayback}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        <SymbolView
          name={
            running
              ? { ios: 'pause.fill', android: 'pause', web: 'pause' }
              : { ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }
          }
          size={ICON}
          tintColor={colors.accent}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  button: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageButton: { width: 'auto', paddingHorizontal: 4, flexDirection: 'row', gap: 3 },
  pressed: { opacity: 0.6 },
  code: { color: colors.accent, fontSize: 13, fontWeight: '700' },
  track: {
    width: 48,
    height: 4,
    marginHorizontal: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 2, backgroundColor: colors.accent },
});
