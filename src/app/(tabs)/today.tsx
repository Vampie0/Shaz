import {
  router,
} from "expo-router";
import {
  useCallback,
  useMemo,
  useState,
} from "react";
import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";

import TodayJobRow from "@/components/jobs/TodayJobRow";
import InspectorListState from "@/components/inspector/InspectorListState";
import InspectorScreenHeader from "@/components/inspector/InspectorScreenHeader";
import AppModal from "@/components/ui/AppModal";
import ScreenContainer from "@/components/ui/ScreenContainer";
import { useAuth } from "@/features/auth/use-auth";
import {
  getWorkerJobAction,
} from "@/features/jobs/job.actions";
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
import { useAppTheme } from "@/hooks/use-app-theme";
import type {
  WorkerJob,
} from "@/types/job";

import { toastError } from "@/features/toast/toast-store";
export default function TodayScreen() {
  const theme = useAppTheme();
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
    data = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useWorkerJobs(
    profile?.id,
  );

  const actionMutation =
    useRunWorkerJobAction(
      profile?.id,
    );

  const jobs = useMemo(
    () =>
      sortJobsAscending(
        data.filter(
          (job) =>
            isTodayJob(job) &&
            !isJobCancelled(job) &&
            getJobBucket(job) !== "completed" &&
            getJobBucket(job) !== "completed",
        ),
      ),
    [data],
  );

  const openJob = useCallback(
    (job: WorkerJob) => {
      router.push({
        pathname:
          "/jobs/[id]",
        params: {
          id: job.assignmentId,
        },
      });
    },
    [],
  );

  const runAction =
    useCallback(
      async (
        job: WorkerJob,
      ) => {
        if (
          actionMutation.isPending
        ) {
          return;
        }

        setActionError(null);

        try {
          await actionMutation.mutateAsync({
            job,
          });
        } catch (error) {
          setActionError(
            error instanceof Error
              ? error.message
              : "The job status could not be updated.",
          );
        }
      },
      [actionMutation],
    );

  const subtitle =
    jobs.length === 1
      ? "1 job · " +
        getTodayHeading()
      : jobs.length +
        " jobs · " +
        getTodayHeading();

  if (
    isLoading &&
    data.length === 0
  ) {
    return (
      <ScreenContainer>
        <InspectorScreenHeader
          eyebrow="TODAY"
          title="Today's schedule"
          subtitle={getTodayHeading()}
        />

        <InspectorListState
          loading
          title="Loading assignments"
          message="Getting your latest field jobs."
        />
      </ScreenContainer>
    );
  }

  return (
    <>
      <ScreenContainer>
        <FlatList
          data={jobs}
          keyExtractor={(item) =>
            item.assignmentId
          }
          renderItem={({ item }) => {
            const action =
              getWorkerJobAction(
                item,
              );

            const isThisPending =
              actionMutation.isPending &&
              actionMutation.variables
                ?.job.assignmentId ===
                item.assignmentId;

            return (
              <TodayJobRow
                job={item}
                actionLabel={
                  action?.label
                }
                actionLoading={
                  isThisPending
                }
                onOpen={() =>
                  openJob(item)
                }
                onAction={
                  action
                    ? () => {
                        void runAction(
                          item,
                        );
                      }
                    : undefined
                }
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
                message="Your assignments could not be loaded right now."
                onRetry={() => {
                  void refetch();
                }}
              />
            ) : (
              <InspectorListState
                title="No jobs today"
                message="You have no service or inspection assignments scheduled for today."
              />
            )
          }
          refreshControl={
            <RefreshControl
              refreshing={
                isFetching &&
                !isLoading
              }
              onRefresh={() => {
                void refetch();
              }}
              tintColor={
                theme.primary
              }
              colors={[
                theme.primary,
              ]}
            />
          }
          contentContainerStyle={
            styles.content
          }
          showsVerticalScrollIndicator={
            false
          }
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews={
            Platform.OS ===
            "android"
          }
        />
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

const styles =
  StyleSheet.create({
    content: {
      flexGrow: 1,

      /*
       * Floating bottom tabs overlay the scene.
       * Keep the final job fully scrollable above them.
       */
      paddingBottom: 24,
    },
  });

