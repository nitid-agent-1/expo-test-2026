import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ChoiceRow } from '@/components/ChoiceRow';
import { PrimaryButton } from '@/components/PrimaryButton';
import { FEELINGS, LIKE_OPTIONS, type LikeAnswer } from '@/constants/quiz';
import { colors } from '@/constants/theme';

export default function QuestionsScreen() {
  const [liked, setLiked] = useState<LikeAnswer | null>(null);
  const [feelings, setFeelings] = useState<string[]>([]);

  const toggleFeeling = (feeling: string) =>
    setFeelings((current) =>
      current.includes(feeling) ? current.filter((f) => f !== feeling) : [...current, feeling],
    );

  const canFinish = liked !== null && feelings.length > 0;

  const onDone = () => {
    if (!canFinish) return;
    // Keep the order the options are listed in, not the order they were tapped.
    const ordered = FEELINGS.filter((f) => feelings.includes(f));
    router.push({ pathname: '/summary', params: { liked, feelings: ordered.join(',') } });
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic">
      <View style={styles.question} accessibilityRole="radiogroup">
        <Text style={styles.prompt} accessibilityRole="header">
          1. Did you like the poem?
        </Text>
        <View style={styles.grid}>
          {LIKE_OPTIONS.map((option) => (
            <View key={option.value} style={styles.cell}>
              <ChoiceRow
                kind="radio"
                label={option.label}
                selected={liked === option.value}
                onPress={() => setLiked(option.value)}
              />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.question}>
        <Text style={styles.prompt} accessibilityRole="header">
          2. How do you feel today?
        </Text>
        <Text style={styles.hint}>Choose all that apply.</Text>
        <View style={styles.grid}>
          {FEELINGS.map((feeling) => (
            <View key={feeling} style={styles.cell}>
              <ChoiceRow
                kind="checkbox"
                label={feeling}
                selected={feelings.includes(feeling)}
                onPress={() => toggleFeeling(feeling)}
              />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton title="Done" onPress={onDone} disabled={!canFinish} />
        {!canFinish && <Text style={styles.footerHint}>Answer both questions to continue.</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingBottom: 48, gap: 28 },
  question: { gap: 12 },
  prompt: { fontSize: 20, fontWeight: '600', color: colors.text },
  hint: { fontSize: 15, color: colors.textMuted, marginTop: -4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6, rowGap: 12 },
  cell: { width: '50%', paddingHorizontal: 6, flexDirection: 'row' },
  footer: { gap: 8, marginTop: 4 },
  footerHint: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
});
