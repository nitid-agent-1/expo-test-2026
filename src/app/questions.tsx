import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ChoiceRow } from '@/components/ChoiceRow';
import { PrimaryButton } from '@/components/PrimaryButton';
import { FEELING_IDS, type FeelingId, feelingLabel, LIKE_OPTIONS, type LikeAnswer } from '@/constants/quiz';
import { colors } from '@/constants/theme';
import { copy } from '@/copy';
import { useNarration } from '@/narration/NarrationProvider';
import { NarrationScrollView } from '@/narration/NarrationScrollView';
import { NarrationSection } from '@/narration/NarrationSection';
import { questionsScript } from '@/narration/scripts';
import { useScreenNarration } from '@/narration/useScreenNarration';

export default function QuestionsScreen() {
  useScreenNarration(questionsScript);
  const { say } = useNarration();
  const [liked, setLiked] = useState<LikeAnswer | null>(null);
  const [feelings, setFeelings] = useState<FeelingId[]>([]);

  const pickLiked = (value: LikeAnswer) => {
    setLiked(value);
    say({ section: `questions.liked.${value}`, keys: [`questions.liked.selected.${value}`] });
  };

  const toggleFeeling = (feeling: FeelingId) => {
    const selected = !feelings.includes(feeling);
    setFeelings((current) => (selected ? [...current, feeling] : current.filter((f) => f !== feeling)));
    say({
      section: `questions.feelings.${feeling}`,
      keys: [selected ? `questions.feelings.selected.${feeling}` : `questions.feelings.deselected.${feeling}`],
    });
  };

  const canFinish = liked !== null && feelings.length > 0;

  const onDone = () => {
    if (!canFinish) return;
    // Keep the order the options are listed in, not the order they were tapped.
    const ordered = FEELING_IDS.filter((f) => feelings.includes(f));
    router.push({ pathname: '/summary', params: { liked, feelings: ordered.join(',') } });
  };

  return (
    <NarrationScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.question}>
        <NarrationSection id="questions.liked.prompt">
          <Text style={styles.prompt} accessibilityRole="header">
            {copy.questions.liked.prompt}
          </Text>
        </NarrationSection>
        <View style={styles.grid} accessibilityRole="radiogroup">
          {LIKE_OPTIONS.map((option) => (
            <View key={option.value} style={styles.cell}>
              <NarrationSection id={`questions.liked.${option.value}`} style={styles.cellInner}>
                <ChoiceRow
                  kind="radio"
                  label={option.label}
                  selected={liked === option.value}
                  onPress={() => pickLiked(option.value)}
                />
              </NarrationSection>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.question}>
        <NarrationSection id="questions.feelings.prompt" style={styles.promptBlock}>
          <Text style={styles.prompt} accessibilityRole="header">
            {copy.questions.feelings.prompt}
          </Text>
          <Text style={styles.hint}>{copy.questions.feelings.hint}</Text>
        </NarrationSection>
        <View style={styles.grid}>
          {FEELING_IDS.map((feeling) => (
            <View key={feeling} style={styles.cell}>
              <NarrationSection id={`questions.feelings.${feeling}`} style={styles.cellInner}>
                <ChoiceRow
                  kind="checkbox"
                  label={feelingLabel(feeling)}
                  selected={feelings.includes(feeling)}
                  onPress={() => toggleFeeling(feeling)}
                />
              </NarrationSection>
            </View>
          ))}
        </View>
      </View>

      <NarrationSection id="questions.done" style={styles.footer}>
        <PrimaryButton title={copy.questions.done} onPress={onDone} disabled={!canFinish} />
        {!canFinish && <Text style={styles.footerHint}>{copy.questions.doneHint}</Text>}
      </NarrationSection>
    </NarrationScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingBottom: 48, gap: 28 },
  question: { gap: 12 },
  prompt: { fontSize: 20, fontWeight: '600', color: colors.text },
  promptBlock: { gap: 8 },
  hint: { fontSize: 15, color: colors.textMuted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6, rowGap: 12 },
  cell: { width: '50%', paddingHorizontal: 6, flexDirection: 'row' },
  cellInner: { flex: 1, flexDirection: 'row' },
  footer: { gap: 8, marginTop: 4 },
  footerHint: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
});
