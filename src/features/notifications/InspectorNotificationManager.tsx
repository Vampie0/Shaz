import * as Notifications from "expo-notifications";
import {
  router,
} from "expo-router";
import {
  useEffect,
} from "react";

import {
  useAuth,
} from "@/features/auth/use-auth";
import {
  useWorkerJobs,
} from "@/features/jobs/use-worker-jobs";
import {
  prepareInspectorNotifications,
  syncJobReminders,
} from "@/features/notifications/notification.service";

function openNotificationJob(
  response:
    Notifications.NotificationResponse,
) {
  const data =
    response.notification
      .request.content.data;

  const assignmentId =
    typeof data?.assignmentId ===
    "string"
      ? data.assignmentId
      : null;

  if (!assignmentId) {
    return;
  }

  router.push({
    pathname:
      "/jobs/[id]",
    params: {
      id:
        assignmentId,
    },
  });
}

export default function InspectorNotificationManager() {
  const {
    profile,
  } =
    useAuth();

  const inspectorId =
    profile?.role ===
      "inspector"
      ? profile.id
      : undefined;

  const {
    data: jobs = [],
    refetch,
  } =
    useWorkerJobs(
      inspectorId,
    );

  useEffect(() => {
    if (!inspectorId) {
      return;
    }

    void prepareInspectorNotifications();
  }, [
    inspectorId,
  ]);

  useEffect(() => {
    if (!inspectorId) {
      return;
    }

    void syncJobReminders(
      inspectorId,
      jobs,
    );
  }, [
    inspectorId,
    jobs,
  ]);

  /**
   * Push is now the primary external-change alert.
   * Polling remains only as a quiet reconciliation fallback.
   */
  useEffect(() => {
    if (!inspectorId) {
      return;
    }

    const interval =
      setInterval(
        () => {
          void refetch();
        },
        60 * 1000,
      );

    return () => {
      clearInterval(
        interval,
      );
    };
  }, [
    inspectorId,
    refetch,
  ]);

  /**
   * When a remote push arrives while the app is foregrounded,
   * immediately refresh the worker jobs cache.
   */
  useEffect(() => {
    const listener =
      Notifications
        .addNotificationReceivedListener(
          () => {
            void refetch();
          },
        );

    return () => {
      listener.remove();
    };
  }, [
    refetch,
  ]);

  useEffect(() => {
    const listener =
      Notifications
        .addNotificationResponseReceivedListener(
          openNotificationJob,
        );

    void Notifications
      .getLastNotificationResponseAsync()
      .then(
        (response) => {
          if (response) {
            openNotificationJob(
              response,
            );
          }
        },
      );

    return () => {
      listener.remove();
    };
  }, []);

  return null;
}

