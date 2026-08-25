import {
  router,
  useLocalSearchParams,
} from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import JobStatusBadge from "@/components/jobs/JobStatusBadge";
import JobTypeBadge from "@/components/jobs/JobTypeBadge";
import JobWorkflow from "@/components/jobs/JobWorkflow";
import InspectorListState from "@/components/inspector/InspectorListState";
import AppModal from "@/components/ui/AppModal";
import ScreenContainer from "@/components/ui/ScreenContainer";
import {
  fontWeight,
} from "@/constants/theme";
import { useAuth } from "@/features/auth/use-auth";
import {
  getWorkerJobAction,
} from "@/features/jobs/job.actions";
import {
  formatJobDate,
  formatJobTime,
} from "@/features/jobs/job.helpers";
import {
  useRunWorkerJobAction,
  useWorkerJobDetail,
} from "@/features/jobs/use-worker-jobs";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
  callPhone,
  openExternalNavigation,
} from "@/services/location/navigation";

import { toastError } from "@/features/toast/toast-store";
export default function JobDetailScreen() {
  const theme = useAppTheme();
  const insets =
    useSafeAreaInsets();

  const {
    id,
  } =
    useLocalSearchParams<{
      id: string;
    }>();

  const { profile } = useAuth();

  const [
    actionError,
    setActionErrorState,
  ] =
    useState<string | null>(
      null,
    );

  const setActionError = (
    next: string | null,
  ) => {
    setActionErrorState(null);

    if (next) {
      toastError(
        next,
        "Job update failed",
      );
    }
  };

  const {
    data: job,
    isLoading,
    isError,
    refetch,
  } = useWorkerJobDetail(
    profile?.id,
    id,
  );

  const actionMutation =
    useRunWorkerJobAction(
      profile?.id,
    );

  if (isLoading) {
    return (
      <ScreenContainer>
        <InspectorListState
          loading
          title="Loading job"
          message="Getting the latest job details."
        />
      </ScreenContainer>
    );
  }

  if (
    isError ||
    !job
  ) {
    return (
      <ScreenContainer>
        <InspectorListState
          title="Couldn't load job"
          message="This assignment could not be loaded."
          onRetry={() => {
            void refetch();
          }}
        />
      </ScreenContainer>
    );
  }

  const action =
    getWorkerJobAction(job);

  const runAction =
    async () => {
      if (
        !action ||
        actionMutation.isPending
      ) {
        return;
      }

      setActionError(null);

      try {
        await actionMutation.mutateAsync({
          job,
        });

        await refetch();
      } catch (error) {
        setActionError(
          error instanceof Error
            ? error.message
            : "The job status could not be updated.",
        );
      }
    };

  const appointment =
    formatJobDate(
      job.scheduledDate,
    ) +
    " · " +
    formatJobTime(
      job.scheduledTime,
    );

  return (
    <>
      <ScreenContainer>
        <View style={styles.screen}>
          <ScrollView
            contentContainerStyle={[
              styles.content,
              {
                paddingBottom:
                  122 +
                  Math.max(
                    insets.bottom,
                    8,
                  ),
              },
            ]}
            showsVerticalScrollIndicator={
              false
            }
          >
            <View style={styles.topBar}>
              <Pressable
                hitSlop={12}
                onPress={() =>
                  router.back()
                }
                style={({ pressed }) => [
                  styles.backButton,
                  pressed && {
                    opacity: 0.55,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.backText,
                    {
                      color:
                        theme.primary,
                    },
                  ]}
                >
                  ‹ Back
                </Text>
              </Pressable>

              <JobStatusBadge
                status={job.status}
              />
            </View>

            <View style={styles.heading}>
              <JobTypeBadge
                kind={job.kind}
              />

              <Text
                style={[
                  styles.title,
                  {
                    color: theme.text,
                  },
                ]}
              >
                {job.vehicleLabel}
              </Text>

              <View
                style={
                  styles.registrationRow
                }
              >
                {job.registration ? (
                  <Text
                    style={[
                      styles.registration,
                      {
                        color:
                          theme.text,
                      },
                    ]}
                  >
                    {job.registration.toUpperCase()}
                  </Text>
                ) : null}

                <Text
                  style={[
                    styles.jobKind,
                    {
                      color:
                        theme.textSecondary,
                    },
                  ]}
                >
                  {job.kind ===
                  "service"
                    ? "Mobile service"
                    : "Vehicle inspection"}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.sectionDivider,
                {
                  backgroundColor:
                    theme.border,
                },
              ]}
            />

            <JobWorkflow
              job={job}
            />

            <View
              style={[
                styles.sectionDivider,
                {
                  backgroundColor:
                    theme.border,
                },
              ]}
            />

            <View style={styles.grid}>
              <InfoBlock
                eyebrow="APPOINTMENT"
                value={appointment}
                secondary={
                  job.scheduledDate ??
                  undefined
                }
              />

              <InfoBlock
                eyebrow="CUSTOMER"
                value={
                  job.customerName ||
                  "Not available"
                }
                secondary={
                  job.customerPhone ??
                  undefined
                }
                secondaryPress={
                  job.customerPhone
                    ? () => {
                        void callPhone(
                          job.customerPhone as string,
                        );
                      }
                    : undefined
                }
              />
            </View>

            <View
              style={[
                styles.sectionDivider,
                {
                  backgroundColor:
                    theme.border,
                },
              ]}
            />

            <View style={styles.locationSection}>
              <Text
                style={[
                  styles.sectionEyebrow,
                  {
                    color:
                      theme.textMuted,
                  },
                ]}
              >
                LOCATION & POSTCODE
              </Text>

              <Text
                selectable
                style={[
                  styles.location,
                  {
                    color: theme.text,
                  },
                ]}
              >
                {job.address ||
                  "Location not available"}
              </Text>

              <View style={styles.locationActions}>
                {job.address ? (
                  <Pressable
                    onPress={() => {
                      void openExternalNavigation(
                        job.address,
                      );
                    }}
                    style={({ pressed }) => [
                      styles.textAction,
                      pressed && {
                        opacity: 0.55,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.textActionLabel,
                        {
                          color:
                            theme.primary,
                        },
                      ]}
                    >
                      Open navigation
                    </Text>
                  </Pressable>
                ) : null}

                {job.customerPhone ? (
                  <Pressable
                    onPress={() => {
                      void callPhone(
                        job.customerPhone as string,
                      );
                    }}
                    style={({ pressed }) => [
                      styles.textAction,
                      pressed && {
                        opacity: 0.55,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.textActionLabel,
                        {
                          color:
                            theme.primary,
                        },
                      ]}
                    >
                      Call customer
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </View>

            <View
              style={[
                styles.sectionDivider,
                {
                  backgroundColor:
                    theme.border,
                },
              ]}
            />

            <View style={styles.notesSection}>
              <Text
                style={[
                  styles.sectionEyebrow,
                  {
                    color:
                      theme.textMuted,
                  },
                ]}
              >
                JOB WORKSPACE
              </Text>

              <Text
                style={[
                  styles.notes,
                  {
                    color:
                      theme.textSecondary,
                  },
                ]}
              >
                {job.kind === "service"
                  ? "Open the service workspace to manage the field workflow."
                  : "Open the inspection workspace to complete the vehicle inspection."}
              </Text>

              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  if (
                    job.kind ===
                    "service"
                  ) {
                    router.push({
                      pathname:
                        "/service/[id]",
                      params: {
                        id:
                          job.assignmentId,
                      },
                    });

                    return;
                  }

                  router.push({
                    pathname:
                      "/inspection/[id]",
                    params: {
                      id:
                        job.assignmentId,
                    },
                  });
                }}
                style={({ pressed }) => [
                  styles.textAction,
                  {
                    marginTop: 8,
                    alignSelf:
                      "flex-start",
                  },
                  pressed && {
                    opacity: 0.55,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.textActionLabel,
                    {
                      color:
                        theme.primary,
                    },
                  ]}
                >
                  {job.kind === "service"
                    ? "Open service workspace →"
                    : "Open inspection workspace →"}
                </Text>
              </Pressable>
            </View>


            {job.notes ? (
              <>
                <View
                  style={[
                    styles.sectionDivider,
                    {
                      backgroundColor:
                        theme.border,
                    },
                  ]}
                />

                <View style={styles.notesSection}>
                  <Text
                    style={[
                      styles.sectionEyebrow,
                      {
                        color:
                          theme.textMuted,
                      },
                    ]}
                  >
                    NOTES
                  </Text>

                  <Text
                    style={[
                      styles.notes,
                      {
                        color:
                          theme.textSecondary,
                      },
                    ]}
                  >
                    {job.notes}
                  </Text>
                </View>
              </>
            ) : null}
          </ScrollView>

          {action ? (
            <View
              pointerEvents="box-none"
              style={[
                styles.footer,
                {
                  paddingBottom:
                    Math.max(
                      insets.bottom,
                      10,
                    ),
                  backgroundColor:
                    theme.background,
                  borderTopColor:
                    theme.border,
                },
              ]}
            >
              <Pressable
                accessibilityRole="button"
                disabled={
                  actionMutation.isPending
                }
                onPress={() => {
                  void runAction();
                }}
                style={({ pressed }) => [
                  styles.primaryButton,
                  {
                    backgroundColor:
                      theme.action,
                  },
                  pressed &&
                    !actionMutation.isPending && {
                      opacity: 0.8,
                    },
                  actionMutation.isPending && {
                    opacity: 0.6,
                  },
                ]}
              >
                {actionMutation.isPending ? (
                  <ActivityIndicator
                    size="small"
                    color={theme.actionText}
                  />
                ) : (
                  <Text style={[styles.primaryButtonText, { color: theme.actionText }]}>
                    {action.label}
                  </Text>
                )}
              </Pressable>
            </View>
          ) : null}
        </View>
      </ScreenContainer>

      <AppModal
        visible={Boolean(
          actionError,
        )}
        title="Job update failed"
        message={
          actionError ??
          undefined
        }
        onClose={() =>
          setActionError(null)
        }
      />
    </>
  );
}

function InfoBlock({
  eyebrow,
  value,
  secondary,
  secondaryPress,
}: {
  eyebrow: string;
  value: string;
  secondary?: string;
  secondaryPress?: () => void;
}) {
  const theme = useAppTheme();

  return (
    <View style={styles.infoBlock}>
      <Text
        style={[
          styles.sectionEyebrow,
          {
            color: theme.textMuted,
          },
        ]}
      >
        {eyebrow}
      </Text>

      <Text
        selectable
        style={[
          styles.infoValue,
          {
            color: theme.text,
          },
        ]}
      >
        {value}
      </Text>

      {secondary ? (
        secondaryPress ? (
          <Pressable
            onPress={
              secondaryPress
            }
            style={({ pressed }) => [
              styles.secondaryPress,
              pressed && {
                opacity: 0.55,
              },
            ]}
          >
            <Text
              style={[
                styles.infoSecondary,
                {
                  color:
                    theme.primary,
                },
              ]}
            >
              {secondary}
            </Text>
          </Pressable>
        ) : (
          <Text
            style={[
              styles.infoSecondary,
              {
                color:
                  theme.textSecondary,
              },
            ]}
          >
            {secondary}
          </Text>
        )
      ) : null}
    </View>
  );
}

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
    },

    content: {
      paddingTop: 16,
    },

    topBar: {
      minHeight: 42,

      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",

      gap: 16,
    },

    backButton: {
      minHeight: 36,

      justifyContent: "center",
    },

    backText: {
      fontSize: 14,
      lineHeight: 20,

      fontWeight:
        fontWeight.bold,
    },

    heading: {
      paddingTop: 22,
      paddingBottom: 24,
    },

    title: {
      marginTop: 13,

      fontSize: 31,
      lineHeight: 36,

      fontWeight:
        fontWeight.bold,

      letterSpacing: -0.85,
    },

    registrationRow: {
      marginTop: 9,

      flexDirection: "row",
      alignItems: "center",

      gap: 12,
    },

    registration: {
      fontSize: 12,
      lineHeight: 17,

      fontWeight:
        fontWeight.bold,

      letterSpacing: 0.75,
    },

    jobKind: {
      fontSize: 13,
      lineHeight: 18,

      fontWeight:
        fontWeight.medium,
    },

    sectionDivider: {
      height:
        StyleSheet.hairlineWidth,
    },

    grid: {
      flexDirection: "row",

      gap: 20,

      paddingVertical: 24,
    },

    infoBlock: {
      flex: 1,
      minWidth: 0,
    },

    sectionEyebrow: {
      fontSize: 10,
      lineHeight: 14,

      fontWeight:
        fontWeight.bold,

      letterSpacing: 0.95,
    },

    infoValue: {
      marginTop: 8,

      fontSize: 15,
      lineHeight: 21,

      fontWeight:
        fontWeight.bold,
    },

    infoSecondary: {
      marginTop: 5,

      fontSize: 12,
      lineHeight: 17,

      fontWeight:
        fontWeight.medium,
    },

    secondaryPress: {
      alignSelf:
        "flex-start",
    },

    locationSection: {
      paddingVertical: 24,
    },

    location: {
      marginTop: 9,

      fontSize: 16,
      lineHeight: 23,

      fontWeight:
        fontWeight.semibold,
    },

    locationActions: {
      marginTop: 12,

      flexDirection: "row",
      flexWrap: "wrap",

      gap: 20,
    },

    textAction: {
      minHeight: 34,

      justifyContent: "center",
    },

    textActionLabel: {
      fontSize: 13,
      lineHeight: 18,

      fontWeight:
        fontWeight.bold,
    },

    notesSection: {
      paddingVertical: 24,
    },

    notes: {
      marginTop: 9,

      fontSize: 14,
      lineHeight: 21,
    },

    footer: {
      position: "absolute",

      left: 0,
      right: 0,
      bottom: 0,

      paddingTop: 12,
      paddingHorizontal: 0,

      borderTopWidth:
        StyleSheet.hairlineWidth,
    },

    primaryButton: {
      minHeight: 52,

      alignItems: "center",
      justifyContent: "center",

      borderRadius: 12,
    },

    primaryButtonText: {
      fontSize: 14,
      lineHeight: 19,

      fontWeight:
        fontWeight.bold,

      letterSpacing: 0.1,
    },
  });

