import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import InspectorListState from "@/components/inspector/InspectorListState";
import JobStatusBadge from "@/components/jobs/JobStatusBadge";
import JobTypeBadge from "@/components/jobs/JobTypeBadge";
import JobWorkflow from "@/components/jobs/JobWorkflow";
import AppLoadingOverlay from "@/components/ui/AppLoadingOverlay";
import ScreenContainer from "@/components/ui/ScreenContainer";
import { fontWeight, radius, spacing } from "@/constants/theme";
import { useAuth } from "@/features/auth/use-auth";
import { getWorkerJobAction } from "@/features/jobs/job.actions";
import { formatJobDate, formatJobTime } from "@/features/jobs/job.helpers";
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
import { useSingleNavigation } from "@/hooks/use-single-navigation";
import { fetchInspectionReport } from "@/services/inspection/inspection-report.service";
import { fetchServiceJobReport } from "@/services/service/service-job-report.service";

export default function JobDetailScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();

  const [actionError, setActionErrorState] = useState<string | null>(null);
  const [evidence, setEvidence] = useState({ before: 0, after: 0, total: 0 });
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [hasInitialLoaded, setHasInitialLoaded] = useState(false);
  const { isBlocked, navigate } = useSingleNavigation();
  const setActionError = (next: string | null) => {
    setActionErrorState(null);
    if (next) toastError(next, "Job update failed");
  };

  const {
    data: job,
    isLoading,
    isError,
    refetch,
  } = useWorkerJobDetail(profile?.id, id);

  const actionMutation = useRunWorkerJobAction(profile?.id);

  // Mark first load done
  useEffect(() => {
    if (job && !isLoading && !hasInitialLoaded) {
      setHasInitialLoaded(true);
    }
  }, [job, isLoading, hasInitialLoaded]);

  useEffect(() => {
    async function loadEvidence() {
      if (!job || isLoading) return;
      try {
        setEvidenceLoading(true);
        if (job.kind === "service") {
          const res = await fetchServiceJobReport(job.jobId);
          setEvidence({
            before: res.images.filter((i) => i.stage === "before").length,
            after: res.images.filter((i) => i.stage === "after").length,
            total: res.images.length,
          });
        } else {
          const res = await fetchInspectionReport(job.jobId);
          setEvidence({ before: 0, after: 0, total: res.images.length });
        }
      } catch (err) {
        console.log("Evidence load error:", err);
      } finally {
        setEvidenceLoading(false);
      }
    }
    loadEvidence();
  }, [job, isLoading]);

  // FIXED: First time sirf job loading dikhega, evidence background me load hoga
  const isOverlayLoading = isLoading || actionMutation.isPending;

  const overlayMessage = isLoading
    ? "Loading job details..."
    : actionMutation.isPending
      ? "Updating status..."
      : "Please wait...";

  const action = job ? getWorkerJobAction(job) : null;
  const isSubmitted = job?.status === "report_submitted";
  const isFinalised = job?.status === "completed";
  const isInWorkspace =
    job?.status === "in_progress" || job?.status === "inspection_in_progress";

  const handleAction = async () => {
    if (!job) return;
    if (isBlocked) return;
    if (isSubmitted || isFinalised) {
      const route =
        job.kind === "service" ? "/service/[id]" : "/inspection/[id]";
      navigate(route, { id: job.assignmentId });
      return;
    }
    if (isInWorkspace) {
      const route =
        job.kind === "service" ? "/service/[id]" : "/inspection/[id]";
      navigate(route, { id: job.assignmentId });
      return;
    }
    if (!action || actionMutation.isPending) return;
    try {
      await actionMutation.mutateAsync({ job });
      await refetch();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Status update failed.",
      );
    }
  };

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      {isError ? (
        <ScreenContainer>
          <InspectorListState
            title="Error"
            message="Could not load job details."
            onRetry={() => void refetch()}
          />
        </ScreenContainer>
      ) : job ? (
        <>
          <ScreenContainer contentStyle={styles.noPadding}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[styles.content, { paddingBottom: 160 }]}
            >
              <View style={styles.topBar}>
                <Pressable
                  onPress={() => router.back()}
                  style={styles.backLink}
                >
                  <Ionicons
                    name="chevron-back"
                    size={22}
                    color={theme.primary}
                  />
                  <Text style={[styles.backLabel, { color: theme.primary }]}>
                    Back
                  </Text>
                </Pressable>
                <JobStatusBadge status={job.status} />
              </View>

              <View
                style={[
                  styles.headerCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <JobTypeBadge kind={job.kind} label={job.jobTypeLabel} />
                <Text style={[styles.mainTitle, { color: theme.text }]}>
                  {job.vehicleLabel}
                </Text>
                <View style={styles.headerMeta}>
                  {job.registration ? (
                    <View
                      style={[
                        styles.ukPlate,
                        {
                          backgroundColor: theme.surfaceSecondary,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.plateFlag,
                          { backgroundColor: theme.primary },
                        ]}
                      >
                        <Text
                          style={[styles.ukText, { color: theme.primaryText }]}
                        >
                          UK
                        </Text>
                      </View>
                      <Text style={[styles.regText, { color: theme.text }]}>
                        {job.registration.toUpperCase()}
                      </Text>
                    </View>
                  ) : null}
                  <Text
                    style={[styles.metaText, { color: theme.textSecondary }]}
                  >
                    {job.title}
                  </Text>
                </View>
              </View>

              <JobWorkflow job={job} />

              <View
                style={[
                  styles.card,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.labelSmall, { color: theme.textMuted }]}>
                  JOB EVIDENCE & WORKSPACE
                </Text>
                <View style={styles.evidenceContent}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {evidenceLoading && (
                      <ActivityIndicator size="small" color={theme.textMuted} />
                    )}
                    <Text
                      style={[
                        styles.evidenceInfo,
                        {
                          color: evidenceLoading
                            ? theme.textMuted
                            : theme.textSecondary,
                        },
                      ]}
                    >
                      {evidenceLoading
                        ? "Loading..."
                        : job.kind === "service"
                          ? `Before: ${evidence.before} · After: ${evidence.after}`
                          : `${evidence.total} Inspection photos uploaded`}
                    </Text>
                  </View>
                  <Pressable
                    disabled={actionMutation.isPending || isBlocked}
                    onPress={handleAction}
                  >
                    <Text style={[styles.linkText, { color: theme.primary }]}>
                      {isSubmitted || isFinalised
                        ? "View Evidence →"
                        : "Open Workspace →"}
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.gridRow}>
                <InfoTile
                  icon="time-outline"
                  label="APPOINTMENT TIME"
                  value={formatJobTime(job.scheduledTime)}
                  sub={formatJobDate(job.scheduledDate)}
                />
                <InfoTile
                  icon="person-outline"
                  label="CUSTOMER CONTACT"
                  value={job.customerName || "Customer"}
                  sub={job.customerPhone || "Phone unavailable"}
                  onPress={
                    job.customerPhone
                      ? () => callPhone(job.customerPhone!)
                      : undefined
                  }
                />
              </View>

              <View
                style={[
                  styles.card,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.labelSmall, { color: theme.textMuted }]}>
                  LOCATION & POSTCODE
                </Text>
                <Text style={[styles.address, { color: theme.text }]}>
                  {job.address}
                </Text>
                <Pressable
                  onPress={() => openExternalNavigation(job.address)}
                  style={[
                    styles.navButton,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.surfaceSecondary,
                    },
                  ]}
                >
                  <Ionicons name="navigate" size={18} color={theme.primary} />
                  <Text style={[styles.navText, { color: theme.primary }]}>
                    NAVIGATE (SMART MAPS)
                  </Text>
                </Pressable>
              </View>

              {job.notes && (
                <View
                  style={[
                    styles.notesCard,
                    {
                      borderLeftColor: theme.primary,
                      backgroundColor: theme.dangerSoft,
                    },
                  ]}
                >
                  <Text style={[styles.labelSmall, { color: theme.danger }]}>
                    IMPORTANT NOTES
                  </Text>
                  <Text
                    style={[
                      styles.notesContent,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {job.notes}
                  </Text>
                </View>
              )}
            </ScrollView>
          </ScreenContainer>

          {!isFinalised && (
            <View
              style={[
                styles.footerBar,
                {
                  backgroundColor: theme.surface,
                  borderTopColor: theme.border,
                  paddingBottom: Math.max(insets.bottom, 16),
                },
              ]}
            >
              <Pressable
                disabled={actionMutation.isPending || isBlocked}
                onPress={handleAction}
                style={({ pressed }) => [
                  styles.actionButton,
                  {
                    backgroundColor: isSubmitted
                      ? theme.surfaceSecondary
                      : pressed
                        ? theme.actionPressed
                        : theme.action,
                    borderColor: isSubmitted ? theme.border : "transparent",
                    borderWidth: isSubmitted ? 1 : 0,
                    opacity: pressed ? 0.9 : actionMutation.isPending ? 0.6 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.actionLabel,
                    { color: isSubmitted ? theme.text : theme.actionText },
                  ]}
                >
                  {isSubmitted
                    ? "View Submitted Report"
                    : isInWorkspace
                      ? "Continue Workspace"
                      : action?.label || "Update Status"}
                </Text>
                <Ionicons
                  name={isSubmitted ? "eye-outline" : "arrow-forward"}
                  size={18}
                  color={isSubmitted ? theme.text : theme.actionText}
                />
              </Pressable>
            </View>
          )}
        </>
      ) : null}

      <AppLoadingOverlay visible={isOverlayLoading} message={overlayMessage} />
    </View>
  );
}

function InfoTile({ icon, label, value, sub, onPress }: any) {
  const theme = useAppTheme();
  const isPhone = label === "CUSTOMER CONTACT" && sub !== "Phone unavailable";
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={styles.tileHeader}>
        <Ionicons name={icon} size={14} color={theme.textMuted} />
        <Text style={[styles.labelSmall, { color: theme.textMuted }]}>
          {label}
        </Text>
      </View>
      <Text style={[styles.tileValue, { color: theme.text }]}>{value}</Text>
      <Text
        style={[
          styles.tileSub,
          { color: isPhone ? theme.primary : theme.textSecondary },
        ]}
      >
        {sub}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  noPadding: { paddingHorizontal: 0 },
  content: { padding: spacing.xl, gap: spacing.lg },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: 12,
  },
  backLink: { flexDirection: "row", alignItems: "center", gap: 4 },
  backLabel: { fontSize: 16, fontWeight: fontWeight.bold },
  headerCard: {
    padding: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.sm,
  },
  mainTitle: { fontSize: 26, fontWeight: fontWeight.bold, letterSpacing: -0.6 },
  headerMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  ukPlate: {
    flexDirection: "row",
    borderRadius: 6,
    borderWidth: 1,
    overflow: "hidden",
  },
  plateFlag: { width: 16, justifyContent: "center", alignItems: "center" },
  ukText: { fontSize: 7, fontWeight: "bold" },
  regText: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontWeight: "800",
    fontSize: 15,
  },
  metaText: { fontSize: 13, fontWeight: fontWeight.medium },
  labelSmall: { fontSize: 10, fontWeight: "bold", letterSpacing: 1 },
  evidenceContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  evidenceInfo: { fontSize: 13, fontWeight: "600" },
  linkText: { fontSize: 13, fontWeight: "bold" },
  gridRow: { flexDirection: "row", gap: spacing.md },
  tile: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 4,
  },
  tileHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  tileValue: { fontSize: 16, fontWeight: "bold" },
  tileSub: { fontSize: 12, fontWeight: "bold" },
  card: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 8,
  },
  address: { fontSize: 15, fontWeight: "600", lineHeight: 22 },
  navButton: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    height: 44,
    borderRadius: radius.md,
  },
  navText: { fontSize: 12, fontWeight: "bold" },
  notesCard: {
    padding: spacing.lg,
    borderLeftWidth: 4,
    borderRadius: radius.md,
  },
  notesContent: { fontSize: 14, lineHeight: 21, marginTop: 4 },
  footerBar: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    padding: spacing.xl,
    borderTopWidth: 1,
  },
  actionButton: {
    height: 56,
    borderRadius: radius.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  actionLabel: { fontSize: 16, fontWeight: "bold" },
});
