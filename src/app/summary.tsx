import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { feelingLabel, isFeelingId, LIKE_OPTIONS } from '@/constants/quiz';
import { colors } from '@/constants/theme';
import { copy } from '@/copy';
import { NarrationScrollView } from '@/narration/NarrationScrollView';
import { NarrationSection } from '@/narration/NarrationSection';
import { summaryScript } from '@/narration/scripts';
import { useScreenNarration } from '@/narration/useScreenNarration';

export default function SummaryScreen() {
  const params = useLocalSearchParams<{ liked?: string; feelings?: string }>();
  const likedOption = LIKE_OPTIONS.find((o) => o.value === params.liked);
  const feelingsParam = params.feelings ?? '';
  const feelings = useMemo(() => feelingsParam.split(',').filter(isFeelingId), [feelingsParam]);

  const script = useMemo(() => summaryScript(likedOption?.value, feelings), [likedOption, feelings]);
  useScreenNarration(script);

  return (
    <NarrationScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <NarrationSection id="summary.heading" style={styles.heading}>
        <Text style={styles.title} accessibilityRole="header">
          {copy.summary.title}
        </Text>
        <Text style={styles.subtitle}>{copy.summary.subtitle}</Text>
      </NarrationSection>

      <View style={styles.card}>
        <NarrationSection id="summary.liked" style={[styles.item, styles.itemDivider]}>
          <Text style={styles.question}>{copy.summary.likedQuestion}</Text>
          <Text style={styles.answer}>{likedOption?.label ?? copy.summary.noAnswer}</Text>
        </NarrationSection>
        <NarrationSection id="summary.feelings" style={styles.item}>
          <Text style={styles.question}>{copy.summary.feelingsQuestion}</Text>
          <View style={styles.chips}>
            {feelings.map((feeling) => (
              <Text key={feeling} style={styles.chip}>
                {feelingLabel(feeling)}
              </Text>
            ))}
          </View>
        </NarrationSection>
      </View>

      {/* dismissTo('/') pops back to the original Home screen, which unmounts the questions and clears the answers. */}
      <NarrationSection id="summary.backHome">
        <PrimaryButton title={copy.summary.backHome} onPress={() => router.dismissTo('/')} />
      </NarrationSection>
    </NarrationScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 24, paddingVertical: 32, gap: 24 },
  heading: { gap: 6 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.3, color: colors.text },
  subtitle: { fontSize: 16, color: colors.textMuted },
  card: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 12 },
  item: { padding: 16, gap: 8 },
  itemDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  question: { fontSize: 14, color: colors.textMuted },
  answer: { fontSize: 18, fontWeight: '600', color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: colors.accentTint,
    color: colors.accentDark,
    fontSize: 15,
    fontWeight: '600',
  },
});
