import {
  type ComponentRef,
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from 'react';
import {
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ViewNode = ComponentRef<typeof View>;
type RevealContext = { reveal: (node: ViewNode) => void };
const ScrollRevealContext = createContext<RevealContext | null>(null);

/** Used by NarrationSection to keep the section being read on screen. */
export const useScrollReveal = () => useContext(ScrollRevealContext);

/** Estimated navigation bar height below the status bar, used until the first scroll event reports the real inset. */
const NAV_BAR_ESTIMATE = 54;
const MARGIN = 24;

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

/**
 * A ScrollView that scrolls a narrated section into view when it starts
 * glowing. Content sits below the translucent iOS header.
 */
export function NarrationScrollView({ children, style, contentContainerStyle }: Props) {
  const safeArea = useSafeAreaInsets();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const contentRef = useRef<ViewNode>(null);
  // How far the content has scrolled past its resting position (0 at the top).
  const scrolledBy = useRef(0);
  const insets = useRef({ top: safeArea.top + NAV_BAR_ESTIMATE, bottom: safeArea.bottom });
  const height = useRef(0);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentInset } = e.nativeEvent;
    insets.current = { top: contentInset.top, bottom: contentInset.bottom };
    scrolledBy.current = contentOffset.y + contentInset.top;
  }, []);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    height.current = e.nativeEvent.layout.height;
  }, []);

  const reveal = useCallback((node: ViewNode) => {
    const content = contentRef.current;
    if (!content) return;
    node.measureLayout(
      content,
      (_x: number, y: number, _w: number, h: number) => {
        const visible = height.current - insets.current.top - insets.current.bottom;
        const top = scrolledBy.current;
        const bottom = top + visible;
        if (y - MARGIN >= top && y + h + MARGIN <= bottom) return;
        // Centre the section, or align its top if it is taller than the screen.
        const target = h + 2 * MARGIN > visible ? y - MARGIN : y - (visible - h) / 2;
        scrollRef.current?.scrollTo({ y: Math.max(0, target) - insets.current.top, animated: true });
      },
      () => {},
    );
  }, []);

  const value = useMemo(() => ({ reveal }), [reveal]);

  return (
    <ScrollRevealContext.Provider value={value}>
      <ScrollView
        ref={scrollRef}
        style={style}
        contentInsetAdjustmentBehavior="automatic"
        onScroll={onScroll}
        scrollEventThrottle={32}
        onLayout={onLayout}>
        <View ref={contentRef} style={contentContainerStyle}>
          {children}
        </View>
      </ScrollView>
    </ScrollRevealContext.Provider>
  );
}
