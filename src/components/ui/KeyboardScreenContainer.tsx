import { PropsWithChildren, Ref } from "react";
import { StyleProp, ViewStyle } from "react-native";

import KeyboardSafeWrapper from "@/components/ui/KeyboardSafeWrapper";

type KeyboardScreenContainerProps = PropsWithChildren<{
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardVerticalOffset?: number;
  bottomPadding?: number;
  scrollRef?: Ref<any>;
  onScroll?: (...args: any[]) => void;
}>;

export default function KeyboardScreenContainer({
  children,
  contentContainerStyle,
  keyboardVerticalOffset,
  bottomPadding = 180,
  scrollRef,
  onScroll,
}: KeyboardScreenContainerProps) {
  return (
    <KeyboardSafeWrapper
      contentContainerStyle={contentContainerStyle}
      keyboardVerticalOffset={keyboardVerticalOffset}
      bottomPadding={bottomPadding}
      scrollRef={scrollRef}
      onScroll={onScroll}
    >
      {children}
    </KeyboardSafeWrapper>
  );
}
