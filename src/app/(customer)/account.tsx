import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import ThemePreferenceSelector from "@/components/account/ThemePreferenceSelector";
import CustomerTopBar from "@/components/customer/CustomerTopBar";
import AppButton from "@/components/ui/AppButton";
import AppModal from "@/components/ui/AppModal";
import FengxingWheel from "@/components/ui/FengxingWheel";
import ScreenContainer from "@/components/ui/ScreenContainer";
import { fontSize, fontWeight, radius, spacing } from "@/constants/theme";
import { useAuth } from "@/features/auth/use-auth";
import { toastError } from "@/features/toast/toast-store";
import { useAppTheme } from "@/hooks/use-app-theme";

export default function CustomerAccountScreen() {
  const theme = useAppTheme();
  const { profile, session, signOut } = useAuth();

  const [logoutVisible, setLogoutVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // SNAPSHOT GUARD: Retain last valid profile/session to prevent 1-frame unmount flicker
  const lastProfile = useRef(profile);
  const lastSession = useRef(session);

  if (profile) lastProfile.current = profile;
  if (session) lastSession.current = session;

  const currentProfile = profile || lastProfile.current;
  const currentSession = session || lastSession.current;

  const displayName = currentProfile?.full_name?.trim() || "Customer";
  const email = currentSession?.user?.email?.trim() || "Not provided";
  const phone = currentProfile?.phone?.trim() || "Not provided";

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // 1. Close modal first
      setLogoutVisible(false);
      await new Promise((resolve) => setTimeout(resolve, 150));

      // 2. Navigate to Login FIRST while screen is still mounted
      router.replace("/login");
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 3. Clear auth session in background
      await signOut();
    } catch {
      toastError("Logout failed. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <ScreenContainer contentStyle={styles.screen}>
      <CustomerTopBar title="Account" showBack />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* PROFILE HEADER CARD */}
        <View style={[styles.profileCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <FengxingWheel size={58} duration={12000} />
          <View style={styles.headerInfo}>
            <Text style={[styles.userName, { color: theme.text }]}>
              {displayName}
            </Text>
            <Text style={[styles.userEmail, { color: theme.textSecondary }]}>
              {email}
            </Text>
          </View>
        </View>

        {/* READ-ONLY ACCOUNT DETAILS CARD */}
        <View style={[styles.detailsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            Account Details
          </Text>

          <View style={styles.detailsList}>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: theme.textMuted }]}>FULL NAME</Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>{displayName}</Text>
            </View>

            <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />

            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: theme.textMuted }]}>EMAIL ADDRESS</Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>{email}</Text>
            </View>

            <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />

            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: theme.textMuted }]}>PHONE NUMBER</Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>{phone}</Text>
            </View>
          </View>
        </View>

        {/* EDIT PROFILE & SECURITY BUTTON */}
        <AppButton
          title="Edit Profile & Security"
          onPress={() => router.push("/(customer)/account-edit")}
        />

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* THEME PREFERENCE */}
        <ThemePreferenceSelector />

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* LOGOUT */}
        <View style={styles.logoutSection}>
          <AppButton
            title="Log Out"
            variant="danger"
            onPress={() => setLogoutVisible(true)}
            loading={isLoggingOut}
          />
        </View>
      </ScrollView>

      {/* LOGOUT CONFIRMATION MODAL */}
      <AppModal
        visible={logoutVisible}
        title="Log out?"
        message="You will need to sign in again to access your Fengxing account."
        confirmText="Log Out"
        onConfirm={handleLogout}
        onClose={() => setLogoutVisible(false)}
        loading={isLoggingOut}
        destructive
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 0 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.xl,
  },
  profileCard: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    elevation: 3,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  headerInfo: { flex: 1, gap: 4 },
  userName: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, textAlign: "left" },
  userEmail: { fontSize: fontSize.xs, textAlign: "left" },

  detailsCard: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.lg,
    elevation: 3,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, textAlign: "left" },
  detailsList: { gap: spacing.md },
  detailItem: {
    gap: 4,
    alignItems: "flex-start",
  },
  detailLabel: { fontSize: 10, fontWeight: fontWeight.bold, letterSpacing: 0.8, textAlign: "left" },
  detailValue: { fontSize: fontSize.md, fontWeight: fontWeight.bold, textAlign: "left" },
  rowDivider: { height: StyleSheet.hairlineWidth },

  divider: { height: StyleSheet.hairlineWidth },
  logoutSection: { paddingTop: spacing.xs },
});
