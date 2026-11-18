import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, serif } from '@/constants/theme';

// "Jabberwocky" by Lewis Carroll (1871), stanzas 1–4 of 7. Public domain.
const STANZAS = [
  [
    '’Twas brillig, and the slithy toves',
    'Did gyre and gimble in the wabe:',
    'All mimsy were the borogoves,',
    'And the mome raths outgrabe.',
  ],
  [
    '“Beware the Jabberwock, my son!',
    'The jaws that bite, the claws that catch!',
    'Beware the Jubjub bird, and shun',
    'The frumious Bandersnatch!”',
  ],
  [
    'He took his vorpal sword in hand;',
    'Long time the manxome foe he sought—',
    'So rested he by the Tumtum tree',
    'And stood awhile in thought.',
  ],
  [
    'And, as in uffish thought he stood,',
    'The Jabberwock, with eyes of flame,',
    'Came whiffling through the tulgey wood,',
    'And burbled as it came!',
  ],
];

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
          accessibilityLabel="John Tenniel's engraving of the Jabberwock, a winged dragon-like creature with long claws, looming over a boy holding a sword in a dark forest"
        />
        <Text style={styles.caption}>Illustration by John Tenniel (1871)</Text>
      </View>

      <View style={styles.heading}>
        <Text style={styles.title} accessibilityRole="header">
          Jabberwocky
        </Text>
        <Text style={styles.byline}>Lewis Carroll · stanzas 1–4 of 7</Text>
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

      <PrimaryButton title="Next" onPress={() => router.push('/questions')} />
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
