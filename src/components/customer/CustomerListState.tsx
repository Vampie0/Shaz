import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";

import AppButton from "@/components/ui/AppButton";
import EmptyState from "@/components/ui/EmptyState";
import {
  fontSize,
  fontWeight,
  spacing,
} from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

type CustomerListStateProps = {
  loading?: boolean;
  error?: boolean;
  empty?: boolean;
  emptyTitle: string;
  emptyMessage: string;
  onRetry?: () => void;
};

export default function CustomerListState({
  loading = false,
  error = false,
  empty = false,
  emptyTitle,
  emptyMessage,
  onRetry,
}: CustomerListStateProps) {
  const theme = useAppTheme();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="small"
          color={theme.primary}
        />

        <Text
          style={[
            styles.message,
            {
              color:
                theme.textSecondary,
            },
          ]}
        >
          Loading…
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.error}>
        <Text
          style={[
            styles.errorTitle,
            {
              color: theme.text,
            },
          ]}
        >
          Couldn&apos;t load this section
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
          Check your connection and try again.
        </Text>

        {onRetry ? (
          <AppButton
            title="Retry"
            variant="secondary"
            onPress={onRetry}
          />
        ) : null}
      </View>
    );
  }

  if (empty) {
    return (
      <EmptyState
        title={emptyTitle}
        message={emptyMessage}
      />
    );
  }

  return null;
}

const styles = StyleSheet.create({
  center: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },

  error: {
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },

  errorTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },

  message: {
    fontSize: fontSize.sm,
    lineHeight: 21,
    textAlign: "center",
  },
});

