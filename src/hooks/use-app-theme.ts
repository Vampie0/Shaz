import { colors } from "@/constants/theme";

import { useResolvedColorScheme } from "@/features/theme/theme-preference";
export function useAppTheme() {
  const colorScheme = useResolvedColorScheme();

  return colorScheme === "dark" ? colors.dark : colors.light;
}
