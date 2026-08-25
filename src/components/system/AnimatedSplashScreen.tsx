import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import FengxingWheel from "@/components/ui/FengxingWheel";
import { fontWeight, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

type AnimatedSplashScreenProps = {
  onFinish: () => void;
};

export default function AnimatedSplashScreen({ onFinish }: AnimatedSplashScreenProps) {
  const theme = useAppTheme();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    // Entrance spring scale
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();

    // Hold splash for 1.8s then fade out smoothly
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, 1800);

    return () => clearTimeout(timer);
  }, [fadeAnim, onFinish, scaleAnim]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
          opacity: fadeAnim,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* SPINNING TIRE WHEEL LOGO AS LOADER */}
        <FengxingWheel size={80} duration={6000} />

        {/* BRAND WORDMARK */}
        <View style={styles.wordmark}>
          <Text style={[styles.feng, { color: theme.text }]}>feng</Text>
          <Text style={[styles.xing, { color: theme.primary }]}>xing</Text>
        </View>

        {/* CAPTION */}
        <Text style={[styles.caption, { color: theme.textSecondary }]}>
          YOUR CAR. YOUR JOURNEY.
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    zIndex: 999999,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  wordmark: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  feng: {
    fontSize: 44,
    lineHeight: 48,
    fontWeight: fontWeight.bold,
    letterSpacing: -1.8,
  },
  xing: {
    fontSize: 44,
    lineHeight: 48,
    fontWeight: fontWeight.bold,
    letterSpacing: -1.8,
  },
  caption: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    letterSpacing: 2,
    marginTop: -4,
  },
});
