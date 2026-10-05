import InspectorListState from "@/components/inspector/InspectorListState";
import InspectorScreenHeader from "@/components/inspector/InspectorScreenHeader";
import JobCard from "@/components/jobs/JobCard";
import ScreenContainer from "@/components/ui/ScreenContainer";
import { useAuth } from "@/features/auth/use-auth";
import {
  getJobBucket,
  isJobCancelled,
  sortJobsDescending,
} from "@/features/jobs/job.helpers";
import { useWorkerJobs } from "@/features/jobs/use-worker-jobs";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useSingleNavigation } from "@/hooks/use-single-navigation";
import type { WorkerJob } from "@/types/job";
import { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function HistoryScreen() {
  const theme = useAppTheme();
  const { profile } = useAuth();
  const { navigate, isBlocked } = useSingleNavigation();

  const {
    data = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useWorkerJobs(profile?.id);

  const jobs = useMemo(() => {
    return sortJobsDescending(
      data.filter((job) => {
        const bucket = getJobBucket(job);
        return bucket === "completed" || isJobCancelled(job);
      }),
    );
  }, [data]);

  const openJob = useCallback(
    (job: WorkerJob) => {
      if (isBlocked) return;
      navigate("/jobs/[id]" as any, { id: job.assignmentId });
    },
    [isBlocked, navigate],
  );

  // FIX: FullScreenLoader replaced with ActivityIndicator
  if (isLoading && data.length === 0) {
    return (
      <ScreenContainer>
        <InspectorScreenHeader
          eyebrow="HISTORY"
          title="Completed Jobs"
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
    <ScreenContainer>
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.assignmentId}
        renderItem={({ item }) => (
          <JobCard job={item} showDate onPress={() => openJob(item)} />
        )}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: theme.border }]} />
        )}
        ListHeaderComponent={
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <InspectorScreenHeader
                eyebrow="HISTORY"
                title="Completed & Past Jobs"
                subtitle="History of finished operations."
              />
            </View>
            {jobs.length > 0 && (
              <View
                style={[
                  styles.countBadge,
                  { backgroundColor: theme.successSoft },
                ]}
              >
                <Text style={[styles.countText, { color: theme.success }]}>
                  {jobs.length} Completed
                </Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <InspectorListState
            title="No past jobs"
            message="Your finished work will appear here."
          />
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
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 24 },
  separator: { height: StyleSheet.hairlineWidth },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingTop: 12,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 18,
  },
  countText: { fontSize: 11, fontWeight: "bold" },
});
