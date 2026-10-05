import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import FengxingWheel from "@/components/ui/FengxingWheel";
import ScreenContainer from "@/components/ui/ScreenContainer";
import { fontSize, fontWeight, radius, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ONBOARDING_KEY = "@fengxing/has-seen-onboarding";

type SlideItem = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: "car-sport-outline" | "build-outline" | "shield-checkmark-outline";
};

const slides: SlideItem[] = [
  {
    id: "slide-1",
    eyebrow: "USED CAR MARKETPLACE",
    title: "Discover & buy verified used cars",
    description:
      "Browse inspected cars with full transparency, clear pricing, and verified inspection status across the UK.",
    icon: "car-sport-outline",
  },
  {
    id: "slide-2",
    eyebrow: "MOBILE CAR CARE",
    title: "Car care that comes to your door",
    description:
      "Book qualified mobile workers for servicing, maintenance, and vehicle checks at your location.",
    icon: "build-outline",
  },
  {
    id: "slide-3",
    eyebrow: "PHYSICAL VERIFICATION",
    title: "In-person vehicle inspections",
    description:
      "Get detailed physical inspection reports with photo evidence before buying or selling a car.",
    icon: "shield-checkmark-outline",
  },
];

export default function OnboardingScreen() {
  const theme = useAppTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    if (index !== activeIndex && index >= 0 && index < slides.length) {
      setActiveIndex(index);
    }
  };

  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    } catch {
      // Ignore
    }
    router.replace("/login");
  };

  const nextSlide = () => {
    if (activeIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: activeIndex + 1,
        animated: true,
      });
    } else {
      void finishOnboarding();
    }
  };

  return (
    <ScreenContainer contentStyle={styles.screen}>
      {/* HEADER */}
      <View style={styles.topRow}>
        <View style={styles.brand}>
          <FengxingWheel size={38} duration={12000} />
          <View style={styles.wordmark}>
            <Text style={[styles.brandXing, { color: theme.primary }]}>
              Shaz
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => void finishOnboarding()}
          hitSlop={10}
          style={({ pressed }) => [
            styles.skipButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.skipText, { color: theme.textSecondary }]}>
            Skip
          </Text>
        </Pressable>
      </View>

      {/* SLIDING CAROUSEL */}
      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View
            style={[styles.slideCard, { width: SCREEN_WIDTH - spacing.xl * 2 }]}
          >
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: theme.primarySoft,
                  borderColor: theme.border,
                },
              ]}
            >
              <Ionicons name={item.icon} size={48} color={theme.primary} />
            </View>

            <View style={styles.slideCopy}>
              <Text style={[styles.eyebrow, { color: theme.primary }]}>
                {item.eyebrow}
              </Text>
              <Text style={[styles.title, { color: theme.text }]}>
                {item.title}
              </Text>
              <Text
                style={[styles.description, { color: theme.textSecondary }]}
              >
                {item.description}
              </Text>
            </View>
          </View>
        )}
      />

      {/* PAGINATION DOTS & NEXT BUTTON */}
      <View style={styles.footer}>
        <View style={styles.dotsRow}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i === activeIndex ? theme.primary : theme.border,
                  width: i === activeIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={nextSlide}
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: theme.primary },
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {activeIndex === slides.length - 1 ? "Get Started" : "Continue"}
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
    justifyContent: "space-between",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xl,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  wordmark: {
    flexDirection: "row",
  },
  brandFeng: {
    fontSize: 24,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.8,
  },
  brandXing: {
    fontSize: 24,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.8,
  },
  skipButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  slideCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    gap: spacing.xxl,
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  slideCopy: {
    alignItems: "center",
    textAlign: "center",
    gap: spacing.sm,
  },
  eyebrow: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 1.4,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: fontWeight.bold,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  description: {
    fontSize: fontSize.sm,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 320,
  },
  footer: {
    gap: spacing.xl,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  primaryButton: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  pressed: {
    opacity: 0.78,
  },
});
