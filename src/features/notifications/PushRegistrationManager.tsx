import { useEffect, useRef } from "react";

import { useAuth } from "@/features/auth/use-auth";
import { registerThisDevicePushToken } from "@/features/notifications/push-registration.service";

export default function PushRegistrationManager() {
  const { profile } = useAuth();

  const registeredFor = useRef<string | null>(null);

  useEffect(() => {
    const userId =
      profile?.role === "inspector" && profile.staff_status === "active"
        ? profile.id
        : null;

    if (!userId) {
      registeredFor.current = null;
      return;
    }

    if (registeredFor.current === userId) {
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        await registerThisDevicePushToken();

        if (!cancelled) {
          registeredFor.current = userId;
        }
      } catch (error) {
        console.warn("Shaz push registration failed:", error);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [profile?.id, profile?.role, profile?.staff_status]);

  return null;
}
