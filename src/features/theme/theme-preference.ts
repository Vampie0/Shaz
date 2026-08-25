import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";
import { useColorScheme } from "react-native";

export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "@fengxing/theme-preference";

const listeners = new Set<() => void>();

// Default initial theme preference for fresh installs is LIGHT mode!
let preference: ThemePreference = "light";
let hydrated = false;

function isThemePreference(value: string | null): value is ThemePreference {
  return (
    value === "system" ||
    value === "light" ||
    value === "dark"
  );
}

function emit() {
  listeners.forEach((listener) => listener());
}

async function hydrateThemePreference() {
  if (hydrated) return;

  hydrated = true;

  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);

    if (isThemePreference(saved)) {
      preference = saved;
    }
  } catch (error) {
    console.warn("Theme preference restore failed:", error);
  }

  emit();
}

void hydrateThemePreference();

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return preference;
}

export async function setThemePreference(next: ThemePreference) {
  preference = next;
  emit();

  try {
    await AsyncStorage.setItem(STORAGE_KEY, next);
  } catch (error) {
    console.warn("Theme preference save failed:", error);
  }
}

export function useThemePreference() {
  const current = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot,
  );

  return {
    preference: current,
    setPreference: setThemePreference,
  };
}

export function useResolvedColorScheme(): ResolvedTheme {
  const systemScheme = useColorScheme();
  const { preference } = useThemePreference();

  if (preference === "light") {
    return "light";
  }

  if (preference === "dark") {
    return "dark";
  }

  return systemScheme === "dark" ? "dark" : "light";
}
