import React, { Ref } from "react";
import {
  Platform,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTheme } from "@/hooks/use-app-theme";

type KeyboardSafeWrapperProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  bottomPadding?: number;
  keyboardVerticalOffset?: number;
  /** kept for API compatibility — not used by KeyboardAwareScrollView the same way */
  scrollRef?: Ref<any>;
  onScroll?: (...args: any[]) => void;
  keyboardShouldPersistTaps?: "always" | "handled" | "never";
};

export function KeyboardSafeWrapper({
  children,
  style,
  contentContainerStyle,
  bottomPadding = 120,
  keyboardVerticalOffset,
  scrollRef,
  onScroll,
  keyboardShouldPersistTaps = "always",
}: KeyboardSafeWrapperProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  const extraScroll =
    bottomPadding + Math.max(insets.bottom, 16);

  return (
    <View
      style={[
        styles.flex,
        { backgroundColor: theme.background, paddingTop: insets.top },
        style,
      ]}
    >
      <KeyboardAwareScrollView
        ref={scrollRef as any}
        style={styles.flex}
        contentContainerStyle={[
            styles.scrollContent,
            contentContainerStyle,
            { paddingBottom: extraScroll },
          ]}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={20}
        extraHeight={75}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        keyboardDismissMode="none"
        showsVerticalScrollIndicator={false}
        enableResetScrollToCoords={true}
        resetScrollToCoords={{ x: 0, y: 0 }}
        keyboardOpeningTime={Number.MAX_SAFE_INTEGER}
        viewIsInsideTabBar={false}
        onScroll={onScroll}
        scrollEventThrottle={onScroll ? 16 : undefined}
      >
        {children}
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
});

export default KeyboardSafeWrapper;
