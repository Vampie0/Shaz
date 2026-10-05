// File: src/app/(customer)/account-edit.tsx

import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Keyboard, StyleSheet, Text, View } from "react-native";

import CustomerTopBar from "@/components/customer/CustomerTopBar";
import AppButton from "@/components/ui/AppButton";
import AppInput from "@/components/ui/AppInput";
import AppLoadingOverlay from "@/components/ui/AppLoadingOverlay";
import KeyboardScreenContainer from "@/components/ui/KeyboardScreenContainer";
import ScreenContainer from "@/components/ui/ScreenContainer";
import { fontSize, fontWeight, radius, spacing } from "@/constants/theme";
import { useAuth } from "@/features/auth/use-auth";
import { toastSuccess } from "@/features/toast/toast-store";
import { useAppTheme } from "@/hooks/use-app-theme";
import { supabase } from "@/services/supabase/client";

export default function AccountEditScreen() {
  const theme = useAppTheme();
  const { profile, session, refreshProfile } = useAuth();

  const currentEmail = session?.user?.email || "";
  const userId = session?.user.id;

  // FORM STATES
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  // EMAIL CHANGE STATES
  const [newEmail, setNewEmail] = useState("");
  const [emailAuthPassword, setEmailAuthPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSentNotice, setEmailSentNotice] = useState<boolean>(false);

  // PASSWORD CHANGE STATES
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passError, setPassError] = useState<string | null>(null);

  // RESET ON FOCUS
  useFocusEffect(
    useCallback(() => {
      if (profile?.full_name) setFullName(profile.full_name);
      setNewEmail("");
      setEmailAuthPassword("");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setNameError(null);
      setEmailError(null);
      setPassError(null);
      setEmailSentNotice(false);
    }, [profile?.full_name]),
  );

  // 1. UPDATE NAME (FIXED FOR REAL-TIME SYNC)
  const handleUpdateName = async () => {
    if (!userId) return;
    if (!fullName.trim()) {
      setNameError("Please enter your full name.");
      return;
    }

    Keyboard.dismiss();
    setIsUpdating(true);
    setNameError(null);

    try {
      // Step A: Database Update
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) throw error;

      // Step B: REAL-TIME REFRESH (Provider ko signal dena)
      await refreshProfile();

      toastSuccess("Your name has been updated.", "Profile Updated");

      // Seedha wapis jao taake tabdeeli nazar aaye
      router.back();
    } catch (err: any) {
      setNameError(err.message || "Could not update name.");
    } finally {
      setIsUpdating(false);
    }
  };

  // 2. SECURE EMAIL CHANGE
  const handleUpdateEmail = async () => {
    if (!userId) return;
    const cleanEmail = newEmail.trim();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    if (!emailAuthPassword) {
      setEmailError("Enter your password to authorize change.");
      return;
    }

    Keyboard.dismiss();
    setIsUpdating(true);
    setEmailError(null);

    const { error: authErr } = await supabase.auth.signInWithPassword({
      email: currentEmail,
      password: emailAuthPassword,
    });

    if (authErr) {
      setIsUpdating(false);
      setEmailError("Incorrect password.");
      return;
    }

    const { error: updateErr } = await supabase.auth.updateUser({
      email: cleanEmail,
    });
    setIsUpdating(false);

    if (updateErr) {
      setEmailError(updateErr.message || "Could not update email.");
      return;
    }

    setNewEmail("");
    setEmailSentNotice(true);
    toastSuccess("Links sent to both emails.", "Links Sent");
  };

  // 3. SECURE PASSWORD CHANGE
  const handleChangePassword = async () => {
    if (!userId) return;
    if (
      !currentPassword ||
      newPassword.length < 6 ||
      newPassword !== confirmPassword
    ) {
      setPassError("Check your inputs (min 6 characters).");
      return;
    }

    Keyboard.dismiss();
    setIsUpdating(true);
    setPassError(null);

    const { error: authErr } = await supabase.auth.signInWithPassword({
      email: currentEmail,
      password: currentPassword,
    });

    if (authErr) {
      setIsUpdating(false);
      setPassError("Current password incorrect.");
      return;
    }

    const { error: updateErr } = await supabase.auth.updateUser({
      password: newPassword,
    });
    setIsUpdating(false);

    if (updateErr) {
      setPassError(updateErr.message || "Could not update password.");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toastSuccess("Password changed successfully!", "Success");
  };

  return (
    <ScreenContainer contentStyle={styles.screen}>
      <CustomerTopBar title="Edit Profile & Security" showBack />

      <KeyboardScreenContainer
        contentContainerStyle={styles.content}
        bottomPadding={160}
      >
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Personal Details
          </Text>
          <AppInput
            label="Full Name"
            value={fullName}
            onChangeText={(v) => {
              setFullName(v);
              if (nameError) setNameError(null);
            }}
            placeholder="Your full name"
            error={nameError || undefined}
          />
          <AppButton
            title="Save Name"
            variant="secondary"
            onPress={handleUpdateName}
            style={styles.actionBtn}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Change Email
          </Text>
          <AppInput
            label="New Email"
            value={newEmail}
            onChangeText={setNewEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <AppInput
            label="Password"
            value={emailAuthPassword}
            onChangeText={setEmailAuthPassword}
            placeholder="Current password to authorize"
            password
          />
          {emailError ? (
            <Text style={[styles.errorText, { color: theme.danger }]}>
              {emailError}
            </Text>
          ) : null}
          {emailSentNotice && (
            <View
              style={[
                styles.noticeBox,
                { backgroundColor: theme.infoSoft, borderColor: theme.info },
              ]}
            >
              <Ionicons
                name="mail-unread-outline"
                size={18}
                color={theme.info}
              />
              <Text style={[styles.noticeText, { color: theme.text }]}>
                Check both inboxes for confirmation links.
              </Text>
            </View>
          )}
          <AppButton
            title="Request Email Change"
            variant="secondary"
            onPress={handleUpdateEmail}
            disabled={!newEmail.trim() || !emailAuthPassword}
            style={styles.actionBtn}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Change Password
          </Text>
          <AppInput
            label="Current Password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter current password"
            password
          />
          <AppInput
            label="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Min 6 characters"
            password
          />
          <AppInput
            label="Confirm New Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Enter again"
            password
          />
          {passError ? (
            <Text style={[styles.errorText, { color: theme.danger }]}>
              {passError}
            </Text>
          ) : null}
          <AppButton
            title="Update Password"
            onPress={handleChangePassword}
            disabled={!currentPassword || !newPassword}
            style={styles.actionBtn}
          />
        </View>
      </KeyboardScreenContainer>

      <AppLoadingOverlay visible={isUpdating} message="Updating details..." />
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
  section: { gap: spacing.md },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  actionBtn: { minHeight: 46, marginTop: 4, marginBottom: spacing.md },
  errorText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    marginTop: -4,
  },
  noticeBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  noticeText: { flex: 1, fontSize: fontSize.xs, lineHeight: 19 },
  divider: { height: StyleSheet.hairlineWidth },
});
