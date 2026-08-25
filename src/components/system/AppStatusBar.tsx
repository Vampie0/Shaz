import { StatusBar } from "expo-status-bar";

import { useResolvedColorScheme } from "@/features/theme/theme-preference";

export default function AppStatusBar() {
  const colorScheme = useResolvedColorScheme();

  return (
    <StatusBar
      style={colorScheme === "dark" ? "light" : "dark"}
    />
  );
}
