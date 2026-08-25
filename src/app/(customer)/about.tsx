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
      <CustomerTopBar title="About" showBack />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* HERO SECTION */}
        <View style={styles.hero}>
          <Text style={[styles.eyebrow, { color: theme.primary }]}>
            ABOUT FENGXING
          </Text>

          <Text style={[styles.title, { color: theme.text }]}>
            Making car ownership feel less complicated.
          </Text>

          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Fengxing brings car discovery, verification, and at-home care into one practical experience.
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* MISSION SECTION */}
        <View style={styles.section}>
          <Text style={[styles.eyebrow, { color: theme.primary }]}>
            OUR MISSION
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Redefining the car buying experience.
          </Text>

          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            At Fengxing, we believe buying or selling a car shouldn't be a stressful ordeal filled with uncertainty. We've built a platform that puts transparency and trust at the forefront.
          </Text>

          {/* 3 CORE VALUE CARDS */}
          <View style={styles.valuesList}>
            <View
              style={[
                styles.valueCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: theme.primarySoft },
                ]}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={22}
                  color={theme.primary}
                />
              </View>

              <View style={styles.valueCopy}>
                <Text style={[styles.valueTitle, { color: theme.text }]}>
                  Radical Transparency
                </Text>
                <Text
                  style={[styles.valueText, { color: theme.textSecondary }]}
                >
                  We provide all the information you need to make informed decisions without hidden fees or surprises.
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.valueCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: theme.primarySoft },
                ]}
              >
                <Ionicons
                  name="heart-outline"
                  size={22}
                  color={theme.primary}
                />
              </View>

              <View style={styles.valueCopy}>
                <Text style={[styles.valueTitle, { color: theme.text }]}>
                  Customer First
                </Text>
                <Text
                  style={[styles.valueText, { color: theme.textSecondary }]}
                >
                  Your peace of mind is our priority. From verification checks to mobile servicing, we design around your convenience.
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.valueCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: theme.primarySoft },
                ]}
              >
                <Ionicons
                  name="flash-outline"
                  size={22}
                  color={theme.primary}
                />
              </View>

              <View style={styles.valueCopy}>
                <Text style={[styles.valueTitle, { color: theme.text }]}>
                  Effortless Speed
                </Text>
                <Text
                  style={[styles.valueText, { color: theme.textSecondary }]}
                >
                  We value your time. Our seamless platform allows you to buy, sell, or book services in just a few clicks.
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* TRANSPARENCY & TRUST SECTION */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            A marketplace built on transparency and trust.
          </Text>

          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            Buying, selling, and maintaining a car should not require navigating a maze of disconnected services. We are building a practical marketplace around clearer information and helpful, real-world support.
          </Text>

          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            Our goal is simple: make it easier to make a good decision about your car, at every stage of ownership. Whether you're searching for your next vehicle or maintaining your current one, we're here to help.
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* BRAND FOOTER CARD */}
        <View
          style={[
            styles.brandCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <FengxingWheel size={48} duration={12000} />

          <View style={styles.brandCopy}>
            <Text style={[styles.brandTitle, { color: theme.text }]}>
              Fengxing Mobile Experience
            </Text>
            <Text style={[styles.brandText, { color: theme.textSecondary }]}>
              Your car. Your journey.
            </Text>
          </View>

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

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 0 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
    gap: spacing.xxl,
  },

  hero: {
    gap: spacing.md,
  },
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
  },
  subtitle: {
    fontSize: fontSize.md,
    lineHeight: 24,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
  },

  section: {
    gap: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.xxl,
    lineHeight: 34,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    lineHeight: 22,
  },
  paragraph: {
    fontSize: fontSize.sm,
    lineHeight: 23,
  },

  valuesList: {
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  valueCard: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  valueCopy: {
    flex: 1,
    gap: 4,
  },
  valueTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  valueText: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },

  brandCard: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    gap: spacing.md,
  },
  brandCopy: {
    alignItems: "center",
    gap: 3,
  },
  brandTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  brandText: {
    fontSize: fontSize.sm,
  },
  exploreButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xs,
  },
  exploreText: {
    color: "#FFFFFF",
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },

  pressed: {
    opacity: 0.75,
  },
});
