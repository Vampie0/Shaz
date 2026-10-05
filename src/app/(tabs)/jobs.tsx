import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import InspectorListState from "@/components/inspector/InspectorListState";
import InspectorScreenHeader from "@/components/inspector/InspectorScreenHeader";
import JobCard from "@/components/jobs/JobCard";
import ScreenContainer from "@/components/ui/ScreenContainer";
import { useAuth } from "@/features/auth/use-auth";
import {
  getJobBucket,
  isJobCancelled,
  sortJobsAscending,
  sortJobsDescending,
} from "@/features/jobs/job.helpers";
import { useWorkerJobs } from "@/features/jobs/use-worker-jobs";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useSingleNavigation } from "@/hooks/use-single-navigation";
import type { WorkerJob } from "@/types/job";

type JobFilter = "all" | "service" | "inspection" | "upcoming" | "completed";

const FILTERS: Array<{ id: JobFilter; label: string }> = [
  { id: "all", label: "All Jobs" },
  { id: "service", label: "Service" },
  { id: "inspection", label: "Inspection" },
  { id: "upcoming", label: "Upcoming" },
  { id: "completed", label: "Completed" },
];

export default function JobsScreen() {
  const theme = useAppTheme();
  const { profile } = useAuth();
  const { navigate, isBlocked } = useSingleNavigation();
  const [selectedFilter, setSelectedFilter] = useState<JobFilter>("all");
  const [search, setSearch] = useState("");

  const {
    data = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useWorkerJobs(profile?.id);

  const jobs = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const filtered = data.filter((job) => {
      if (isJobCancelled(job)) return false;
      const bucket = getJobBucket(job);
      if (selectedFilter === "service" && job.kind !== "service") return false;
      if (selectedFilter === "inspection" && job.kind !== "inspection")
        return false;
      if (selectedFilter === "upcoming" && bucket !== "upcoming") return false;
      if (selectedFilter === "completed" && bucket !== "completed")
        return false;
      if (!needle) return true;
      const searchableText = [
        job.vehicleLabel,
        job.registration,
        job.title,
        job.jobTypeLabel,
        job.address,
        job.customerName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return searchableText.includes(needle);
    });
    return selectedFilter === "completed"
      ? sortJobsDescending(filtered)
      : sortJobsAscending(filtered);
  }, [data, selectedFilter, search]);

  const hasActiveFilters = selectedFilter !== "all" || search.trim().length > 0;

  const resetFilters = () => {
    setSelectedFilter("all");
    setSearch("");
  };

  const openJob = useCallback(
    (job: WorkerJob) => {
      if (isBlocked) return;
      navigate("/jobs/[id]" as any, { id: job.assignmentId });
    },
    [isBlocked, navigate],
  );

  if (isLoading && data.length === 0) {
    return (
      <ScreenContainer>
        <InspectorScreenHeader title="All jobs" subtitle="Loading..." />
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
          <View>
            <InspectorScreenHeader
              eyebrow="ASSIGNMENTS"
              title="All jobs"
              subtitle="Search your workload."
            />
            <View
              style={[
                styles.controls,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search registration, vehicle, location, customer..."
                placeholderTextColor={theme.textMuted}
                selectionColor={theme.primary}
                style={[
                  styles.search,
                  {
                    color: theme.text,
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                  },
                ]}
              />
              <View style={styles.chips}>
                {FILTERS.map((chip) => {
                  const active = selectedFilter === chip.id;
                  return (
                    <Pressable
                      key={chip.id}
                      disabled={isBlocked}
                      onPress={() => {
                        if (isBlocked) return;
                        setSelectedFilter(chip.id);
                      }}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: active
                            ? theme.primary
                            : theme.surfaceMuted,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color: active
                              ? theme.primaryText
                              : theme.textSecondary,
                          },
                        ]}
                      >
                        {chip.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          isError ? (
            <InspectorListState
              title="Couldn't load jobs"
              message="Your assignments could not be loaded."
              onRetry={() => void refetch()}
            />
          ) : hasActiveFilters ? (
            <InspectorListState
              title="No jobs found matching your filters"
              message="Try a different filter or clear your search."
              onRetry={resetFilters}
            />
          ) : (
            <InspectorListState
              title="No jobs yet"
              message="Your assignments will appear here."
            />
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
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 24 },
  separator: { height: StyleSheet.hairlineWidth },
  controls: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  search: {
    height: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: "600",
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  chipText: { fontSize: 12, fontWeight: "700" },
});
