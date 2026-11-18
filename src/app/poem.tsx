import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, serif } from '@/constants/theme';
import { copy } from '@/copy';

// "Jabberwocky" by Lewis Carroll (1871), stanzas 1–4 of 7. Public domain.
const STANZAS = [copy.poem.stanza1, copy.poem.stanza2, copy.poem.stanza3, copy.poem.stanza4].map((stanza) =>
  stanza.split('\n'),
);

export default function PoemScreen() {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic">
      <View style={styles.figure}>
        <Image
          source={require('../../assets/images/jabberwock-tenniel.jpg')}
          style={styles.image}
          contentFit="contain"
          accessibilityLabel={copy.poem.imageAlt}
        />
        <Text style={styles.caption}>{copy.poem.imageCaption}</Text>
      </View>

      <View style={styles.heading}>
        <Text style={styles.title} accessibilityRole="header">
          {copy.poem.title}
        </Text>
        <Text style={styles.byline}>{copy.poem.byline}</Text>
      </View>

      <View style={styles.poem}>
        {STANZAS.map((stanza, i) => (
          <View key={i}>
            {stanza.map((line, j) => (
              <Text key={j} style={[styles.line, j % 2 === 1 && styles.indented]}>
                {line}
              </Text>
            ))}
          </View>
        ))}
      </View>

      <PrimaryButton title={copy.poem.next} onPress={() => router.push('/questions')} />
    </ScrollView>
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
