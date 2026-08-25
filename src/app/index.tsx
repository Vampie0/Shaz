import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";

import FullScreenLoader from "@/components/ui/FullScreenLoader";
import { useAuth } from "@/features/auth/use-auth";

const ONBOARDING_KEY = "@fengxing/has-seen-onboarding";

export default function IndexScreen() {
  const { isInitializing, isAuthenticated, profile } = useAuth();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  useEffect(() => {
    async function checkOnboarding() {
      try {
        const val = await AsyncStorage.getItem(ONBOARDING_KEY);
        if (val === "true") {
          setHasSeenOnboarding(true);
        }
      } catch {
        // Default false
      } finally {
        setCheckingOnboarding(false);
      }
    }
    void checkOnboarding();
  }, []);

  if (isInitializing || checkingOnboarding) {
    return <FullScreenLoader />;
  }

  if (!hasSeenOnboarding && !isAuthenticated) {
    return <Redirect href="/onboarding" />;
  }

  if (!isAuthenticated || !profile) {
    return <Redirect href="/login" />;
  }

  if (profile.role === "inspector") {
    return <Redirect href="/(tabs)/today" />;
  }

  if (profile.role === "customer") {
    return <Redirect href="/(customer)/(tabs)/overview" />;
  }

  return <Redirect href="/login" />;
}
