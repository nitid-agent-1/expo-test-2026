import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ChoiceRow } from '@/components/ChoiceRow';
import { colors } from '@/constants/theme';
import { copy, format } from '@/copy';
import { NARRATION_LANGUAGES } from '@/narration/languages';
import { CLIPS, NARRATED_KEY_COUNT } from '@/narration/clips.generated';
import { useNarration } from '@/narration/NarrationProvider';

export default function LanguageScreen() {
  const { language, setLanguage, screenReaderOn } = useNarration();

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic">
      <Text style={styles.hint}>{copy.narration.pickerHint}</Text>
      {screenReaderOn && <Text style={styles.notice}>{copy.narration.screenReaderOn}</Text>}
      <View style={styles.list} accessibilityRole="radiogroup">
        {NARRATION_LANGUAGES.map((l) => {
          const recorded = Object.keys(CLIPS[l.code] ?? {}).length;
          return (
            <View key={l.code} style={styles.item}>
              <View style={styles.rowWrap}>
                <ChoiceRow
                  kind="radio"
                  label={l.name}
                  selected={language === l.code}
                  onPress={() => {
                    setLanguage(l.code);
                    router.back();
                  }}
                />
              </View>
              <Text style={styles.count}>
                {format(copy.narration.clipCount, { recorded, total: NARRATED_KEY_COUNT })}
              </Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, gap: 16 },
  hint: { fontSize: 16, color: colors.textMuted },
  notice: { fontSize: 15, color: colors.text, fontWeight: '600' },
  list: { gap: 12 },
  item: { gap: 4 },
  rowWrap: { flexDirection: 'row' },
  count: { fontSize: 13, color: colors.textMuted, paddingLeft: 4 },
});
