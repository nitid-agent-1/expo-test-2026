import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { useNarration } from './NarrationProvider';
import type { NarrationScript } from './scripts';

/**
 * Narrate a screen each time it comes into focus, and stop when it loses focus
 * (navigating away, or opening the language picker). Pass a stable script
 * (a constant, or useMemo for the dynamic Summary script).
 */
export function useScreenNarration(script: NarrationScript) {
  const { start, stop } = useNarration();
  useFocusEffect(
    useCallback(() => {
      start(script);
      return stop;
    }, [script, start, stop]),
  );
}
