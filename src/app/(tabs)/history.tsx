import {
  router,
} from "expo-router";
import {
  useCallback,
  useMemo,
} from "react";
import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";

import JobCard from "@/components/jobs/JobCard";
import InspectorListState from "@/components/inspector/InspectorListState";
import InspectorScreenHeader from "@/components/inspector/InspectorScreenHeader";
import ScreenContainer from "@/components/ui/ScreenContainer";
import {
  getJobBucket,
  sortJobsDescending,
} from "@/features/jobs/job.helpers";
import { useWorkerJobs } from "@/features/jobs/use-worker-jobs";
import { useAuth } from "@/features/auth/use-auth";
import { useAppTheme } from "@/hooks/use-app-theme";
import type {
  WorkerJob,
} from "@/types/job";

export default function HistoryScreen() {
  const theme = useAppTheme();
  const { profile } = useAuth();

  const {
    data = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useWorkerJobs(
    profile?.id,
  );

  const jobs = useMemo(
    () =>
      sortJobsDescending(
        data.filter(
          (job) =>
            getJobBucket(job) ===
            "completed",
        ),
      ),
    [data],
  );

  const openJob = useCallback(
    (job: WorkerJob) => {
      router.push({
        pathname: "/jobs/[id]",
        params: {
          id: job.assignmentId,
        },
      });
    },
    [],
  );

  return (
    <ScreenContainer>
      <FlatList
        data={jobs}
        keyExtractor={(item) =>
          item.assignmentId
        }
        renderItem={({ item }) => (
          <JobCard
            job={item}
            showDate
            onPress={() =>
              openJob(item)
            }
          />
        )}
        ItemSeparatorComponent={() => (
          <View
            style={[
              styles.separator,
              {
                backgroundColor:
                  theme.border,
              },
            ]}
          />
        )}
        ListHeaderComponent={
          <InspectorScreenHeader
            eyebrow="HISTORY"
            title="Completed work"
            subtitle="Your finished service and inspection jobs."
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <InspectorListState
              loading
              title="Loading history"
              message="Getting your completed jobs."
            />
          ) : isError ? (
            <InspectorListState
              title="Couldn't load history"
              message="Completed jobs could not be loaded right now."
              onRetry={() => {
                void refetch();
              }}
            />
          ) : (
            <InspectorListState
              title="No completed jobs"
              message="Completed service and inspection jobs will appear here."
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
          Platform.OS === "android"
        }
      />
    </ScreenContainer>
  );
}

const styles =
  StyleSheet.create({
    content: {
      flexGrow: 1,
      paddingBottom: 24,
    },

    separator: {
      height: StyleSheet.hairlineWidth,
    },
  });

