import { useCallback, useRef } from "react";
import type {
  NativeScrollEvent,
  NativeSyntheticEvent,
  View,
} from "react-native";

export function useInvalidFieldScroll<T extends string>() {
  const scrollRef = useRef<any>(null);

  const currentScrollY = useRef(0);

  const fieldRefs = useRef<Partial<Record<T, View | null>>>({});

  const refCallbacks = useRef<Partial<Record<T, (node: View | null) => void>>>(
    {},
  );

  const bindField = useCallback((key: T) => {
    if (!refCallbacks.current[key]) {
      refCallbacks.current[key] = (node: View | null) => {
        fieldRefs.current[key] = node;
      };
    }

    return refCallbacks.current[key]!;
  }, []);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      currentScrollY.current = event.nativeEvent.contentOffset.y;
    },
    [],
  );

  const scrollToField = useCallback((key: T) => {
    const node = fieldRefs.current[key];

    if (!node) {
      return;
    }

    requestAnimationFrame(() => {
      node.measureInWindow((_x, y) => {
        const targetY = Math.max(0, currentScrollY.current + y - 145);

        const scroller = scrollRef.current;
        if (!scroller) return;

        // 1. Agar KeyboardAwareScrollView hai to scrollToPosition call karo
        if (typeof scroller.scrollToPosition === "function") {
          scroller.scrollToPosition(0, targetY, true);
        }
        // 2. Agar standard ScrollView hai to scrollTo call karo
        else if (typeof scroller.scrollTo === "function") {
          scroller.scrollTo({
            y: targetY,
            animated: true,
          });
        }
        // 3. Agar responder ke zariye scroll hota ho
        else if (typeof scroller.getScrollResponder === "function") {
          scroller.getScrollResponder()?.scrollTo({
            y: targetY,
            animated: true,
          });
        }
      });
    });
  }, []);

  return {
    scrollRef,
    bindField,
    onScroll,
    scrollToField,
  };
}
