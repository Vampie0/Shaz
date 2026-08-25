import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import CustomerStatusBadge from "@/components/customer/CustomerStatusBadge";
import CustomerTopBar from "@/components/customer/CustomerTopBar";
import ScreenContainer from "@/components/ui/ScreenContainer";
import { fontSize, fontWeight, radius, spacing } from "@/constants/theme";
import { useAuth } from "@/features/auth/use-auth";
import { useCustomerInspectionDetail } from "@/features/customer/use-customer-inspection-detail";
import { useAppTheme } from "@/hooks/use-app-theme";

type Tone = "neutral" | "success" | "warning" | "info" | "danger";

const progressSteps = [
  {
    key: "request",
    title: "Request received",
  },
  {
    key: "confirmed",
    title: "Appointment confirmation",
  },
  {
    key: "assigned",
    title: "Inspector assigned",
  },
  {
    key: "inspection",
    title: "Inspection",
  },
  {
    key: "report",
    title: "Report ready",
  },
] as const;

function titleCase(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function inspectionTypeLabel(value: string) {
  if (value === "seller_pre_inspection") {
    return "Seller pre-inspection";
  }

  if (value === "buyer_inspection") {
    return "Buyer inspection";
  }

  return titleCase(value);
}

function statusMeta(status: string): {
  label: string;
  tone: Tone;
} {
  switch (status) {
    case "completed":
      return {
        label: "Completed",
        tone: "success",
      };

    case "report_submitted":
      return {
        label: "Report submitted",
        tone: "warning",
      };

    case "inspection_in_progress":
      return {
        label: "In progress",
        tone: "info",
      };

    case "inspection_scheduled":
      return {
        label: "Scheduled",
        tone: "info",
      };

    case "assigned":
      return {
        label: "Inspector assigned",
        tone: "warning",
      };

    case "confirmed":
      return {
        label: "Confirmed",
        tone: "success",
      };

    case "cancelled":
      return {
        label: "Cancelled",
        tone: "danger",
      };

    default:
      return {
        label: status === "pending" ? "Pending" : titleCase(status),
        tone: "neutral",
      };
  }
}

function statusRank(status: string) {
  switch (status) {
    case "completed":
      return 5;

    case "report_submitted":
      return 4;

    case "inspection_in_progress":
      return 3;

    case "inspection_scheduled":
    case "assigned":
      return 2;

    case "confirmed":
      return 1;

    case "pending":
    default:
      return 0;
  }
}

function stepDone(stepIndex: number, rank: number) {
  if (stepIndex === 0) {
    return true;
  }

  if (stepIndex === 1) {
    return rank >= 1;
  }

  if (stepIndex === 2) {
    return rank >= 2;
  }

  if (stepIndex === 3) {
    return rank >= 4;
  }

  return rank >= 5;
}

function stepActive(stepIndex: number, rank: number, status: string) {
  if (status === "cancelled") {
    return false;
  }

  if (stepIndex === 0 && rank === 0) {
    return true;
  }

  if (stepIndex === 1 && rank === 1) {
    return true;
  }

  if (stepIndex === 2 && rank === 2) {
    return true;
  }

  if (stepIndex === 3 && rank === 3) {
    return true;
  }

  if (stepIndex === 4 && rank === 4) {
    return true;
  }

  return false;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(value: string) {
  const date = new Date(value);

  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleTimeString("en-GB", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const match = value.match(/^(\d{2}):(\d{2})/);

  if (!match) {
    return value;
  }

  const fallback = new Date();

  fallback.setHours(Number(match[1]), Number(match[2]), 0, 0);

  return fallback.toLocaleTimeString("en-GB", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatPrice(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "";
  }

  return (
    "£" +
    value.toLocaleString("en-GB", {
      maximumFractionDigits: 0,
    })
  );
}

function formatMileage(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "";
  }

  return value.toLocaleString("en-GB") + " miles";
}

export default function CustomerInspectionDetailScreen() {
  const theme = useAppTheme();

  const { session } = useAuth();

  const params = useLocalSearchParams<{
    inspectionId?: string;
  }>();

  const inspectionId =
    typeof params.inspectionId === "string" ? params.inspectionId : "";

  const query = useCustomerInspectionDetail(session?.user.id, inspectionId);

  const inspection = query.data;

  if (query.isLoading) {
    return (
      <ScreenContainer contentStyle={styles.screen}>
        <CustomerTopBar title="Inspection" showBack />

        <View style={styles.state}>
          <ActivityIndicator color={theme.primary} />

          <Text
            style={[
              styles.stateText,
              {
                color: theme.textSecondary,
              },
            ]}
          >
            Loading inspection…
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  if (query.isError || !inspection) {
    return (
      <ScreenContainer contentStyle={styles.screen}>
        <CustomerTopBar title="Inspection" showBack />

        <View style={styles.state}>
          <Ionicons
            name="alert-circle-outline"
            size={30}
            color={theme.primary}
          />

          <Text
            style={[
              styles.stateTitle,
              {
                color: theme.text,
              },
            ]}
          >
            Couldn&apos;t load inspection
          </Text>

          <Text
            style={[
              styles.stateText,
              {
                color: theme.textSecondary,
              },
            ]}
          >
            Go back and try again.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  const status = statusMeta(inspection.status);

  const rank = statusRank(inspection.status);

  const vehicleTitle =
    [inspection.make, inspection.model, inspection.vehicle?.variant]
      .filter(Boolean)
      .join(" ") || "Vehicle";

  const vehicleMeta = inspection.vehicle
    ? [
        inspection.vehicle.year,
        titleCase(inspection.vehicle.fuelType),
        formatMileage(inspection.vehicle.mileage),
      ]
        .filter(Boolean)
        .join(" · ")
    : [inspection.year, inspection.registration].filter(Boolean).join(" · ");

  const canViewListing = inspection.vehicle?.status === "active";

  const appointmentSource = inspection.scheduledFor ?? inspection.preferredDate;

  const appointmentDate = appointmentSource
    ? formatDate(
        inspection.scheduledFor
          ? appointmentSource
          : `${appointmentSource}T00:00:00`,
      )
    : null;

  const appointmentTime = inspection.scheduledFor
    ? formatTime(inspection.scheduledFor)
    : inspection.preferredTime
      ? formatTime(inspection.preferredTime)
      : null;

  const address = [
    inspection.inspectionAddress,
    inspection.city,
    inspection.postcode,
  ]
    .filter(Boolean)
    .join(", ");

  const isCompleted = inspection.status === "completed";

  const progressMessage = isCompleted
    ? "Inspection completed"
    : inspection.status === "report_submitted"
      ? "Report submitted"
      : inspection.status === "inspection_in_progress"
        ? "Inspection in progress"
        : inspection.status === "cancelled"
          ? "Inspection cancelled"
          : "Inspection request";

  const progressDescription = isCompleted
    ? "Your official vehicle inspection report is ready to view."
    : inspection.status === "report_submitted"
      ? "The inspection report has been submitted and is awaiting final completion."
      : inspection.status === "inspection_in_progress"
        ? "Your vehicle inspection is currently being carried out."
        : inspection.status === "cancelled"
          ? "This inspection request is no longer active."
          : "Track the request, appointment and inspection progress here.";

  return (
    <ScreenContainer contentStyle={styles.screen}>
      <CustomerTopBar title="Inspection" showBack />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => void query.refetch()}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        <View style={styles.hero}>
          <Text
            style={[
              styles.eyebrow,
              {
                color: theme.primary,
              },
            ]}
          >
            VEHICLE INSPECTION
          </Text>

          <View style={styles.heroTitleRow}>
            <Text
              style={[
                styles.heroTitle,
                {
                  color: theme.text,
                },
              ]}
            >
              Vehicle inspection
            </Text>

            <CustomerStatusBadge label={status.label} tone={status.tone} />
          </View>
        </View>

        <View
          style={[
            styles.divider,
            {
              backgroundColor: theme.border,
            },
          ]}
        />

        <View style={styles.summary}>
          <Text
            style={[
              styles.summaryEyebrow,
              {
                color: theme.textMuted,
              },
            ]}
          >
            {inspectionTypeLabel(inspection.inspectionType).toUpperCase()}
          </Text>

          <Text
            style={[
              styles.summaryTitle,
              {
                color: theme.text,
              },
            ]}
          >
            {progressMessage}
          </Text>

          <Text
            style={[
              styles.summaryText,
              {
                color: theme.textSecondary,
              },
            ]}
          >
            {progressDescription}
          </Text>

          {isCompleted ? (
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: "/(customer)/inspection-report/[inspectionId]",
                  params: {
                    inspectionId: inspection.id,
                  },
                })
              }
              style={({ pressed }) => [
                styles.reportButton,
                {
                  backgroundColor: theme.primary,
                },
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name="document-text-outline"
                size={20}
                color="#FFFFFF"
              />

              <Text style={styles.reportButtonText}>
                View Inspection Report
              </Text>

              <Ionicons name="arrow-forward" size={19} color="#FFFFFF" />
            </Pressable>
          ) : null}
        </View>

        <View
          style={[
            styles.divider,
            {
              backgroundColor: theme.border,
            },
          ]}
        />

        <View style={styles.vehicleSection}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.text,
              },
            ]}
          >
            Vehicle
          </Text>

          <View
            style={[
              styles.vehicleCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.vehicleCardMain}>
              {inspection.vehicle?.imageUrl ? (
                <Image
                  source={{
                    uri: inspection.vehicle.imageUrl,
                  }}
                  resizeMode="cover"
                  style={styles.vehicleImage}
                />
              ) : (
                <View
                  style={[
                    styles.vehicleFallback,
                    {
                      backgroundColor: theme.surfaceSecondary,
                    },
                  ]}
                >
                  <Ionicons
                    name="car-sport-outline"
                    size={34}
                    color={theme.textMuted}
                  />
                </View>
              )}

              <View style={styles.vehicleCopy}>
                <Text
                  numberOfLines={2}
                  style={[
                    styles.vehicleTitle,
                    {
                      color: theme.text,
                    },
                  ]}
                >
                  {vehicleTitle}
                </Text>

                {vehicleMeta ? (
                  <Text
                    style={[
                      styles.vehicleMeta,
                      {
                        color: theme.textSecondary,
                      },
                    ]}
                  >
                    {vehicleMeta}
                  </Text>
                ) : null}

                {inspection.vehicle ? (
                  <Text
                    style={[
                      styles.vehiclePrice,
                      {
                        color: theme.text,
                      },
                    ]}
                  >
                    {formatPrice(inspection.vehicle.price)}
                  </Text>
                ) : null}
              </View>
            </View>

            {canViewListing && inspection.vehicle ? (
              <View style={styles.vehicleActionRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="View listing"
                  onPress={() =>
                    router.push({
                      pathname: "/(customer)/car/[carId]",
                      params: {
                        carId: inspection.vehicle!.id,
                      },
                    })
                  }
                  style={({ pressed }) => [
                    styles.viewListingButton,
                    {
                      borderColor: theme.primary,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.viewListingText,
                      {
                        color: theme.primary,
                      },
                    ]}
                  >
                    View listing
                  </Text>

                  <Ionicons
                    name="arrow-forward"
                    size={17}
                    color={theme.primary}
                  />
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>

        <View
          style={[
            styles.divider,
            {
              backgroundColor: theme.border,
            },
          ]}
        />

        <View style={styles.progressSection}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.text,
              },
            ]}
          >
            Inspection progress
          </Text>

          <View style={styles.timeline}>
            {progressSteps.map((step, index) => {
              const done = stepDone(index, rank);

              const active = stepActive(index, rank, inspection.status);

              return (
                <View key={step.key} style={styles.timelineRow}>
                  <View style={styles.timelineRail}>
                    <View
                      style={[
                        styles.timelineDot,
                        {
                          backgroundColor: done
                            ? theme.success
                            : active
                              ? theme.primary
                              : theme.surfaceSecondary,
                          borderColor: done
                            ? theme.success
                            : active
                              ? theme.primary
                              : theme.border,
                        },
                      ]}
                    >
                      {done ? (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      ) : active ? (
                        <View style={styles.activeDot} />
                      ) : null}
                    </View>

                    {index < progressSteps.length - 1 ? (
                      <View
                        style={[
                          styles.timelineLine,
                          {
                            backgroundColor: done
                              ? theme.successSoft
                              : theme.border,
                          },
                        ]}
                      />
                    ) : null}
                  </View>

                  <Text
                    style={[
                      styles.timelineText,
                      {
                        color: done || active ? theme.text : theme.textMuted,
                        fontWeight:
                          done || active
                            ? fontWeight.semibold
                            : fontWeight.medium,
                      },
                    ]}
                  >
                    {step.title}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View
          style={[
            styles.divider,
            {
              backgroundColor: theme.border,
            },
          ]}
        />

        <View style={styles.appointmentSection}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.text,
              },
            ]}
          >
            Inspection appointment
          </Text>

          <View style={styles.appointmentRows}>
            <View style={styles.infoRow}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={theme.primary}
              />

              <View style={styles.infoCopy}>
                <Text
                  style={[
                    styles.infoLabel,
                    {
                      color: theme.textMuted,
                    },
                  ]}
                >
                  INSPECTION DATE
                </Text>

                <Text
                  style={[
                    styles.infoValue,
                    {
                      color: theme.text,
                    },
                  ]}
                >
                  {appointmentDate ?? "Not scheduled yet"}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color={theme.primary} />

              <View style={styles.infoCopy}>
                <Text
                  style={[
                    styles.infoLabel,
                    {
                      color: theme.textMuted,
                    },
                  ]}
                >
                  TIME
                </Text>

                <Text
                  style={[
                    styles.infoValue,
                    {
                      color: theme.text,
                    },
                  ]}
                >
                  {appointmentTime ?? "Not confirmed yet"}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons
                name="location-outline"
                size={20}
                color={theme.primary}
              />

              <View style={styles.infoCopy}>
                <Text
                  style={[
                    styles.infoLabel,
                    {
                      color: theme.textMuted,
                    },
                  ]}
                >
                  LOCATION
                </Text>

                <Text
                  style={[
                    styles.infoValue,
                    {
                      color: theme.text,
                    },
                  ]}
                >
                  {address}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {inspection.notes ? (
          <>
            <View
              style={[
                styles.divider,
                {
                  backgroundColor: theme.border,
                },
              ]}
            />

            <View style={styles.notesSection}>
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color: theme.text,
                  },
                ]}
              >
                Notes
              </Text>

              <Text
                style={[
                  styles.notesText,
                  {
                    color: theme.textSecondary,
                  },
                ]}
              >
                {inspection.notes}
              </Text>
            </View>
          </>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
  },

  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
    gap: spacing.xxl,
  },

  state: {
    flex: 1,
    minHeight: 320,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },

  stateTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },

  stateText: {
    fontSize: fontSize.sm,
    textAlign: "center",
    lineHeight: 21,
  },

  hero: {
    gap: spacing.md,
  },

  eyebrow: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 1.4,
  },

  heroTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },

  heroTitle: {
    flex: 1,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.7,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
  },

  summary: {
    gap: spacing.sm,
  },

  summaryEyebrow: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    letterSpacing: 1,
  },

  summaryTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },

  summaryText: {
    fontSize: fontSize.md,
    lineHeight: 24,
  },

  reportButton: {
    minHeight: 54,
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
  },

  reportButtonText: {
    flexShrink: 1,
    color: "#FFFFFF",
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },

  vehicleSection: {
    gap: spacing.lg,
  },

  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },

  vehicleCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },

  vehicleCardMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  vehicleImage: {
    width: 112,
    height: 84,
    borderRadius: radius.md,
  },

  vehicleFallback: {
    width: 112,
    height: 84,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },

  vehicleCopy: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },

  vehicleTitle: {
    fontSize: fontSize.md,
    lineHeight: 22,
    fontWeight: fontWeight.bold,
  },

  vehicleMeta: {
    fontSize: fontSize.sm,
    lineHeight: 19,
  },

  vehiclePrice: {
    marginTop: 2,
    fontSize: fontSize.lg,
    lineHeight: 24,
    fontWeight: fontWeight.bold,
  },

  vehicleActionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },

  viewListingButton: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },

  viewListingText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },

  progressSection: {
    gap: spacing.xl,
  },

  timeline: {
    gap: 0,
  },

  timelineRow: {
    minHeight: 62,
    flexDirection: "row",
    gap: spacing.md,
  },

  timelineRail: {
    width: 34,
    alignItems: "center",
  },

  timelineDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },

  timelineLine: {
    width: 2,
    flex: 1,
    marginVertical: 5,
  },

  timelineText: {
    flex: 1,
    paddingTop: 5,
    fontSize: fontSize.md,
    lineHeight: 22,
  },

  appointmentSection: {
    gap: spacing.xl,
  },

  appointmentRows: {
    gap: spacing.lg,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },

  infoCopy: {
    flex: 1,
    gap: 4,
  },

  infoLabel: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.8,
  },

  infoValue: {
    fontSize: fontSize.md,
    lineHeight: 22,
    fontWeight: fontWeight.semibold,
  },

  notesSection: {
    gap: spacing.md,
  },

  notesText: {
    fontSize: fontSize.md,
    lineHeight: 24,
  },

  pressed: {
    opacity: 0.72,
    transform: [
      {
        scale: 0.992,
      },
    ],
  },
});
