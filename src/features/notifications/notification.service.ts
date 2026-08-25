import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import {
  Platform,
} from "react-native";

import type {
  WorkerJob,
} from "@/types/job";

const OLD_JOB_NOTIFICATION_CHANNEL =
  "fengxing-jobs";

export const JOB_NOTIFICATION_CHANNEL =
  "fengxing-jobs-v2";

const REMINDERS_KEY =
  "@fengxing/job-reminders";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type NotificationSnapshotItem = {
  status: string;
  assignmentStatus: string;
  scheduleKey: string;
};

export type NotificationSnapshot =
  Record<
    string,
    NotificationSnapshotItem
  >;

type ReminderStore = Record<
  string,
  {
    identifier: string;
    scheduleKey: string;
  }
>;

function isCancelled(
  job: WorkerJob,
) {
  return (
    job.status === "cancelled" ||
    job.assignmentStatus ===
      "cancelled"
  );
}

function isFinished(
  job: WorkerJob,
) {
  return (
    job.status === "completed" ||
    isCancelled(job)
  );
}

function kindLabel(
  job: WorkerJob,
) {
  return job.kind === "service"
    ? "service"
    : "inspection";
}

function appointmentDate(
  job: WorkerJob,
) {
  const date =
    job.scheduledDate;

  const time =
    job.scheduledTime;

  if (
    !date ||
    !time ||
    !/^\d{4}-\d{2}-\d{2}$/.test(
      date,
    ) ||
    !/^\d{2}:\d{2}/.test(
      time,
    )
  ) {
    return null;
  }

  const [
    year,
    month,
    day,
  ] =
    date
      .split("-")
      .map(Number);

  const [
    hour,
    minute,
  ] =
    time
      .slice(0, 5)
      .split(":")
      .map(Number);

  const value =
    new Date(
      year,
      month - 1,
      day,
      hour,
      minute,
      0,
      0,
    );

  if (
    Number.isNaN(
      value.getTime(),
    )
  ) {
    return null;
  }

  return value;
}

export function getJobScheduleKey(
  job: WorkerJob,
) {
  return [
    job.scheduledDate ?? "",
    job.scheduledTime ?? "",
  ].join("|");
}

export function createNotificationSnapshot(
  jobs: WorkerJob[],
): NotificationSnapshot {
  return Object.fromEntries(
    jobs.map(
      (job) => [
        job.assignmentId,
        {
          status:
            job.status,
          assignmentStatus:
            job.assignmentStatus,
          scheduleKey:
            getJobScheduleKey(
              job,
            ),
        },
      ],
    ),
  );
}

export async function prepareInspectorNotifications() {
  if (
    Platform.OS === "android"
  ) {
    try {
      await Notifications
        .deleteNotificationChannelAsync(
          OLD_JOB_NOTIFICATION_CHANNEL,
        );
    } catch {
      // Old channel may not exist.
    }

    await Notifications.setNotificationChannelAsync(
      JOB_NOTIFICATION_CHANNEL,
      {
        name:
          "Fengxing job updates",
        description:
          "Assignments, schedule changes and job reminders.",
        importance:
          Notifications
            .AndroidImportance
            .HIGH,
        vibrationPattern: [
          0,
          180,
          120,
          180,
        ],
        lightColor:
          "#D92D20",
      },
    );
  }

  const current =
    await Notifications
      .getPermissionsAsync();

  if (current.granted) {
    return true;
  }

  if (!current.canAskAgain) {
    return false;
  }

  const requested =
    await Notifications
      .requestPermissionsAsync();

  return requested.granted;
}

async function presentJobNotification({
  title,
  body,
  assignmentId,
}: {
  title: string;
  body: string;
  assignmentId: string;
}) {
  const permission =
    await Notifications
      .getPermissionsAsync();

  if (!permission.granted) {
    return;
  }

  await Notifications
    .scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        data: {
          assignmentId,
          route:
            "/jobs/[id]",
        },
      },

      trigger:
        Platform.OS ===
        "android"
          ? {
              channelId:
                JOB_NOTIFICATION_CHANNEL,
            }
          : null,
    });
}

export async function notifyNewAssignment(
  job: WorkerJob,
) {
  await presentJobNotification({
    title:
      job.kind ===
      "service"
        ? "New service job"
        : "New inspection assigned",

    body:
      job.vehicleLabel +
      (
        job.registration
          ? " · " +
            job.registration
          : ""
      ),

    assignmentId:
      job.assignmentId,
  });
}

export async function notifyAppointmentChanged(
  job: WorkerJob,
) {
  const date =
    appointmentDate(job);

  const readable =
    date
      ? date.toLocaleString(
          undefined,
          {
            weekday: "short",
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          },
        )
      : "Check the updated appointment in the app.";

  await presentJobNotification({
    title:
      "Job appointment updated",

    body:
      job.vehicleLabel +
      " · " +
      readable,

    assignmentId:
      job.assignmentId,
  });
}

export async function notifyAssignmentCancelled(
  job: WorkerJob,
) {
  await presentJobNotification({
    title:
      "Assignment cancelled",

    body:
      job.vehicleLabel +
      " is no longer an active assignment.",

    assignmentId:
      job.assignmentId,
  });
}

export async function notifyInspectionFinalised(
  job: WorkerJob,
) {
  if (
    job.kind !==
    "inspection"
  ) {
    return;
  }

  await presentJobNotification({
    title:
      "Inspection finalised",

    body:
      job.vehicleLabel +
      " has been finalised by Fengxing.",

    assignmentId:
      job.assignmentId,
  });
}

function reminderStorageKey(
  userId: string,
) {
  return (
    REMINDERS_KEY +
    ":" +
    userId
  );
}

async function readReminderStore(
  userId: string,
): Promise<ReminderStore> {
  try {
    const raw =
      await AsyncStorage
        .getItem(
          reminderStorageKey(
            userId,
          ),
        );

    if (!raw) {
      return {};
    }

    return JSON.parse(
      raw,
    ) as ReminderStore;
  } catch {
    return {};
  }
}

async function writeReminderStore(
  userId: string,
  value: ReminderStore,
) {
  await AsyncStorage.setItem(
    reminderStorageKey(
      userId,
    ),
    JSON.stringify(value),
  );
}

export async function syncJobReminders(
  userId: string,
  jobs: WorkerJob[],
) {
  const permission =
    await Notifications
      .getPermissionsAsync();

  if (!permission.granted) {
    return;
  }

  const store =
    await readReminderStore(
      userId,
    );

  const activeIds =
    new Set(
      jobs.map(
        (job) =>
          job.assignmentId,
      ),
    );

  for (
    const [
      assignmentId,
      entry,
    ] of Object.entries(
      store,
    )
  ) {
    if (
      activeIds.has(
        assignmentId,
      )
    ) {
      continue;
    }

    try {
      await Notifications
        .cancelScheduledNotificationAsync(
          entry.identifier,
        );
    } catch {
      // Already fired/cancelled.
    }

    delete store[
      assignmentId
    ];
  }

  for (const job of jobs) {
    const existing =
      store[
        job.assignmentId
      ];

    if (isFinished(job)) {
      if (existing) {
        try {
          await Notifications
            .cancelScheduledNotificationAsync(
              existing.identifier,
            );
        } catch {
          // Already fired/cancelled.
        }

        delete store[
          job.assignmentId
        ];
      }

      continue;
    }

    const appointment =
      appointmentDate(job);

    if (!appointment) {
      continue;
    }

    const reminderDate =
      new Date(
        appointment.getTime() -
          60 *
            60 *
            1000,
      );

    const scheduleKey =
      "notification-v2|" +
      getJobScheduleKey(job);

    if (
      reminderDate.getTime() <=
      Date.now() +
        60 *
          1000
    ) {
      if (existing) {
        try {
          await Notifications
            .cancelScheduledNotificationAsync(
              existing.identifier,
            );
        } catch {
          // Already fired/cancelled.
        }

        delete store[
          job.assignmentId
        ];
      }

      continue;
    }

    if (
      existing?.scheduleKey ===
      scheduleKey
    ) {
      continue;
    }

    if (existing) {
      try {
        await Notifications
          .cancelScheduledNotificationAsync(
            existing.identifier,
          );
      } catch {
        // Already fired/cancelled.
      }
    }

    const identifier =
      await Notifications
        .scheduleNotificationAsync({
          content: {
            title:
              "Job in 1 hour",

            body:
              job.vehicleLabel +
              " · " +
              kindLabel(job),

            sound: true,

            data: {
              assignmentId:
                job.assignmentId,
              route:
                "/jobs/[id]",
            },
          },

          trigger: {
            type:
              Notifications
                .SchedulableTriggerInputTypes
                .DATE,

            date:
              reminderDate,

            channelId:
              Platform.OS ===
              "android"
                ? JOB_NOTIFICATION_CHANNEL
                : undefined,
          },
        });

    store[
      job.assignmentId
    ] = {
      identifier,
      scheduleKey,
    };
  }

  await writeReminderStore(
    userId,
    store,
  );
}

