import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import {
  Platform,
} from "react-native";

import {
  prepareInspectorNotifications,
} from "@/features/notifications/notification.service";
import {
  supabase,
} from "@/services/supabase/client";

const TOKEN_STORAGE_KEY =
  "@fengxing/expo-push-token";

function getEasProjectId() {
  const easConfig =
    (
      Constants as unknown as {
        easConfig?: {
          projectId?: string;
        };
      }
    ).easConfig;

  const configProjectId =
    (
      Constants.expoConfig
        ?.extra as
        | {
            eas?: {
              projectId?: string;
            };
          }
        | undefined
    )?.eas?.projectId;

  return (
    easConfig?.projectId ??
    configProjectId ??
    null
  );
}

export async function registerThisDevicePushToken() {
  if (
    Platform.OS !== "android" &&
    Platform.OS !== "ios"
  ) {
    return null;
  }

  const allowed =
    await prepareInspectorNotifications();

  if (!allowed) {
    return null;
  }

  const projectId = getEasProjectId();

  // Gracefully skip push token registration in local dev if EAS projectId is not configured
  if (!projectId) {
    return null;
  }

  const tokenResult =
    await Notifications
      .getExpoPushTokenAsync({
        projectId,
      });

  const token =
    tokenResult.data;

  if (!token) {
    throw new Error(
      "Expo Push Token could not be created.",
    );
  }

  const {
    error,
  } =
    await supabase.rpc(
      "register_push_token",
      {
        p_token:
          token,
        p_platform:
          Platform.OS,
        p_device_id:
          null,
      },
    );

  if (error) {
    throw error;
  }

  await AsyncStorage.setItem(
    TOKEN_STORAGE_KEY,
    token,
  );

  return token;
}

export async function unregisterThisDevicePushToken() {
  const token =
    await AsyncStorage.getItem(
      TOKEN_STORAGE_KEY,
    );

  if (!token) {
    return;
  }

  try {
    const {
      error,
    } =
      await supabase.rpc(
        "unregister_push_token",
        {
          p_token:
            token,
        },
      );

    if (error) {
      throw error;
    }
  } finally {
    await AsyncStorage.removeItem(
      TOKEN_STORAGE_KEY,
    );
  }
}

