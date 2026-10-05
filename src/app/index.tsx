import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";

import { useAuth } from "@/features/auth/use-auth";

const ONBOARDING_KEY = "@shaz/has-seen-onboarding";

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

  // Wheel removed: return null so Splash Screen stays visible
  if (isInitializing || checkingOnboarding) {
    return null;
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
