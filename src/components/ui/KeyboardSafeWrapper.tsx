import React, { Ref } from "react";
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type KeyboardSafeWrapperProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  bottomPadding?: number;
  keyboardVerticalOffset?: number;
  scrollRef?: Ref<any>;
  onScroll?: (...args: any[]) => void;
  keyboardShouldPersistTaps?: "always" | "handled" | "never";
};

export function KeyboardSafeWrapper({
  children,
  style,
  contentContainerStyle,
  bottomPadding = 120,
  scrollRef,
  onScroll,
  keyboardShouldPersistTaps = "handled",
}: KeyboardSafeWrapperProps) {
  const insets = useSafeAreaInsets();

  const extraScroll = bottomPadding + Math.max(insets.bottom, 16);

  return (
    <View style={[styles.flex, { backgroundColor: "transparent" }, style]}>
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
        extraScrollHeight={130}
        extraHeight={130}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        keyboardDismissMode="none"
        showsVerticalScrollIndicator={false}
        enableResetScrollToCoords={false}
        keyboardOpeningTime={Platform.OS === "android" ? 0 : 250}
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
