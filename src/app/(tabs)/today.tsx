import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import InspectorListState from "@/components/inspector/InspectorListState";
import InspectorScreenHeader from "@/components/inspector/InspectorScreenHeader";
import TodayJobRow from "@/components/jobs/TodayJobRow";
import AppLoadingOverlay from "@/components/ui/AppLoadingOverlay";
import AppModal from "@/components/ui/AppModal";
import ScreenContainer from "@/components/ui/ScreenContainer";
import { useAuth } from "@/features/auth/use-auth";
import { getWorkerJobAction } from "@/features/jobs/job.actions";
import {
  getJobBucket,
  getTodayHeading,
  isJobCancelled,
  isTodayJob,
  sortJobsAscending,
} from "@/features/jobs/job.helpers";
import {
  useRunWorkerJobAction,
  useWorkerJobs,
} from "@/features/jobs/use-worker-jobs";
import { toastError } from "@/features/toast/toast-store";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useSingleNavigation } from "@/hooks/use-single-navigation";
import type { WorkerJob } from "@/types/job";

export default function TodayScreen() {
  const theme = useAppTheme();
  const { profile } = useAuth();
  const { navigate, isBlocked } = useSingleNavigation();
  const [actionError, setActionErrorState] = useState<string | null>(null);

  const setActionError = (next: string | null) => {
    setActionErrorState(null);
    if (next) toastError(next, "Job update failed");
  };

  const {
    data = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useWorkerJobs(profile?.id);
  const actionMutation = useRunWorkerJobAction(profile?.id);

  const jobs = useMemo(
    () =>
      sortJobsAscending(
        data.filter((job) => {
          const isTodayDate = isTodayJob(job);
          const isActive =
            job.status === "on_the_way" ||
            job.status === "in_progress" ||
            job.status === "inspection_in_progress";
          const bucket = getJobBucket(job);
          return (
            (isTodayDate || isActive) &&
            !isJobCancelled(job) &&
            bucket !== "completed"
          );
        }),
      ),
    [data],
  );

  const openJob = useCallback(
    (job: WorkerJob) => {
      if (isBlocked) return;
      navigate("/jobs/[id]" as any, { id: job.assignmentId });
    },
    [isBlocked, navigate],
  );

  const runAction = useCallback(
    async (job: WorkerJob) => {
      if (actionMutation.isPending || isBlocked) return;
      setActionError(null);
      try {
        await actionMutation.mutateAsync({ job });
      } catch (error) {
        setActionError(
          error instanceof Error
            ? error.message
            : "The job status could not be updated.",
        );
      }
    },
    [actionMutation, isBlocked],
  );

  const subtitle =
    jobs.length === 1
      ? "1 job · " + getTodayHeading()
      : jobs.length + " jobs · " + getTodayHeading();

  if (isLoading && data.length === 0) {
    return (
      <ScreenContainer>
        <InspectorScreenHeader
          eyebrow="TODAY"
          title="Today's schedule"
          subtitle="Loading..."
        />
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <>
      <ScreenContainer>
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.assignmentId}
          renderItem={({ item }) => {
            const action = getWorkerJobAction(item);
            const isThisPending =
              actionMutation.isPending &&
              actionMutation.variables?.job.assignmentId === item.assignmentId;
            const isInspectionInProgress =
              item.kind === "inspection" &&
              item.status === "inspection_in_progress";
            const actionLabel = isInspectionInProgress
              ? "Continue Inspection"
              : action?.label;
            const handleAction = isInspectionInProgress
              ? () => {
                  if (isBlocked) return;
                  navigate("/inspection/[id]" as any, {
                    id: item.assignmentId,
                  });
                }
              : action
                ? () => {
                    void runAction(item);
                  }
                : undefined;

            return (
              <TodayJobRow
                job={item}
                actionLabel={actionLabel}
                actionLoading={isThisPending}
                onOpen={() => openJob(item)}
                onAction={handleAction}
              />
            );
          }}
          ListHeaderComponent={
            <InspectorScreenHeader
              eyebrow="TODAY"
              title="Today's schedule"
              subtitle={subtitle}
            />
          }
          ListEmptyComponent={
            isError ? (
              <InspectorListState
                title="Couldn't load jobs"
                message="Your assignments could not be loaded."
                onRetry={() => void refetch()}
              />
            ) : (
              <View>
                <InspectorListState
                  title="No jobs assigned for today"
                  message="You have no active mobile services or vehicle inspections scheduled for today. Check the Jobs tab to review upcoming assignments."
                />
                <Pressable
                  disabled={isBlocked}
                  onPress={() => {
                    if (isBlocked) return;
                    navigate("/(tabs)/jobs" as any);
                  }}
                  style={[styles.viewAll, { backgroundColor: theme.primary }]}
                >
                  <Text
                    style={[styles.viewAllText, { color: theme.primaryText }]}
                  >
                    View all jobs
                  </Text>
                </Pressable>
              </View>
            )
          }
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={() => void refetch()}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        />
      </ScreenContainer>

      <AppModal
        visible={Boolean(actionError)}
        title="Job update failed"
        message={actionError ?? undefined}
        onClose={() => setActionError(null)}
      />
      <AppLoadingOverlay
        visible={actionMutation.isPending}
        message="Updating status..."
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 24 },
  viewAll: {
    alignSelf: "center",
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  viewAllText: { fontSize: 12, fontWeight: "700" },
});
