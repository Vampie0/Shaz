import { useRef, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";

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
import { useSingleNavigation } from "@/hooks/use-single-navigation";

import ThemePreferenceSelector from "@/components/account/ThemePreferenceSelector";

export default function AccountScreen() {
  const { profile, session, signOut } = useAuth();
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { navigate, isBlocked } = useSingleNavigation();

  // SNAPSHOT GUARD: Yeh logout ke doran UI ko blank hone se bachata hai
  const lastProfile = useRef(profile);
  const lastSession = useRef(session);
  if (profile) lastProfile.current = profile;
  if (session) lastSession.current = session;

  const currentProfile = profile || lastProfile.current;
  const currentSession = session || lastSession.current;

  const handleLogout = async () => {
    if (isBlocked || isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      setLogoutVisible(false);
      await new Promise((resolve) => setTimeout(resolve, 200));
      // ab navigate hook se guard ke saath
      navigate("/login" as any);
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
            <InfoRow
              label="Name"
              value={currentProfile?.full_name || "Not provided"}
            />
            <InfoRow
              label="Email"
              value={currentSession?.user?.email || "Not provided"}
            />
            <InfoRow
              label="Phone"
              value={currentProfile?.phone || "Not provided"}
            />
            <InfoRow
              label="Employee ID"
              value={currentProfile?.employee_id || "Not assigned"}
            />
            <InfoRow
              label="Status"
              value={
                currentProfile?.staff_status === "active"
                  ? "Active"
                  : "Inactive"
              }
              last
            />
          </SectionCard>

          <ThemePreferenceSelector />

          <AppButton
            title="Log out"
            variant="danger"
            onPress={() => {
              if (isBlocked) return;
              setLogoutVisible(true);
            }}
            loading={isLoggingOut}
            disabled={isBlocked || isLoggingOut}
          />
        </ScrollView>
      </ScreenContainer>

      <AppModal
        visible={logoutVisible}
        title="Log out?"
        message="You will need to sign in again to access your assigned jobs."
        confirmText="Log out"
        onConfirm={handleLogout}
        onClose={() => !isLoggingOut && !isBlocked && setLogoutVisible(false)}
        loading={isLoggingOut}
        destructive
      />
    </>
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
});
