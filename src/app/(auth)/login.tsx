import AppButton from "@/components/ui/AppButton";
import AppInput from "@/components/ui/AppInput";
import AppModal from "@/components/ui/AppModal";
import FengxingWheel from "@/components/ui/FengxingWheel";
import KeyboardScreenContainer from "@/components/ui/KeyboardScreenContainer";
import { fontSize, fontWeight, layout, radius, spacing } from "@/constants/theme";
import { useAuth } from "@/features/auth/use-auth";
import { toastError, toastSuccess } from "@/features/toast/toast-store";
import { useAppTheme } from "@/hooks/use-app-theme";
import { supabase } from "@/services/supabase/client";
import { Link } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export default function LoginScreen() {
  const theme = useAppTheme();

  const { signIn, accessMessage, clearAccessMessage, isInitializing } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  // FORGOT PASSWORD MODAL STATE
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [sendingReset, setSendingReset] = useState(false);

  const validate = () => {
    let valid = true;
    const cleanEmail = email.trim();

    setEmailError(undefined);
    setPasswordError(undefined);

    if (!cleanEmail) {
      setEmailError("Enter your email address.");
      valid = false;
    } else if (!cleanEmail.includes("@")) {
      setEmailError("Enter a valid email address.");
      valid = false;
    }

    if (!password) {
      setPasswordError("Enter your password.");
      valid = false;
    }

    return valid;
  };

  const handleLogin = async () => {
    if (!validate() || submitting) return;

    Keyboard.dismiss();
    setSubmitting(true);

    try {
      await signIn(email.trim(), password);
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : "";

      if (message.includes("invalid login credentials")) {
        toastError("The email or password you entered is incorrect.", "Invalid Credentials");
      } else {
        toastError("We couldn't sign you in. Please try again.", "Sign In Failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendPasswordReset = async () => {
    const clean = forgotEmail.trim();
    if (!clean || !clean.includes("@")) {
      toastError("Please enter a valid email address.", "Invalid Email");
      return;
    }

    Keyboard.dismiss();
    setSendingReset(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(clean);
      if (error) throw error;

      setForgotModalVisible(false);
      setForgotEmail("");
      toastSuccess("Password reset instructions sent to your email!", "Email Sent");
    } catch (err) {
      console.error("Password reset error:", err);
      const msg =
        typeof err === "object" && err !== null && "message" in err
          ? String((err as any).message)
          : "Could not send reset email.";
      toastError(msg, "Reset Failed");
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <>
      <KeyboardScreenContainer bottomPadding={200} contentContainerStyle={styles.scrollContent}>
        <View style={styles.screen}>
          {/* BRAND */}
          <View style={styles.brandSection}>
            <View style={styles.brandRow}>
              <FengxingWheel size={52} duration={9000} />

              <View style={styles.wordmark}>
                <Text style={[styles.feng, { color: theme.text }]}>feng</Text>
                <Text style={[styles.xing, { color: theme.primary }]}>xing</Text>
              </View>
            </View>

            <Text style={[styles.brandCaption, { color: theme.textSecondary }]}>
              YOUR CAR. YOUR JOURNEY.
            </Text>
          </View>

          {/* INTRO */}
          <View style={styles.intro}>
            <Text style={[styles.eyebrow, { color: theme.primary }]}>
              FENGXING ACCOUNT
            </Text>

            <Text style={[styles.title, { color: theme.text }]}>
              Sign in to{"\n"}continue.
            </Text>

            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Access your Fengxing account securely.
            </Text>
          </View>

          {/* FORM */}
          <View style={styles.form}>
            <AppInput
              label="Email address"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                if (emailError) setEmailError(undefined);
              }}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              error={emailError}
            />

            <View style={styles.passwordWrap}>
              <AppInput
                label="Password"
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  if (passwordError) setPasswordError(undefined);
                }}
                placeholder="Enter your password"
                password
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                textContentType="password"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                error={passwordError}
              />

              {/* FORGOT PASSWORD LINK */}
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setForgotEmail(email.trim());
                  setForgotModalVisible(true);
                }}
                hitSlop={8}
                style={({ pressed }) => [styles.forgotLink, pressed && styles.pressed]}
              >
                <Text style={[styles.forgotText, { color: theme.primary }]}>
                  Forgot password?
                </Text>
              </Pressable>
            </View>

            <View style={styles.actionArea}>
              <AppButton
                title="Sign in"
                onPress={handleLogin}
                loading={submitting || isInitializing}
                disabled={!email.trim() || !password}
              />

              {/* CUSTOMER REGISTRATION */}
              <View style={styles.registerRow}>
                <Text style={[styles.registerQuestion, { color: theme.textSecondary }]}>
                  New to Fengxing?
                </Text>

                <Link href="/register" asChild prefetch>
                  <Pressable
                    accessibilityRole="button"
                    hitSlop={10}
                    style={({ pressed }) => [styles.registerButton, pressed && styles.pressed]}
                  >
                    <Text style={[styles.registerText, { color: theme.primary }]}>
                      Create account
                    </Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          </View>

          {/* FOOTER */}
          <View style={styles.footer}>
            <View style={[styles.footerLine, { backgroundColor: theme.border }]} />
            <Text style={[styles.footerText, { color: theme.textMuted }]}>
              Secure access powered by Fengxing
            </Text>
          </View>
        </View>
      </KeyboardScreenContainer>

      <AppModal
        visible={Boolean(accessMessage)}
        title="Account access unavailable"
        message={accessMessage ?? undefined}
        onClose={clearAccessMessage}
      />

      {/* FORGOT PASSWORD RESET MODAL */}
      <AppModal
        visible={forgotModalVisible}
        title="Reset your password"
        message="Enter your registered email address to receive password reset instructions."
        onClose={() => setForgotModalVisible(false)}
      >
        <View style={styles.forgotForm}>
          <TextInput
            value={forgotEmail}
            onChangeText={setForgotEmail}
            placeholder="you@example.com"
            placeholderTextColor={theme.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            style={[
              styles.modalInput,
              { color: theme.text, backgroundColor: theme.surfaceSecondary, borderColor: theme.border },
            ]}
          />

          <Pressable
            accessibilityRole="button"
            disabled={sendingReset || !forgotEmail.trim()}
            onPress={() => void handleSendPasswordReset()}
            style={({ pressed }) => [
              styles.sendResetButton,
              { backgroundColor: theme.primary },
              (!forgotEmail.trim() || sendingReset) && styles.disabled,
              pressed && forgotEmail.trim() && !sendingReset && styles.pressed,
            ]}
          >
            {sendingReset ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.sendResetText}>Send Reset Link</Text>
            )}
          </Pressable>
        </View>
      </AppModal>
    </>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: layout.screenHorizontalPadding,
    paddingTop: 28,
    paddingBottom: 28,
  },
  screen: { flexGrow: 1 },
  brandSection: { marginBottom: 48 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 13 },
  wordmark: { flexDirection: "row", alignItems: "center" },
  feng: { fontSize: 42, lineHeight: 46, fontWeight: fontWeight.bold, letterSpacing: -1.8 },
  xing: { fontSize: 42, lineHeight: 46, fontWeight: fontWeight.bold, letterSpacing: -1.8 },
  brandCaption: { marginTop: 10, marginLeft: 66, fontSize: 9.5, fontWeight: fontWeight.bold, letterSpacing: 1.65 },

  intro: { marginBottom: 32 },
  eyebrow: { marginBottom: 12, fontSize: 11, fontWeight: fontWeight.bold, letterSpacing: 1.5 },
  title: { fontSize: 38, lineHeight: 42, fontWeight: fontWeight.bold, letterSpacing: -1.3 },
  subtitle: { marginTop: 12, fontSize: fontSize.md, lineHeight: 23 },

  form: { gap: spacing.lg },
  passwordWrap: { gap: 6 },
  forgotLink: { alignSelf: "flex-end", paddingVertical: 4 },
  forgotText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },

  actionArea: { marginTop: 4, gap: 20 },
  registerRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 4, marginBottom: 28 },
  registerQuestion: { fontSize: 13, lineHeight: 20 },
  registerButton: { minHeight: 30, justifyContent: "center" },
  registerText: { fontSize: 13, fontWeight: fontWeight.bold },

  footer: { marginTop: "auto", paddingTop: 36, alignItems: "center" },
  footerLine: { width: 28, height: 1, marginBottom: 12 },
  footerText: { fontSize: 11, lineHeight: 16, letterSpacing: 0.15 },

  forgotForm: { gap: spacing.md, paddingTop: spacing.md },
  modalInput: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.md,
  },
  sendResetButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
  },
  sendResetText: { color: "#FFFFFF", fontSize: fontSize.sm, fontWeight: fontWeight.bold },

  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.55 },
});
