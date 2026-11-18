import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { LIKE_OPTIONS } from '@/constants/quiz';
import { colors } from '@/constants/theme';

export default function SummaryScreen() {
  const params = useLocalSearchParams<{ liked?: string; feelings?: string }>();
  const likedLabel = LIKE_OPTIONS.find((o) => o.value === params.liked)?.label ?? 'No answer';
  const feelings = params.feelings ? params.feelings.split(',').filter(Boolean) : [];

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.heading}>
        <Text style={styles.title} accessibilityRole="header">
          Thanks for answering!
        </Text>
        <Text style={styles.subtitle}>Here’s what you told us.</Text>
      </View>

      <View style={styles.card}>
        <View style={[styles.item, styles.itemDivider]}>
          <Text style={styles.question}>Did you like the poem?</Text>
          <Text style={styles.answer}>{likedLabel}</Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.question}>How do you feel today?</Text>
          <View style={styles.chips}>
            {feelings.map((feeling) => (
              <Text key={feeling} style={styles.chip}>
                {feeling}
              </Text>
            ))}
          </View>
        </View>
      </View>

      {/* navigate('/') unwinds to the existing Home screen, which unmounts the questions and clears the answers. */}
      <PrimaryButton title="Back to Home" onPress={() => router.navigate('/')} />
    </ScrollView>
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
