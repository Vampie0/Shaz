// File: src/app/(customer)/about.tsx

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import CustomerTopBar from "@/components/customer/CustomerTopBar";
import FengxingWheel from "@/components/ui/FengxingWheel";
import ScreenContainer from "@/components/ui/ScreenContainer";
import { fontSize, fontWeight, radius, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

export default function AboutScreen() {
  const theme = useAppTheme();

  return (
    <ScreenContainer contentStyle={styles.screen}>
      <CustomerTopBar title="About" showMenu />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* HERO SECTION - SENIOR'S BRAND FOCUS */}
        <View style={styles.hero}>
          <FengxingWheel size={64} duration={12000} />

          <Text style={[styles.eyebrow, { color: theme.primary }]}>
            ABOUT SHAZ
          </Text>

          <Text style={[styles.title, { color: theme.text }]}>
            Making car ownership feel less complicated.
          </Text>

          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Shaz brings car discovery, verification, and at-home care into one
            practical experience.
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* MISSION SECTION */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Redefining the car buying experience.
          </Text>

          <Text
            style={[styles.sectionSubtitle, { color: theme.textSecondary }]}
          >
            At Shaz, we believe buying or selling a car shouldn't be a stressful
            ordeal. We've built a platform that puts transparency and trust at
            the forefront.
          </Text>

          {/* 3 CORE VALUE CARDS */}
          <View style={styles.valuesList}>
            <ValueCard
              icon="shield-checkmark-outline"
              title="Radical Transparency"
              text="We provide all the information you need to make informed decisions without hidden fees."
            />
            <ValueCard
              icon="heart-outline"
              title="Customer First"
              text="Your peace of mind is our priority. From verification to servicing, we design around you."
            />
            <ValueCard
              icon="flash-outline"
              title="Effortless Speed"
              text="Our seamless platform allows you to buy, sell, or book services in just a few clicks."
            />
          </View>
        </View>

        {/* BRAND FOOTER */}
        <View style={styles.brandFooter}>
          <Text style={[styles.brandTitle, { color: theme.text }]}>
            Shaz Mobile Experience
          </Text>
          <Text style={[styles.brandText, { color: theme.textSecondary }]}>
            Your car. Your journey.
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/(customer)/buy-cars")}
            style={({ pressed }) => [
              styles.exploreButton,
              { backgroundColor: theme.primary },
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.exploreText}>Browse Marketplace</Text>
            <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function ValueCard({
  icon,
  title,
  text,
}: {
  icon: any;
  title: string;
  text: string;
}) {
  const theme = useAppTheme();
  return (
    <View
      style={[
        styles.valueCard,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: theme.primarySoft }]}>
        <Ionicons name={icon} size={22} color={theme.primary} />
      </View>
      <View style={styles.valueCopy}>
        <Text style={[styles.valueTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.valueText, { color: theme.textSecondary }]}>
          {text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 0 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
    gap: spacing.xxl,
  },
  hero: { alignItems: "center", textAlign: "center", gap: spacing.md },
  eyebrow: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 1.4,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: fontSize.md,
    lineHeight: 24,
    textAlign: "center",
    paddingHorizontal: spacing.sm,
  },

  divider: { height: StyleSheet.hairlineWidth },

  section: { gap: spacing.lg },
  sectionTitle: {
    fontSize: fontSize.xxl,
    lineHeight: 34,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.5,
  },
  sectionSubtitle: { fontSize: fontSize.sm, lineHeight: 22 },

  valuesList: { marginTop: spacing.sm, gap: spacing.md },
  valueCard: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    flexDirection: "row",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  valueCopy: { flex: 1, gap: 4 },
  valueTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  valueText: { fontSize: fontSize.sm, lineHeight: 20 },

  brandFooter: { alignItems: "center", gap: 3, paddingBottom: spacing.lg },
  brandTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  brandText: { fontSize: fontSize.sm },
  exploreButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
  },
  exploreText: {
    color: "#FFFFFF",
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  pressed: { opacity: 0.75 },
});
