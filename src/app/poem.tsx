import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, serif } from '@/constants/theme';
import { copy } from '@/copy';
import { NarrationScrollView } from '@/narration/NarrationScrollView';
import { NarrationSection } from '@/narration/NarrationSection';
import { poemScript } from '@/narration/scripts';
import { useScreenNarration } from '@/narration/useScreenNarration';

// "Jabberwocky" by Lewis Carroll (1871), stanzas 1–4 of 7. Public domain.
const STANZAS = [
  { id: 'poem.stanza1', text: copy.poem.stanza1 },
  { id: 'poem.stanza2', text: copy.poem.stanza2 },
  { id: 'poem.stanza3', text: copy.poem.stanza3 },
  { id: 'poem.stanza4', text: copy.poem.stanza4 },
].map((s) => ({ ...s, lines: s.text.split('\n') }));

export default function PoemScreen() {
  useScreenNarration(poemScript);

  return (
    <NarrationScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <NarrationSection id="poem.image" style={styles.figure}>
        <Image
          source={require('../../assets/images/jabberwock-tenniel.jpg')}
          style={styles.image}
          contentFit="contain"
          accessibilityLabel={copy.poem.imageAlt}
        />
        <Text style={styles.caption}>{copy.poem.imageCaption}</Text>
      </NarrationSection>

      <NarrationSection id="poem.heading" style={styles.heading}>
        <Text style={styles.title} accessibilityRole="header">
          {copy.poem.title}
        </Text>
        <Text style={styles.byline}>{copy.poem.byline}</Text>
      </NarrationSection>

      <View style={styles.poem}>
        {STANZAS.map((stanza) => (
          <NarrationSection key={stanza.id} id={stanza.id}>
            {stanza.lines.map((line, j) => (
              <Text key={j} style={[styles.line, j % 2 === 1 && styles.indented]}>
                {line}
              </Text>
            ))}
          </NarrationSection>
        ))}
      </View>

      <NarrationSection id="poem.next">
        <PrimaryButton title={copy.poem.next} onPress={() => router.push('/questions')} />
      </NarrationSection>
    </NarrationScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingBottom: 48, gap: 24 },
  figure: { gap: 8 },
  image: { width: '100%', aspectRatio: 562 / 843, borderRadius: 12 },
  caption: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  heading: { gap: 4 },
  title: { fontFamily: serif, fontSize: 34, fontWeight: '600', color: colors.text },
  byline: { fontSize: 15, color: colors.textMuted },
  poem: { gap: 20 },
  line: { fontFamily: serif, fontSize: 19, lineHeight: 28, color: colors.text },
  indented: { paddingLeft: 16 },
});
