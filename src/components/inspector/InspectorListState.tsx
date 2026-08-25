import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  fontWeight,
} from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

type Props = {
  loading?: boolean;
  title: string;
  message: string;
  onRetry?: () => void;
};

export default function InspectorListState({
  loading = false,
  title,
  message,
  onRetry,
}: Props) {
  const theme = useAppTheme();

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={theme.primary}
        />
      ) : null}

      <Text
        style={[
          styles.title,
          {
            color: theme.text,
          },
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          styles.message,
          {
            color:
              theme.textSecondary,
          },
        ]}
      >
        {message}
      </Text>

      {onRetry ? (
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => [
            styles.retry,
            {
              borderColor:
                theme.border,
            },
            pressed && {
              opacity: 0.55,
            },
          ]}
        >
          <Text
            style={[
              styles.retryText,
              {
                color:
                  theme.primary,
              },
            ]}
          >
            Try again
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      paddingVertical: 52,
      paddingHorizontal: 18,

      alignItems: "center",
    },

    title: {
      marginTop: 12,

      textAlign: "center",

      fontSize: 17,
      lineHeight: 22,

      fontWeight:
        fontWeight.bold,
    },

    message: {
      marginTop: 7,

      maxWidth: 300,

      textAlign: "center",

      fontSize: 13,
      lineHeight: 20,
    },

    retry: {
      marginTop: 18,

      minHeight: 40,

      paddingHorizontal: 18,

      alignItems: "center",
      justifyContent: "center",

      borderWidth: 1,
      borderRadius: 999,
    },

    retryText: {
      fontSize: 13,
      fontWeight:
        fontWeight.bold,
    },
  });

