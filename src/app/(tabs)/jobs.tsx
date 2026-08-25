import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  useCallback,
  useMemo,
  useState,
} from "react";
import {
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import JobCard from "@/components/jobs/JobCard";
import InspectorListState from "@/components/inspector/InspectorListState";
import InspectorScreenHeader from "@/components/inspector/InspectorScreenHeader";
import ScreenContainer from "@/components/ui/ScreenContainer";
import {
  fontWeight,
} from "@/constants/theme";
import {
  getJobBucket,
  isJobCancelled,
  sortJobsAscending,
  sortJobsDescending,
} from "@/features/jobs/job.helpers";
import { useWorkerJobs } from "@/features/jobs/use-worker-jobs";
import { useAuth } from "@/features/auth/use-auth";
import { useAppTheme } from "@/hooks/use-app-theme";
import type {
  WorkerJob,
} from "@/types/job";

type JobsFilter =
  | "all"
  | "service"
  | "inspection"
  | "upcoming"
  | "completed";

const FILTERS: Array<{
  key: JobsFilter;
  label: string;
}> = [
  {
    key: "all",
    label: "All Jobs",
  },
  {
    key: "service",
    label: "Service",
  },
  {
    key: "inspection",
    label: "Inspection",
  },
  {
    key: "upcoming",
    label: "Upcoming",
  },
  {
    key: "completed",
    label: "Completed",
  },
];

export default function JobsScreen() {
  const theme = useAppTheme();
  const { profile } = useAuth();

  const [
    selectedFilter,
    setSelectedFilter,
  ] = useState<JobsFilter>("all");

  const [
    search,
    setSearch,
  ] = useState("");

  const {
    data = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useWorkerJobs(profile?.id);

  const hasSearch =
    search.trim().length > 0;

  const hasActiveFilters =
    hasSearch ||
    selectedFilter !== "all";

  const jobs = useMemo(() => {
    const needle =
      search
        .trim()
        .toLowerCase();

    const filtered =
      data.filter((job) => {
        if (isJobCancelled(job)) {
          return false;
        }

        const bucket =
          getJobBucket(job);

        if (
          selectedFilter === "service" &&
          job.kind !== "service"
        ) {
          return false;
        }

        if (
          selectedFilter === "inspection" &&
          job.kind !== "inspection"
        ) {
          return false;
        }

        if (
          selectedFilter === "upcoming" &&
          bucket !== "upcoming"
        ) {
          return false;
        }

        if (
          selectedFilter === "completed" &&
          bucket !== "completed"
        ) {
          return false;
        }

        if (!needle) {
          return true;
        }

        /**
         * List search intentionally uses fields already present
         * in the cached job list. This avoids an RPC/network call
         * per keystroke and keeps typing instant.
         *
         * Customer contact remains detail-only because the existing
         * backend exposes service customer contact through its
         * protected job-detail RPC.
         */
        const searchableText = [
          job.vehicleLabel,
          job.registration,
          job.title,
          job.address,
          job.city,
          job.postcode,
          job.notes,
          job.status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(
          needle,
        );
      });

    /**
     * Website Jobs behaves as one complete collection.
     * Upcoming/active work is chronological; completed work
     * is most-recent-first.
     */
    if (
      selectedFilter === "completed"
    ) {
      return sortJobsDescending(
        filtered,
      );
    }

    return sortJobsAscending(
      filtered,
    );
  }, [
    data,
    selectedFilter,
    search,
  ]);

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

  const resetFilters =
    useCallback(() => {
      Keyboard.dismiss();
      setSearch("");
      setSelectedFilter("all");
    }, []);

  const clearSearch =
    useCallback(() => {
      setSearch("");
    }, []);

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
          <View>
            <InspectorScreenHeader
              eyebrow="ASSIGNMENTS"
              title="All jobs"
              subtitle="Search and filter your service and inspection workload."
            />

            <View style={styles.controls}>
              <View
                style={[
                  styles.searchShell,
                  {
                    borderColor:
                      theme.inputBorder,
                    backgroundColor:
                      theme.background,
                  },
                ]}
              >
                <Ionicons
                  name="search-outline"
                  size={20}
                  color={theme.textMuted}
                />

                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search registration, vehicle, location..."
                  placeholderTextColor={
                    theme.textMuted
                  }
                  selectionColor={
                    theme.primary
                  }
                  cursorColor={
                    theme.primary
                  }
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                  style={[
                    styles.searchInput,
                    {
                      color:
                        theme.text,
                    },
                  ]}
                />

                {hasSearch ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Clear search"
                    hitSlop={10}
                    onPress={clearSearch}
                    style={({ pressed }) => [
                      styles.clearSearch,
                      pressed && {
                        opacity: 0.5,
                      },
                    ]}
                  >
                    <Ionicons
                      name="close"
                      size={20}
                      color={
                        theme.textMuted
                      }
                    />
                  </Pressable>
                ) : null}
              </View>

              <View
                style={
                  styles.filterLine
                }
              >
                <View
                  style={
                    styles.filterLabel
                  }
                >
                  <Ionicons
                    name="filter-outline"
                    size={17}
                    color={
                      theme.textSecondary
                    }
                  />

                  <Text
                    style={[
                      styles.filterLabelText,
                      {
                        color:
                          theme.textSecondary,
                      },
                    ]}
                  >
                    Filter:
                  </Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={
                    false
                  }
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={
                    styles.filterChips
                  }
                >
                  {FILTERS.map(
                    (filter) => (
                      <FilterChip
                        key={filter.key}
                        label={
                          filter.label
                        }
                        active={
                          selectedFilter ===
                          filter.key
                        }
                        onPress={() => {
                          setSelectedFilter(
                            filter.key,
                          );
                        }}
                      />
                    ),
                  )}
                </ScrollView>
              </View>
            </View>

            <View
              style={
                styles.headerSpacing
              }
            />
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <InspectorListState
              loading
              title="Loading jobs"
              message="Getting your latest assignments."
            />
          ) : isError ? (
            <InspectorListState
              title="Couldn't load jobs"
              message="Your assignments could not be loaded right now."
              onRetry={() => {
                void refetch();
              }}
            />
          ) : hasActiveFilters ? (
            <SearchEmptyState
              onReset={
                resetFilters
              }
            />
          ) : (
            <InspectorListState
              title="No jobs yet"
              message="Your assigned service and inspection jobs will appear here."
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
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
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

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{
        selected: active,
      }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterChip,
        {
          backgroundColor:
            active
              ? theme.action
              : "transparent",

          borderColor:
            active
              ? theme.action
              : theme.border,
        },
        pressed && {
          opacity: 0.72,
        },
      ]}
    >
      <Text
        style={[
          styles.filterChipText,
          {
            color:
              active
                ? theme.actionText
                : theme.textSecondary,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SearchEmptyState({
  onReset,
}: {
  onReset: () => void;
}) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.searchEmpty,
        {
          borderColor:
            theme.border,
        },
      ]}
    >
      <Text
        style={[
          styles.searchEmptyTitle,
          {
            color: theme.text,
          },
        ]}
      >
        No jobs found matching your filters
      </Text>

      <Text
        style={[
          styles.searchEmptyMessage,
          {
            color:
              theme.textSecondary,
          },
        ]}
      >
        Try selecting a different filter chip or clearing your search term.
      </Text>

      <Pressable
        accessibilityRole="button"
        hitSlop={10}
        onPress={onReset}
        style={({ pressed }) => [
          styles.resetButton,
          pressed && {
            opacity: 0.55,
          },
        ]}
      >
        <Text
          style={[
            styles.resetText,
            {
              color: theme.primary,
            },
          ]}
        >
          Reset filters
        </Text>
      </Pressable>
    </View>
  );
}

const styles =
  StyleSheet.create({
    content: {
      flexGrow: 1,

      /*
       * Floating bottom tabs overlay the scene.
       * Keep the final row scrollable above them.
       */
      paddingBottom: 24,
    },

    controls: {
      paddingTop: 2,
      paddingBottom: 8,
    },

    searchShell: {
      minHeight: 50,

      paddingHorizontal: 14,

      flexDirection: "row",
      alignItems: "center",

      gap: 10,

      borderWidth: 1,
      borderRadius: 12,
    },

    searchInput: {
      flex: 1,

      minHeight: 48,

      paddingVertical: 0,

      fontSize: 14,
      lineHeight: 19,

      fontWeight:
        fontWeight.medium,
    },

    clearSearch: {
      width: 34,
      height: 40,

      alignItems: "center",
      justifyContent: "center",
    },

    filterLine: {
      marginTop: 14,

      flexDirection: "row",
      alignItems: "center",

      gap: 10,
    },

    filterLabel: {
      flexDirection: "row",
      alignItems: "center",

      gap: 5,
    },

    filterLabelText: {
      fontSize: 12,
      lineHeight: 17,

      fontWeight:
        fontWeight.semibold,
    },

    filterChips: {
      gap: 7,
      paddingRight: 4,
    },

    filterChip: {
      minHeight: 34,

      paddingHorizontal: 13,

      alignItems: "center",
      justifyContent: "center",

      borderWidth: 1,
      borderRadius: 10,
    },

    filterChipText: {
      fontSize: 12,
      lineHeight: 16,

      fontWeight:
        fontWeight.bold,
    },

    headerSpacing: {
      height: 16,
    },

    separator: {
      height:
        StyleSheet.hairlineWidth,
    },

    searchEmpty: {
      marginTop: 14,

      paddingVertical: 42,
      paddingHorizontal: 20,

      alignItems: "center",

      borderWidth: 1,
      borderStyle: "dashed",
      borderRadius: 18,
    },

    searchEmptyTitle: {
      textAlign: "center",

      fontSize: 16,
      lineHeight: 22,

      fontWeight:
        fontWeight.bold,
    },

    searchEmptyMessage: {
      marginTop: 8,

      maxWidth: 340,

      textAlign: "center",

      fontSize: 13,
      lineHeight: 20,
    },

    resetButton: {
      minHeight: 40,

      marginTop: 10,

      paddingHorizontal: 12,

      alignItems: "center",
      justifyContent: "center",
    },

    resetText: {
      fontSize: 13,
      lineHeight: 18,

      fontWeight:
        fontWeight.bold,
    },
  });

