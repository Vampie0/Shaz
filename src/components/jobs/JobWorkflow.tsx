import { fontWeight } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { WorkerJob } from "@/types/job";
import { StyleSheet, Text, View } from "react-native";

type Step = {
  key: string;
  label: string;
};

const SERVICE_STEPS: Step[] = [
  { key: "assigned", label: "Assigned" },
  { key: "on_the_way", label: "On the way" },
  { key: "in_progress", label: "In progress" },
  { key: "completed", label: "Completed" },
];

const INSPECTION_STEPS: Step[] = [
  { key: "assigned", label: "Assigned" },
  { key: "inspection_scheduled", label: "Scheduled" },
  { key: "inspection_in_progress", label: "In progress" },
  { key: "report_submitted", label: "Report Submitted" }, // Updated Label
  { key: "completed", label: "Finalised" }, // Updated Label (Admin Approval)
];

function getCurrentIndex(job: WorkerJob, steps: Step[]) {
  const direct = steps.findIndex((step) => step.key === job.status);

  if (direct >= 0) {
    return direct;
  }

  // Finalisation state logic
  if (job.kind === "inspection" && job.status === "completed") {
    return steps.length - 1;
  }

  return 0;
}

export default function JobWorkflow({ job }: { job: WorkerJob }) {
  const theme = useAppTheme();

  const steps = job.kind === "service" ? SERVICE_STEPS : INSPECTION_STEPS;
  const currentIndex = getCurrentIndex(job, steps);

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.heading, { color: theme.textSecondary }]}>
        JOB WORKFLOW
      </Text>

      <View style={styles.track}>
        {steps.map((step, index) => {
          // Logic: Job tab 'done' hogi jab index current se peeche ho
          // YA jab aakhri step ho aur status 'completed' ho.
          const done =
            index < currentIndex ||
            (job.status === "completed" && index === steps.length - 1);

          const current = index === currentIndex && !done;

          return (
            <View key={step.key} style={styles.step}>
              <View style={styles.dotRow}>
                {/* Connector Line Left */}
                {index > 0 ? (
                  <View
                    style={[
                      styles.line,
                      styles.lineLeft,
                      {
                        backgroundColor:
                          index <= currentIndex ? theme.success : theme.border,
                      },
                    ]}
                  />
                ) : null}

                {/* Step Circle */}
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: done
                        ? theme.success
                        : current
                          ? theme.success
                          : theme.surfaceMuted,

                      borderColor: done
                        ? theme.success
                        : current
                          ? theme.success
                          : theme.border,
                    },
                  ]}
                >
                  {done ? (
                    <Text style={[styles.check, { color: theme.surface }]}>
                      ✓
                    </Text>
                  ) : current ? (
                    <View
                      style={[
                        styles.innerDot,
                        { backgroundColor: theme.surface },
                      ]}
                    />
                  ) : null}
                </View>

                {/* Connector Line Right */}
                {index < steps.length - 1 ? (
                  <View
                    style={[
                      styles.line,
                      styles.lineRight,
                      {
                        backgroundColor:
                          index < currentIndex ? theme.success : theme.border,
                      },
                    ]}
                  />
                ) : null}
              </View>

              {/* Step Label */}
              <Text
                numberOfLines={2}
                style={[
                  styles.label,
                  {
                    color: current || done ? theme.text : theme.textMuted,
                    fontWeight: current ? "800" : "600",
                  },
                ]}
              >
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingVertical: 12 },
  heading: {
    marginBottom: 20,
    fontSize: 11,
    fontWeight: fontWeight.bold,
    letterSpacing: 1.2,
  },
  track: { flexDirection: "row", alignItems: "flex-start" },
  step: { flex: 1, alignItems: "center" },
  dotRow: {
    width: "100%",
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    zIndex: 2,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderRadius: 12,
  },
  innerDot: { width: 6, height: 6, borderRadius: 3 },
  check: { fontSize: 14, lineHeight: 18, fontWeight: "900" },
  line: { position: "absolute", top: 13, height: 3, width: "50%" },
  lineLeft: { left: 0 },
  lineRight: { right: 0 },
  label: {
    marginTop: 8,
    maxWidth: 80,
    textAlign: "center",
    fontSize: 10,
    lineHeight: 14,
  },
});
