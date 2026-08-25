import { router } from "expo-router";
import { useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import InfoRow from "@/components/jobs/InfoRow";
import SectionCard from "@/components/jobs/SectionCard";
import AppButton from "@/components/ui/AppButton";
import AppModal from "@/components/ui/AppModal";
import AppTopBar from "@/components/ui/AppTopBar";
import ScreenContainer from "@/components/ui/ScreenContainer";
import ScreenHeading from "@/components/ui/ScreenHeading";
import { spacing } from "@/constants/theme";
import { useAuth } from "@/features/auth/use-auth";
import { toastError } from "@/features/toast/toast-store";

import ThemePreferenceSelector from "@/components/account/ThemePreferenceSelector";

export default function AccountScreen() {
  const { profile, session, signOut } = useAuth();

  const [logoutVisible, setLogoutVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // SNAPSHOT GUARD: Preserve last valid profile/session to prevent 1-frame unmount text shift
  const lastProfile = useRef(profile);
  const lastSession = useRef(session);

  if (profile) lastProfile.current = profile;
  if (session) lastSession.current = session;

  const currentProfile = profile || lastProfile.current;
  const currentSession = session || lastSession.current;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // 1. Close Modal overlay FIRST
      setLogoutVisible(false);

      // 2. Wait 200ms for native modal overlay close animation to complete
      await new Promise((resolve) => setTimeout(resolve, 200));

      // 3. Clear auth session (AuthProvider handles clean redirect to /login)
      await signOut();
    } catch {
      toastError("Logout failed. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <ScreenContainer contentStyle={styles.screen}>
        <AppTopBar trailingText="Account" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <ScreenHeading
            eyebrow="Worker profile"
            title={currentProfile?.full_name || "Account"}
            subtitle="Your field worker profile and account access."
          />

          <SectionCard title="Worker details">
            <InfoRow label="Name" value={currentProfile?.full_name || "Not provided"} />
            <InfoRow label="Email" value={currentSession?.user?.email || "Not provided"} />
            <InfoRow label="Phone" value={currentProfile?.phone || "Not provided"} />
            <InfoRow
              label="Employee ID"
              value={currentProfile?.employee_id || "Not assigned"}
            />
            <InfoRow
              label="Status"
              value={currentProfile?.staff_status === "active" ? "Active" : "Inactive"}
              last
            />
          </SectionCard>

          <ThemePreferenceSelector />

          <AppButton
            title="Log out"
            variant="danger"
            onPress={() => setLogoutVisible(true)}
          />
        </ScrollView>
      </ScreenContainer>

      <AppModal
        visible={logoutVisible}
        title="Log out?"
        message="You will need to sign in again to access your assigned jobs."
        confirmText="Log out"
        onConfirm={handleLogout}
        onClose={() => setLogoutVisible(false)}
        loading={isLoggingOut}
        destructive
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
  },

  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
    gap: spacing.xxl,
  },
});
