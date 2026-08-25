import AppButton from "@/components/ui/AppButton";
import AppInput from "@/components/ui/AppInput";
import AppModal from "@/components/ui/AppModal";
import FengxingWheel from "@/components/ui/FengxingWheel";
import KeyboardScreenContainer from "@/components/ui/KeyboardScreenContainer";
import {
  fontSize,
  fontWeight,
  layout,
  radius,
  spacing,
} from "@/constants/theme";
import { toastError, toastSuccess } from "@/features/toast/toast-store";
import { useAppTheme } from "@/hooks/use-app-theme";
import { supabase } from "@/services/supabase/client";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
// FRONTEND UK PHONE NUMBER VALIDATION REGEX
function isValidUkPhone(phone: string): boolean {
  const clean = phone.replace(/[\s\-()]/g, "");
  // Matches UK Mobile & Landline: 07xxx xxxxxx, +447xxx xxxxxx, 01/02/03xxx
  const ukRegex =
    /^(?:(?:\+44\s?|0)7\d{3}\s?\d{6}|(?:\+44\s?|0)[1237]\d{8,9})$/;
  return ukRegex.test(clean);
}

export default function RegisterScreen() {
  const theme = useAppTheme();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [fullNameError, setFullNameError] = useState<string | undefined>();
  const [emailError, setEmailError] = useState<string | undefined>();
  const [phoneError, setPhoneError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | undefined
  >();

  const [submitting, setSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const validate = () => {
    let valid = true;
    const cleanEmail = email.trim();
    const cleanPhone = phone.trim();

    setFullNameError(undefined);
    setEmailError(undefined);
    setPhoneError(undefined);
    setPasswordError(undefined);
    setConfirmPasswordError(undefined);

    if (!fullName.trim()) {
      setFullNameError("Enter your full name.");
      valid = false;
    }

    if (!cleanEmail) {
      setEmailError("Enter your email address.");
      valid = false;
    } else if (!cleanEmail.includes("@")) {
      setEmailError("Enter a valid email address.");
      valid = false;
    }

    if (!cleanPhone) {
      setPhoneError("Enter your UK phone number.");
      valid = false;
    } else if (!isValidUkPhone(cleanPhone)) {
      setPhoneError("Enter a valid UK phone number (e.g. 07123 456789).");
      valid = false;
    }

    if (!password) {
      setPasswordError("Enter your password.");
      valid = false;
    } else if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      valid = false;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
      valid = false;
    }

    return valid;
  };

  const handleRegister = async () => {
    if (!validate() || submitting) return;

    Keyboard.dismiss();
    setSubmitting(true);
    setRegisterError(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    try {
      const { error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: cleanPhone,
            role: "customer",
          },
        },
      });

      if (error) throw error;

      setIsSuccess(true);
    } catch (err) {
      console.error("Registration error:", err);
      const msg =
        typeof err === "object" && err !== null && "message" in err
          ? String((err as any).message)
          : "Could not create account. Please try again.";

      setRegisterError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendEmail = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || isResending) return;

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: cleanEmail,
      });

      if (error) throw error;

      toastSuccess(
        "Confirmation email resent! Check your inbox.",
        "Email Resent",
      );
    } catch (err) {
      console.error("Resend confirmation error:", err);
      toastError("Could not resend email. Please try again later.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <>
      <KeyboardScreenContainer
        contentContainerStyle={styles.scrollContent}
        bottomPadding={220}
      >
        <View style={styles.screen}>
          <View style={styles.topRow}>
            <Pressable
              accessibilityRole="button"
              hitSlop={12}
              onPress={router.back}
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.backText, { color: theme.primary }]}>
                Back
              </Text>
            </Pressable>

            <View style={styles.miniBrand}>
              <FengxingWheel size={30} duration={9000} />
              <View style={styles.wordmark}>
                <Text style={[styles.brandText, { color: theme.text }]}>
                  feng
                </Text>
                <Text style={[styles.brandText, { color: theme.primary }]}>
                  xing
                </Text>
              </View>
            </View>
          </View>

          {isSuccess ? (
            /* CONFIRMATION EMAIL VIEW MATCHING WEBSITE SCREENSHOT EXACTLY */
            <View style={styles.confirmWrap}>
              <View style={styles.intro}>
                <Text style={[styles.eyebrow, { color: theme.primary }]}>
                  CREATE YOUR ACCOUNT
                </Text>
                <Text style={[styles.title, { color: theme.text }]}>
                  Join Fengxing today
                </Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  It only takes a moment. Your account lets you buy, sell and
                  manage car care.
                </Text>
              </View>

              <View
                style={[
                  styles.greenBox,
                  {
                    backgroundColor: theme.successSoft,
                    borderColor: theme.success,
                  },
                ]}
              >
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: theme.surface },
                  ]}
                >
                  <Ionicons
                    name="mail-unread-outline"
                    size={28}
                    color={theme.success}
                  />
                </View>

                <Text style={[styles.boxTitle, { color: theme.text }]}>
                  Check your email
                </Text>

                <Text style={[styles.boxText, { color: theme.textSecondary }]}>
                  We sent a confirmation link to{" "}
                  <Text
                    style={{ fontWeight: fontWeight.bold, color: theme.text }}
                  >
                    {email.trim()}
                  </Text>
                  . You must confirm your email before signing in.
                </Text>

                <Pressable
                  accessibilityRole="button"
                  disabled={isResending}
                  onPress={() => void handleResendEmail()}
                  style={({ pressed }) => [
                    styles.resendButton,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                    pressed && !isResending && styles.pressed,
                  ]}
                >
                  {isResending ? (
                    <ActivityIndicator size="small" color={theme.text} />
                  ) : (
                    <>
                      <Ionicons
                        name="refresh-outline"
                        size={18}
                        color={theme.text}
                      />
                      <Text
                        style={[styles.resendButtonText, { color: theme.text }]}
                      >
                        Resend confirmation email
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>

              <View style={styles.loginRow}>
                <Text
                  style={[styles.loginQuestion, { color: theme.textSecondary }]}
                >
                  Already have an account?{" "}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.replace("/login")}
                  hitSlop={8}
                >
                  <Text style={[styles.loginText, { color: theme.primary }]}>
                    Log in
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            /* SIGNUP FORM */
            <View style={styles.formWrap}>
              <View style={styles.intro}>
                <Text style={[styles.eyebrow, { color: theme.primary }]}>
                  CREATE YOUR ACCOUNT
                </Text>

                <Text style={[styles.title, { color: theme.text }]}>
                  Join Fengxing today
                </Text>

                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  It only takes a moment. Your account lets you buy, sell and
                  manage car care.
                </Text>
              </View>

              <View style={styles.form}>
                <AppInput
                  label="Full name"
                  value={fullName}
                  onChangeText={(v) => {
                    setFullName(v);
                    if (fullNameError) setFullNameError(undefined);
                  }}
                  placeholder="Your full name"
                  autoCapitalize="words"
                  autoComplete="name"
                  textContentType="name"
                  returnKeyType="next"
                  error={fullNameError}
                />

                <AppInput
                  label="Email address"
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
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

                {/* UK PHONE NUMBER FIELD */}
                <AppInput
                  label="UK phone number"
                  value={phone}
                  onChangeText={(v) => {
                    setPhone(v);
                    if (phoneError) setPhoneError(undefined);
                  }}
                  placeholder="07123 456789"
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  error={phoneError}
                />

                <AppInput
                  label="Password"
                  value={password}
                  onChangeText={(v) => {
                    setPassword(v);
                    if (passwordError) setPasswordError(undefined);
                  }}
                  placeholder="At least 8 characters"
                  password
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="new-password"
                  textContentType="newPassword"
                  returnKeyType="next"
                  error={passwordError}
                />

                <AppInput
                  label="Confirm password"
                  value={confirmPassword}
                  onChangeText={(v) => {
                    setConfirmPassword(v);
                    if (confirmPasswordError)
                      setConfirmPasswordError(undefined);
                  }}
                  placeholder="Repeat your password"
                  password
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="new-password"
                  textContentType="newPassword"
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                  error={confirmPasswordError}
                />

                <View style={styles.actionArea}>
                  <AppButton
                    title="Create account"
                    onPress={handleRegister}
                    loading={submitting}
                  />

                  <View style={styles.loginRow}>
                    <Text
                      style={[
                        styles.loginQuestion,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Already have an account?{" "}
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => router.replace("/login")}
                      hitSlop={8}
                    >
                      <Text
                        style={[styles.loginText, { color: theme.primary }]}
                      >
                        Log in
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>
      </KeyboardScreenContainer>

      <AppModal
        visible={Boolean(registerError)}
        title="Registration Failed"
        message={registerError ?? undefined}
        onClose={() => setRegisterError(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: layout.screenHorizontalPadding,
    paddingTop: 24,
    paddingBottom: 32,
  },
  screen: { flexGrow: 1 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 36,
  },
  backButton: { minHeight: 34, justifyContent: "center" },
  backText: { fontSize: 13, fontWeight: fontWeight.bold },
  miniBrand: { flexDirection: "row", alignItems: "center", gap: 8 },
  wordmark: { flexDirection: "row" },
  brandText: {
    fontSize: 21,
    lineHeight: 24,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.8,
  },

  formWrap: { gap: 0 },
  confirmWrap: { gap: spacing.xl },

  intro: { marginBottom: 8 },
  eyebrow: {
    marginBottom: 10,
    fontSize: 11,
    fontWeight: fontWeight.bold,
    letterSpacing: 1.4,
  },
  title: {
    fontSize: 36,
    lineHeight: 40,
    fontWeight: fontWeight.bold,
    letterSpacing: -1.1,
  },
  subtitle: { marginTop: 2, fontSize: fontSize.md, lineHeight: 23 },

  greenBox: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: "center",
    textAlign: "center",
    gap: spacing.md,
  },
  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
  },
  boxTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  boxText: {
    fontSize: fontSize.sm,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 320,
  },
  resendButton: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xs,
  },
  resendButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },

  form: { gap: spacing.lg },
  actionArea: { marginTop: 8, gap: 8 },

  loginRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    marginBottom: 28,
  },
  loginQuestion: { fontSize: 13 },
  loginText: { fontSize: 13, fontWeight: fontWeight.bold },

  pressed: { opacity: 0.6 },
});
