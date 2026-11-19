import { type ComponentRef, type ReactNode, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, type StyleProp, View, type ViewStyle } from 'react-native';

import { colors } from '@/constants/theme';

import { useNarrationState } from './NarrationProvider';
import { useScrollReveal } from './NarrationScrollView';

type Props = {
  /** Matches the `section` of a narration segment. */
  id: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Wraps a block of the screen and draws a glowing outline around it while it is narrated. */
export function NarrationSection({ id, children, style }: Props) {
  const { activeSection, running } = useNarrationState();
  const active = activeSection === id;
  const scroll = useScrollReveal();
  const ref = useRef<ComponentRef<typeof View>>(null);
  const [glow] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(glow, { toValue: active ? 1 : 0, duration: 180, useNativeDriver: true }).start();
  }, [active, glow]);

  // Keep the section being read on screen: when it starts, and again when narration resumes.
  // Nothing moves while narration is paused.
  useEffect(() => {
    if (active && running && ref.current) scroll?.reveal(ref.current);
  }, [active, running, scroll]);

  return (
    <View ref={ref} style={style}>
      {children}
      <Animated.View pointerEvents="none" style={[styles.glow, { opacity: glow }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    top: -6,
    right: -6,
    bottom: -6,
    left: -6,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: colors.accent,
    backgroundColor: 'rgba(10, 126, 164, 0.06)',
    shadowColor: colors.accent,
    shadowOpacity: 0.55,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
});
