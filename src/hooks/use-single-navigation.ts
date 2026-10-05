// hooks/use-single-navigation.ts
import { router } from "expo-router";
import { useCallback, useRef } from "react";

export function useSingleNavigation(delay = 1500) {
  const isNavigatingRef = useRef(false);

  const navigate = useCallback(
    (pathname: any, params?: any) => {
      if (isNavigatingRef.current) return;

      isNavigatingRef.current = true;

      if (params) {
        router.push({ pathname, params });
      } else {
        router.push(pathname);
      }

      setTimeout(() => {
        isNavigatingRef.current = false;
      }, delay);
    },
    [delay],
  );

  const isBlocked = isNavigatingRef.current;

  return { navigate, isBlocked };
}
