import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  fontWeight,
} from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import type {
  WorkerJob,
} from "@/types/job";

type Step = {
  key: string;
  label: string;
};

const SERVICE_STEPS: Step[] = [
  {
    key: "assigned",
    label: "Assigned",
  },
  {
    key: "on_the_way",
    label: "On the way",
  },
  {
    key: "in_progress",
    label: "In progress",
  },
  {
    key: "completed",
    label: "Completed",
  },
];

const INSPECTION_STEPS: Step[] = [
  {
    key: "assigned",
    label: "Assigned",
  },
  {
    key: "inspection_scheduled",
    label: "Scheduled",
  },
  {
    key: "inspection_in_progress",
    label: "In progress",
  },
  {
    key: "report_submitted",
    label: "Submitted",
  },
  {
    key: "completed",
    label: "Completed",
  },
];

function getCurrentIndex(
  job: WorkerJob,
  steps: Step[],
) {
  const direct = steps.findIndex(
    (step) =>
      step.key === job.status,
  );

  if (direct >= 0) {
    return direct;
  }

  if (
    job.kind === "inspection" &&
    job.status === "completed"
  ) {
    return steps.length - 1;
  }

  return 0;
}

export default function JobWorkflow({
  job,
}: {
  job: WorkerJob;
}) {
  const theme = useAppTheme();

  const steps =
    job.kind === "service"
      ? SERVICE_STEPS
      : INSPECTION_STEPS;

  const currentIndex =
    getCurrentIndex(
      job,
      steps,
    );

  return (
    <View style={styles.wrapper}>
      <Text
        style={[
          styles.heading,
          {
            color:
              theme.textSecondary,
          },
        ]}
      >
        JOB WORKFLOW
      </Text>

      <View style={styles.track}>
        {steps.map(
          (step, index) => {
            const done =
              index < currentIndex ||
              (
                job.status ===
                  "completed" &&
                index ===
                  currentIndex
              );

            const current =
              index === currentIndex &&
              !done;

            return (
              <View
                key={step.key}
                style={styles.step}
              >
                <View
                  style={styles.dotRow}
                >
                  {index > 0 ? (
                    <View
                      style={[
                        styles.line,
                        styles.lineLeft,
                        {
                          backgroundColor:
                            index <=
                            currentIndex
                              ? theme.success
                              : theme.border,
                        },
                      ]}
                    />
                  ) : null}

                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor:
                          done
                            ? theme.success
                            : current
                              ? theme.text
                              : theme.surfaceMuted,

                        borderColor:
                          done
                            ? theme.success
                            : current
                              ? theme.text
                              : theme.border,
                      },
                    ]}
                  >
                    {done ? (
                      <Text
                        style={[
                          styles.check,
                          {
                            color: theme.background,
                          },
                        ]}
                      >
                        ✓
                      </Text>
                    ) : null}
                  </View>

                  {index <
                  steps.length - 1 ? (
                    <View
                      style={[
                        styles.line,
                        styles.lineRight,
                        {
                          backgroundColor:
                            index <
                            currentIndex
                              ? theme.success
                              : theme.border,
                        },
                      ]}
                    />
                  ) : null}
                </View>

                <Text
                  numberOfLines={2}
                  style={[
                    styles.label,
                    {
                      color:
                        current || done
                          ? theme.text
                          : theme.textMuted,
                    },
                  ]}
                >
                  {step.label}
                </Text>
              </View>
            );
          },
        )}
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    wrapper: {
      paddingTop: 8,
      paddingBottom: 24,
    },

    heading: {
      marginBottom: 18,

      fontSize: 11,
      lineHeight: 15,

      fontWeight:
        fontWeight.bold,

      letterSpacing: 1.25,
    },

    track: {
      flexDirection: "row",
      alignItems: "flex-start",
    },

    step: {
      flex: 1,
      minWidth: 0,

      alignItems: "center",
    },

    dotRow: {
      width: "100%",
      height: 28,

      alignItems: "center",
      justifyContent: "center",
    },

    dot: {
      zIndex: 2,

      width: 22,
      height: 22,

      alignItems: "center",
      justifyContent: "center",

      borderWidth: 1,
      borderRadius: 11,
    },

    check: {
      fontSize: 13,
      lineHeight: 16,

      fontWeight:
        fontWeight.bold,
    },

    line: {
      position: "absolute",

      top: 13,

      height: 2,
      width: "50%",
    },

    lineLeft: {
      left: 0,
    },

    lineRight: {
      right: 0,
    },

    label: {
      marginTop: 7,

      maxWidth: 76,

      textAlign: "center",

      fontSize: 10,
      lineHeight: 14,

      fontWeight:
        fontWeight.semibold,
    },
  });

