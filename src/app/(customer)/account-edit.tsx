import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import CustomerTopBar from "@/components/customer/CustomerTopBar";
import AppButton from "@/components/ui/AppButton";
import ScreenContainer from "@/components/ui/ScreenContainer";
import KeyboardScreenContainer from "@/components/ui/KeyboardScreenContainer";
import { fontSize, fontWeight, radius, spacing } from "@/constants/theme";
import { useAuth } from "@/features/auth/use-auth";
import { toastSuccess } from "@/features/toast/toast-store";
import { useAppTheme } from "@/hooks/use-app-theme";
import { supabase } from "@/services/supabase/client";

export default function AccountEditScreen() {
  const theme = useAppTheme();
  const { profile, session } = useAuth();

  const currentEmail = session?.user?.email || "";
  const userId = session?.user.id;

  // FORM STATES
  const [fullName, setFullName] = useState("");
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  // EMAIL CHANGE STATES - NEW EMAIL IS INITIALLY EMPTY ("")
  const [newEmail, setNewEmail] = useState("");
  const [emailAuthPassword, setEmailAuthPassword] = useState("");
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSentNotice, setEmailSentNotice] = useState<string | null>(null);

  // PASSWORD CHANGE STATES
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);

  // RESET NEW EMAIL AND SENSITIVE FIELDS TO EMPTY ("") ON FOCUS / BACK RETURN
  useFocusEffect(
    useCallback(() => {
      if (profile?.full_name) setFullName(profile.full_name);
      setNewEmail(""); // Always empty on screen focus
      setEmailAuthPassword("");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setNameError(null);
      setEmailError(null);
      setPassError(null);
      setEmailSentNotice(null);
    }, [profile?.full_name])
  );

  // 1. UPDATE NAME ONLY
  const handleUpdateName = async () => {
    if (!userId) return;
    if (!fullName.trim()) {
      setNameError("Please enter your full name.");
      return;
    }

    Keyboard.dismiss();
    setIsUpdatingName(true);
    setNameError(null);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) {
        setNameError(error.message || "Could not update name.");
        return;
      }

      toastSuccess("Your name has been updated.", "Profile Updated");
    } catch {
      setNameError("Could not update name. Please try again.");
    } finally {
      setIsUpdatingName(false);
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

    if (cleanEmail === currentEmail) {
      setEmailError("This is already your current email address.");
      return;
    }

    if (!emailAuthPassword) {
      setEmailError("Please enter your current password to authorize email change.");
      return;
    }

    Keyboard.dismiss();
    setIsUpdatingEmail(true);
    setEmailError(null);
    setEmailSentNotice(null);

    // Re-authenticate
    const { error: authErr } = await supabase.auth.signInWithPassword({
      email: currentEmail,
      password: emailAuthPassword,
    });

    if (authErr) {
      setIsUpdatingEmail(false);
      setEmailError("The current password you entered is incorrect.");
      return;
    }

    // Update email
    const { error: updateErr } = await supabase.auth.updateUser({
      email: cleanEmail,
    });

    setIsUpdatingEmail(false);

    if (updateErr) {
      setEmailError(updateErr.message || "Could not update email.");
      return;
    }

    setNewEmail("");
    setEmailAuthPassword("");
    const notice = `Confirmation link sent to ${cleanEmail}. Check your inbox and click the link to confirm your new email address.`;
    setEmailSentNotice(notice);
    toastSuccess("Confirmation email sent! Check your inbox.", "Confirmation Sent");
  };

  // 3. SECURE PASSWORD CHANGE
  const handleChangePassword = async () => {
    if (!userId) return;

    if (!currentPassword) {
      setPassError("Please enter your current password.");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setPassError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError("New passwords do not match.");
      return;
    }

    if (newPassword === currentPassword) {
      setPassError("New password cannot be the same as your current password.");
      return;
    }

    Keyboard.dismiss();
    setIsUpdatingPassword(true);
    setPassError(null);

    // Re-authenticate
    const { error: authErr } = await supabase.auth.signInWithPassword({
      email: currentEmail,
      password: currentPassword,
    });

    if (authErr) {
      setIsUpdatingPassword(false);
      setPassError("The current password you entered is incorrect.");
      return;
    }

    // Update password
    const { error: updateErr } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setIsUpdatingPassword(false);

    if (updateErr) {
      setPassError(updateErr.message || "Could not change password.");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toastSuccess("Your password has been changed successfully!", "Password Changed");
  };

  return (
    <ScreenContainer contentStyle={styles.screen}>
      <CustomerTopBar title="Edit Profile & Security" showBack />

      <KeyboardScreenContainer
        contentContainerStyle={[styles.content, { flexGrow: 1 }]}
        bottomPadding={160}
      >
          {/* SECTION 1: PERSONAL DETAILS */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Personal Details
            </Text>

            <View style={styles.fieldWrap}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Full Name</Text>
              <TextInput
                value={fullName}
                onChangeText={(v) => {
                  setFullName(v);
                  if (nameError) setNameError(null);
                }}
                placeholder="Your full name"
                placeholderTextColor={theme.textMuted}
                style={[styles.input, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
              />
            </View>

            {nameError ? (
              <View style={[styles.errorBox, { backgroundColor: theme.dangerSoft, borderLeftColor: theme.danger }]}>
                <Ionicons name="alert-circle-outline" size={18} color={theme.danger} />
                <Text style={[styles.errorText, { color: theme.danger }]}>{nameError}</Text>
              </View>
            ) : null}

            <AppButton
              title="Save Name"
              variant="secondary"
              onPress={() => void handleUpdateName()}
              loading={isUpdatingName}
              style={styles.actionBtn}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* SECTION 2: CHANGE EMAIL ADDRESS */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Change Email Address
            </Text>

            <View style={styles.fieldWrap}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>
                New Email Address {currentEmail ? `(Current: ${currentEmail})` : ""}
              </Text>
              <TextInput
                value={newEmail}
                onChangeText={(v) => {
                  setNewEmail(v);
                  if (emailError) setEmailError(null);
                }}
                placeholder="Enter new email address"
                placeholderTextColor={theme.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.input, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Current Password (to authorize email change)</Text>
              <TextInput
                value={emailAuthPassword}
                onChangeText={(v) => {
                  setEmailAuthPassword(v);
                  if (emailError) setEmailError(null);
                }}
                placeholder="Enter current password"
                placeholderTextColor={theme.textMuted}
                secureTextEntry
                autoCapitalize="none"
                style={[styles.input, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
              />
            </View>

            {emailError ? (
              <View style={[styles.errorBox, { backgroundColor: theme.dangerSoft, borderLeftColor: theme.danger }]}>
                <Ionicons name="alert-circle-outline" size={18} color={theme.danger} />
                <Text style={[styles.errorText, { color: theme.danger }]}>{emailError}</Text>
              </View>
            ) : null}

            {emailSentNotice ? (
              <View style={[styles.noticeBox, { backgroundColor: theme.infoSoft, borderColor: theme.info }]}>
                <Ionicons name="mail-unread-outline" size={18} color={theme.info} />
                <Text style={[styles.noticeText, { color: theme.text }]}>{emailSentNotice}</Text>
              </View>
            ) : null}

            <AppButton
              title="Request Email Change"
              variant="secondary"
              onPress={() => void handleUpdateEmail()}
              loading={isUpdatingEmail}
              disabled={!newEmail.trim() || newEmail.trim() === currentEmail || !emailAuthPassword}
              style={styles.actionBtn}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* SECTION 3: CHANGE PASSWORD */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Change Password
            </Text>

            <View style={styles.fieldWrap}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Current Password</Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  value={currentPassword}
                  onChangeText={(v) => {
                    setCurrentPassword(v);
                    if (passError) setPassError(null);
                  }}
                  placeholder="Enter current password"
                  placeholderTextColor={theme.textMuted}
                  secureTextEntry={!showCurrentPass}
                  autoCapitalize="none"
                  style={[styles.input, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
                />
                <Pressable onPress={() => setShowCurrentPass(!showCurrentPass)} hitSlop={10} style={styles.eyeIcon}>
                  <Ionicons name={showCurrentPass ? "eye-off-outline" : "eye-outline"} size={20} color={theme.textMuted} />
                </Pressable>
              </View>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>New Password</Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  value={newPassword}
                  onChangeText={(v) => {
                    setNewPassword(v);
                    if (passError) setPassError(null);
                  }}
                  placeholder="Min 6 characters"
                  placeholderTextColor={theme.textMuted}
                  secureTextEntry={!showNewPass}
                  autoCapitalize="none"
                  style={[styles.input, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
                />
                <Pressable onPress={() => setShowNewPass(!showNewPass)} hitSlop={10} style={styles.eyeIcon}>
                  <Ionicons name={showNewPass ? "eye-off-outline" : "eye-outline"} size={20} color={theme.textMuted} />
                </Pressable>
              </View>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Confirm New Password</Text>
              <TextInput
                value={confirmPassword}
                onChangeText={(v) => {
                  setConfirmPassword(v);
                  if (passError) setPassError(null);
                }}
                placeholder="Enter new password again"
                placeholderTextColor={theme.textMuted}
                secureTextEntry={!showNewPass}
                autoCapitalize="none"
                style={[styles.input, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
              />
            </View>

            {passError ? (
              <View style={[styles.errorBox, { backgroundColor: theme.dangerSoft, borderLeftColor: theme.danger }]}>
                <Ionicons name="alert-circle-outline" size={18} color={theme.danger} />
                <Text style={[styles.errorText, { color: theme.danger }]}>{passError}</Text>
              </View>
            ) : null}

            <AppButton
              title="Update Password"
              onPress={() => void handleChangePassword()}
              loading={isUpdatingPassword}
              disabled={!currentPassword || !newPassword || !confirmPassword}
              style={styles.actionBtn}
            />
          </View>
        </KeyboardScreenContainer>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 0 },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.xl,
  },
  section: { gap: spacing.md },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  fieldWrap: { gap: 6 },
  label: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.md,
  },
  passwordWrap: { position: "relative", justifyContent: "center" },
  eyeIcon: { position: "absolute", right: 14 },
  actionBtn: { minHeight: 44, marginTop: 4 },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.sm,
    borderLeftWidth: 3,
  },
  errorText: {
    flex: 1,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    lineHeight: 18,
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
