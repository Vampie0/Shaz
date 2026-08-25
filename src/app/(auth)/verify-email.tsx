import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import AppButton from "@/components/ui/AppButton";
import AppModal from "@/components/ui/AppModal";
import FengxingWheel from "@/components/ui/FengxingWheel";
import KeyboardScreenContainer from "@/components/ui/KeyboardScreenContainer";
import { fontSize, fontWeight, radius, spacing } from "@/constants/theme";
import { toastError, toastSuccess } from "@/features/toast/toast-store";
import { useAppTheme } from "@/hooks/use-app-theme";
import { supabase } from "@/services/supabase/client";

export default function VerifyEmailScreen() {
  const theme = useAppTheme();
  const params = useLocalSearchParams<{ email?: string; name?: string; phone?: string }>();

  const email = typeof params.email === "string" ? params.email : "";
  const name = typeof params.name === "string" ? params.name : "";
  const phone = typeof params.phone === "string" ? params.phone : "";

  const [otpCode, setOtpCode] = useState("");
  const [isVerifying, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const canVerify = otpCode.trim().length >= 6;

  const handleVerifyCode = async () => {
    const cleanCode = otpCode.trim();
    if (cleanCode.length < 6 || isVerifying) return;

    Keyboard.dismiss();
    setIsSubmitting(true);
    setVerifyError(null);

    try {
      // 1. Verify OTP with Supabase Auth
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: cleanCode,
        type: "signup",
      });

      if (error) {
        const { error: err2 } = await supabase.auth.verifyOtp({
          email,
          token: cleanCode,
          type: "email",
        });

        if (err2) throw error;
      }

      // 2. Upsert customer profile row
      const currentUserId = (await supabase.auth.getUser()).data.user?.id;

      if (currentUserId) {
        await supabase.from("profiles").upsert({
          id: currentUserId,
          full_name: name || "Customer",
          role: "customer",
          updated_at: new Date().toISOString(),
        });
      }

      toastSuccess("Email verified! Welcome to Fengxing.", "Account Confirmed");

      // 3. Redirect to Customer Overview Dashboard
      router.replace("/(customer)/(tabs)/overview");
    } catch (err) {
      console.error("OTP Verification error:", err);
      const msg =
        typeof err === "object" && err !== null && "message" in err
          ? String((err as any).message)
          : "Invalid or expired verification code. Please check your email.";

      setVerifyError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (!email || isResending) return;

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (error) throw error;

      toastSuccess("A new verification code was sent to your email.", "Code Resent");
    } catch (err) {
      console.error("Resend OTP error:", err);
      toastError("Could not resend code. Please try again later.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <>
      <KeyboardScreenContainer bottomPadding={200} contentContainerStyle={styles.scrollContent}>
        <View style={styles.screen}>
          {/* TOP HEADER */}
          <View style={styles.topRow}>
            <Pressable
              accessibilityRole="button"
              hitSlop={12}
              onPress={router.back}
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            >
              <Text style={[styles.backText, { color: theme.primary }]}>Back</Text>
            </Pressable>

            <View style={styles.miniBrand}>
              <FengxingWheel size={30} duration={9000} />
              <View style={styles.wordmark}>
                <Text style={[styles.brandText, { color: theme.text }]}>feng</Text>
                <Text style={[styles.brandText, { color: theme.primary }]}>xing</Text>
              </View>
            </View>
          </View>

          {/* INTRO */}
          <View style={styles.intro}>
            <Text style={[styles.eyebrow, { color: theme.primary }]}>
              EMAIL VERIFICATION
            </Text>

            <Text style={[styles.title, { color: theme.text }]}>
              Enter confirmation code.
            </Text>

            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              We sent a verification code to{"\n"}
              <Text style={{ fontWeight: fontWeight.bold, color: theme.text }}>{email || "your email"}</Text>.
            </Text>
          </View>

          {/* CODE INPUT FORM */}
          <View style={styles.form}>
            <View style={styles.codeWrap}>
              <Text style={[styles.codeLabel, { color: theme.textSecondary }]}>
                Confirmation Code
              </Text>

              <View
                style={[
                  styles.codeControl,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Ionicons name="key-outline" size={20} color={theme.primary} />
                <TextInput
                  value={otpCode}
                  onChangeText={(v) => {
                    setOtpCode(v.toUpperCase().trim());
                    if (verifyError) setVerifyError(null);
                  }}
                  placeholder="Enter code from email"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="number-pad"
                  maxLength={10}
                  autoFocus
                  style={[styles.codeInput, { color: theme.text }]}
                />
              </View>
            </View>

            {/* RESEND LINK */}
            <View style={styles.resendRow}>
              <Text style={[styles.resendQuestion, { color: theme.textSecondary }]}>
                Didn't receive the code?
              </Text>

              <Pressable
                accessibilityRole="button"
                disabled={isResending}
                onPress={() => void handleResendCode()}
                hitSlop={8}
                style={({ pressed }) => [styles.resendBtn, pressed && styles.pressed]}
              >
                {isResending ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <Text style={[styles.resendText, { color: theme.primary }]}>
                    Resend code
                  </Text>
                )}
              </Pressable>
            </View>

            {/* SUBMIT BUTTON */}
            <View style={styles.actionArea}>
              <AppButton
                title="Verify & Continue"
                onPress={() => void handleVerifyCode()}
                loading={isVerifying}
                disabled={!canVerify}
              />
            </View>
          </View>
        </View>
      </KeyboardScreenContainer>

      <AppModal
        visible={Boolean(verifyError)}
        title="Verification Failed"
        message={verifyError ?? undefined}
        onClose={() => setVerifyError(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  screen: { flexGrow: 1 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 44,
  },
  backButton: { minHeight: 34, justifyContent: "center" },
  backText: { fontSize: 13, fontWeight: fontWeight.bold },
  miniBrand: { flexDirection: "row", alignItems: "center", gap: 8 },
  wordmark: { flexDirection: "row" },
  brandText: { fontSize: 21, lineHeight: 24, fontWeight: fontWeight.bold, letterSpacing: -0.8 },

  intro: { marginBottom: 32 },
  eyebrow: { marginBottom: 12, fontSize: 11, fontWeight: fontWeight.bold, letterSpacing: 1.4 },
  title: { fontSize: 36, lineHeight: 40, fontWeight: fontWeight.bold, letterSpacing: -1.1 },
  subtitle: { marginTop: 12, fontSize: fontSize.md, lineHeight: 23 },

  form: { gap: spacing.xl },
  codeWrap: { gap: 8 },
  codeLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  codeControl: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
  },
  codeInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: fontWeight.bold,
    letterSpacing: 2,
  },

  resendRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  resendQuestion: { fontSize: 13 },
  resendBtn: { minHeight: 30, justifyContent: "center" },
  resendText: { fontSize: 13, fontWeight: fontWeight.bold },

  actionArea: { marginTop: 8 },
  pressed: { opacity: 0.55 },
});
