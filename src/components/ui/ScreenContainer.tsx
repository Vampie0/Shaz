import { PropsWithChildren } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { Edge, SafeAreaView } from "react-native-safe-area-context";

import { layout } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

type ScreenContainerProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  edges?: Edge[];
}>;

export default function ScreenContainer({
  children,
  style,
  contentStyle,
  edges = ["top", "right", "bottom", "left"],
}: ScreenContainerProps) {
  const theme = useAppTheme();

  return (
    <SafeAreaView
      edges={edges}
      style={[
        styles.safeArea,
        {
          backgroundColor: theme.background,
        },
        style,
      ]}
    >
      <View style={[styles.content, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  content: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
    maxWidth: layout.maxContentWidth,
    paddingHorizontal: layout.screenHorizontalPadding,
  },
});
