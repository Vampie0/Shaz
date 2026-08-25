import type { Session } from "@supabase/supabase-js";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  getCurrentSession,
  getProfile,
  signInWithPassword,
  signOut as signOutService,
} from "@/features/auth/auth.service";
import type {
  WorkerProfile,
} from "@/features/auth/auth.types";
import { supabase } from "@/services/supabase/client";

import { unregisterThisDevicePushToken } from "@/features/notifications/push-registration.service";
type AuthContextValue = {
  session: Session | null;
  profile: WorkerProfile | null;

  isInitializing: boolean;
  isAuthenticated: boolean;

  isCustomer: boolean;
  isInspector: boolean;

  accessMessage: string | null;

  signIn: (
    email: string,
    password: string,
  ) => Promise<void>;

  signOut: () => Promise<void>;

  clearAccessMessage: () => void;
};

export const AuthContext =
  createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
}: PropsWithChildren) {
  const [session, setSession] =
    useState<Session | null>(null);

  const [profile, setProfile] =
    useState<WorkerProfile | null>(null);

  const [isInitializing, setIsInitializing] =
    useState(true);

  const [accessMessage, setAccessMessage] =
    useState<string | null>(null);

  const mountedRef = useRef(true);

  const clearAuthState = useCallback(() => {
    if (!mountedRef.current) {
      return;
    }

    setSession(null);
    setProfile(null);
  }, []);

  const clearAccessMessage = useCallback(() => {
    if (!mountedRef.current) {
      return;
    }

    setAccessMessage(null);
  }, []);

  const safelySignOut = useCallback(async () => {
    try {
      await signOutService();
    } catch (error) {
      console.error(
        "Supabase sign-out failed:",
        error,
      );
    }
  }, []);

  const rejectAccess = useCallback(
    async (message: string) => {
      if (mountedRef.current) {
        setAccessMessage(message);
      }

      await safelySignOut();
      clearAuthState();
    },
    [
      clearAuthState,
      safelySignOut,
    ],
  );

  const loadProfileForSession = useCallback(
    async (
      activeSession: Session | null,
    ): Promise<boolean> => {
      if (!activeSession) {
        clearAuthState();
        return false;
      }

      const userProfile =
        await getProfile(
          activeSession.user.id,
        );

      if (!userProfile) {
        await rejectAccess(
          "We couldn't find a Fengxing profile for this account.",
        );

        return false;
      }

      /**
       * Admin uses the existing Fengxing web dashboard.
       */
      if (userProfile.role === "admin") {
        await rejectAccess(
          "Admin accounts are managed through the Fengxing web dashboard.",
        );

        return false;
      }

      /**
       * Inspectors are created by admin and must be active.
       */
      if (
        userProfile.role === "inspector" &&
        userProfile.staff_status !== "active"
      ) {
        await rejectAccess(
          "Your Fengxing staff account is currently inactive. Please contact an administrator.",
        );

        return false;
      }

      /**
       * Only these two roles use the mobile app.
       */
      if (
        userProfile.role !== "customer" &&
        userProfile.role !== "inspector"
      ) {
        await rejectAccess(
          "This account does not have access to the Fengxing mobile app.",
        );

        return false;
      }

      if (!mountedRef.current) {
        return false;
      }

      setSession(activeSession);
      setProfile(userProfile);

      return true;
    },
    [
      clearAuthState,
      rejectAccess,
    ],
  );

  useEffect(() => {
    mountedRef.current = true;

    const initialize = async () => {
      try {
        const existingSession =
          await getCurrentSession();

        await loadProfileForSession(
          existingSession,
        );
      } catch (error) {
        console.error(
          "Failed to initialize Fengxing auth:",
          error,
        );

        clearAuthState();
      } finally {
        if (mountedRef.current) {
          setIsInitializing(false);
        }
      }
    };

    void initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        if (!mountedRef.current) {
          return;
        }

        if (event === "SIGNED_OUT") {
          clearAuthState();
          return;
        }

        /**
         * Keep refreshed session tokens current.
         * Profile validation is performed explicitly during
         * initialization and sign-in.
         */
        if (
          event === "TOKEN_REFRESHED" &&
          nextSession
        ) {
          setSession(nextSession);
        }
      },
    );

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [
    clearAuthState,
    loadProfileForSession,
  ]);

  const signIn = useCallback(
    async (
      email: string,
      password: string,
    ) => {
      clearAccessMessage();

      try {
        const activeSession =
          await signInWithPassword(
            email,
            password,
          );

        const accepted =
          await loadProfileForSession(
            activeSession,
          );

        if (!accepted) {
          return;
        }
      } catch (error) {
        // Pass error to login UI handler

        throw error;
      }
    },
    [
      clearAccessMessage,
      loadProfileForSession,
    ],
  );

  const signOut = useCallback(
    async () => {
      clearAccessMessage();

      try {
        try {
          await unregisterThisDevicePushToken();
        } catch (error) {
          console.warn(
            "Fengxing push-token unregister failed:",
            error,
          );
        }

        await signOutService();
      } finally {
        clearAuthState();
      }
    },
    [
      clearAccessMessage,
      clearAuthState,
    ],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,

      isInitializing,

      isAuthenticated:
        Boolean(session && profile),

      isCustomer:
        profile?.role === "customer",

      isInspector:
        profile?.role === "inspector",

      accessMessage,

      signIn,
      signOut,

      clearAccessMessage,
    }),
    [
      session,
      profile,
      isInitializing,
      accessMessage,
      signIn,
      signOut,
      clearAccessMessage,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Keep both import styles working because the existing
 * RootLayout used a default AuthProvider import.
 */
export default AuthProvider;

