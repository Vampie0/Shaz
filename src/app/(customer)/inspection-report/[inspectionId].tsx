import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import CustomerTopBar from "@/components/customer/CustomerTopBar";
import AppLoadingOverlay from "@/components/ui/AppLoadingOverlay";
import ScreenContainer from "@/components/ui/ScreenContainer";
import { fontSize, fontWeight, radius, spacing } from "@/constants/theme";
import { useAuth } from "@/features/auth/use-auth";
import { useCustomerInspectionReport } from "@/features/customer/use-customer-inspection-detail";
import { useAppTheme } from "@/hooks/use-app-theme";

// SENIOR'S EXACT OVERALL RESULT LOGIC
function getOverallResultMeta(result: string | null | undefined): {
  label: string;
  tone: "success" | "warning" | "danger" | "neutral";
} {
  if (!result) return { label: "NOT SPECIFIED", tone: "neutral" };
  const normalized = result.toLowerCase();

  if (normalized === "passed") return { label: "PASSED", tone: "success" };
  if (normalized === "passed_with_advisories")
    return { label: "PASSED WITH ADVISORIES", tone: "warning" };
  if (normalized === "attention_required" || normalized === "not_suitable")
    return { label: "ATTENTION REQUIRED", tone: "danger" };

  return { label: result.replace(/_/g, " ").toUpperCase(), tone: "neutral" };
}

// SENIOR'S EXACT COMPONENT RATING LOGIC
function getRatingMeta(rating: string | null | undefined): {
  label: string;
  tone: "success" | "info" | "warning" | "danger" | "neutral";
} {
  if (!rating) return { label: "N/A", tone: "neutral" };
  const r = rating.toLowerCase();

  if (r === "excellent") return { label: "EXCELLENT", tone: "success" };
  if (r === "good") return { label: "GOOD", tone: "info" }; // Web uses blue for Good!
  if (r === "fair") return { label: "FAIR", tone: "warning" };
  if (r === "poor") return { label: "POOR", tone: "danger" };

  return { label: rating.toUpperCase(), tone: "neutral" };
}

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function CustomerInspectionReportScreen() {
  const theme = useAppTheme();
  const { session } = useAuth();
  const params = useLocalSearchParams<{ inspectionId?: string }>();
  const inspectionId =
    typeof params.inspectionId === "string" ? params.inspectionId : "";

  const query = useCustomerInspectionReport(session?.user.id, inspectionId);
  const report = query.data;

  if (query.isLoading) {
    return (
      <ScreenContainer contentStyle={styles.screen}>
        <CustomerTopBar title="Inspection Report" showBack />
        <AppLoadingOverlay visible message="Loading inspection report..." />
      </ScreenContainer>
    );
  }

  if (query.isError || !report) {
    return (
      <ScreenContainer contentStyle={styles.screen}>
        <CustomerTopBar title="Inspection Report" showBack />
        <View style={styles.state}>
          <Ionicons
            name="document-text-outline"
            size={32}
            color={theme.primary}
          />
          <Text style={[styles.stateTitle, { color: theme.text }]}>
            Report unavailable
          </Text>
          <Text style={[styles.stateText, { color: theme.textSecondary }]}>
            The completed report could not be loaded.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  const inspection = report.inspection;
  const title = [
    inspection.year,
    inspection.make,
    inspection.model,
    inspection.vehicle?.variant,
  ]
    .filter(Boolean)
    .join(" ");

  const completedDate = formatDate(
    inspection.completedAt ?? report.submittedAt,
  );

  const ratings = [
    { label: "Bodywork & Frame", value: report.bodyCondition },
    { label: "Tyres & Wheels", value: report.tyreCondition },
    { label: "Interior & Cabin", value: report.interiorCondition },
    { label: "Engine & Drivetrain", value: report.engineCondition },
    { label: "Brakes & Suspension", value: report.brakesCondition },
  ];

  const overallMeta = getOverallResultMeta(report.overallResult);
  const overallBackground =
    overallMeta.tone === "success"
      ? theme.successSoft
      : overallMeta.tone === "danger"
        ? theme.dangerSoft
        : overallMeta.tone === "warning"
          ? theme.warningSoft
          : theme.surfaceSecondary;

  const overallColor =
    overallMeta.tone === "success"
      ? theme.success
      : overallMeta.tone === "danger"
        ? theme.danger
        : overallMeta.tone === "warning"
          ? theme.warning
          : theme.textSecondary;

  return (
    <ScreenContainer contentStyle={styles.screen}>
      <CustomerTopBar title="Inspection Report" showBack />

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
        {/* HEADER SECTION (CLEAN & PROFESSIONAL) */}
        <View style={styles.hero}>
          <View style={styles.badgeRow}>
            <View
              style={[styles.typeBadge, { backgroundColor: theme.primary }]}
            >
              <Text style={styles.typeBadgeText}>
                {inspection.inspectionType === "seller_pre_inspection"
                  ? "SELLER PRE-INSPECTION"
                  : "BUYER INSPECTION"}
              </Text>
            </View>

            {inspection.registration ? (
              <View
                style={[
                  styles.regBadge,
                  {
                    backgroundColor: theme.warningSoft,
                    borderColor: theme.warning,
                  },
                ]}
              >
                <Text style={[styles.regText, { color: theme.text }]}>
                  {inspection.registration}
                </Text>
              </View>
            ) : null}
          </View>

          <Text style={[styles.title, { color: theme.text }]}>
            {title || "Vehicle"} · {inspection.city}
          </Text>

          <View style={styles.resultRow}>
            <View
              style={[
                styles.resultBadge,
                {
                  backgroundColor: overallBackground,
                  borderColor: overallColor,
                },
              ]}
            >
              <Text style={[styles.resultText, { color: overallColor }]}>
                {overallMeta.label}
              </Text>
            </View>

            {completedDate ? (
              <Text style={[styles.completedText, { color: theme.textMuted }]}>
                Completed {completedDate}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* EXECUTIVE SUMMARY (CLEAN INSET BLOCK) */}
        <View style={styles.section}>
          <Text style={[styles.sectionEyebrow, { color: theme.textMuted }]}>
            EXECUTIVE SUMMARY
          </Text>
          <View
            style={[
              styles.summaryBox,
              {
                backgroundColor: theme.surfaceSecondary,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.summary, { color: theme.text }]}>
              {report.summary?.trim() || "No executive summary was provided."}
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* COMPONENT RATINGS */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Component Condition Ratings
          </Text>

          <View style={styles.ratings}>
            {ratings.map((item) => {
              const rMeta = getRatingMeta(item.value);
              const rColor =
                rMeta.tone === "success"
                  ? theme.success
                  : rMeta.tone === "danger"
                    ? theme.danger
                    : rMeta.tone === "warning"
                      ? theme.warning
                      : rMeta.tone === "info"
                        ? theme.info
                        : theme.textSecondary;

              const rBg =
                rMeta.tone === "success"
                  ? theme.successSoft
                  : rMeta.tone === "danger"
                    ? theme.dangerSoft
                    : rMeta.tone === "warning"
                      ? theme.warningSoft
                      : rMeta.tone === "info"
                        ? theme.infoSoft
                        : theme.surfaceSecondary;

              return (
                <View
                  key={item.label}
                  style={[
                    styles.ratingRow,
                    { borderBottomColor: theme.border },
                  ]}
                >
                  <Text style={[styles.ratingLabel, { color: theme.text }]}>
                    {item.label}
                  </Text>
                  <View
                    style={[styles.ratingValueBox, { backgroundColor: rBg }]}
                  >
                    <Text style={[styles.ratingValueText, { color: rColor }]}>
                      {rMeta.label}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* VERIFICATION CHECKS (SOLID TRUST BLOCK) */}
          <View
            style={[
              styles.checkStrip,
              {
                backgroundColor: theme.surfaceSecondary,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.checkRow}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={report.mileageChecked ? theme.success : theme.textMuted}
              />
              <Text style={[styles.checkText, { color: theme.text }]}>
                Odometer Mileage Verified
              </Text>
            </View>

            <View style={styles.checkRow}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={
                  report.registrationChecked ? theme.success : theme.textMuted
                }
              />
              <Text style={[styles.checkText, { color: theme.text }]}>
                VIN & Registration Plate Verified
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* PHOTOS SECTION */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Inspection Evidence Photos
            {report.images.length ? ` (${report.images.length})` : ""}
          </Text>

          {report.images.length ? (
            <View style={styles.photoList}>
              {report.images.map((image) => (
                <View
                  key={image.id}
                  style={[
                    styles.photoItem,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.surfaceSecondary,
                    },
                  ]}
                >
                  <Image
                    source={{ uri: image.url }}
                    resizeMode="cover"
                    style={styles.photo}
                  />
                  {image.caption ? (
                    <View style={styles.captionOverlay}>
                      <Text numberOfLines={1} style={styles.captionText}>
                        {image.caption}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          ) : (
            <View
              style={[
                styles.emptyEvidence,
                { backgroundColor: theme.surfaceSecondary },
              ]}
            >
              <Ionicons
                name="images-outline"
                size={26}
                color={theme.textMuted}
              />
              <Text
                style={[
                  styles.emptyEvidenceText,
                  { color: theme.textSecondary },
                ]}
              >
                No evidence photos are available for this report.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 0 },
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
  stateTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  stateText: { fontSize: fontSize.sm, lineHeight: 21, textAlign: "center" },

  hero: { gap: spacing.md },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  typeBadgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" },
  regBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  regText: { fontSize: 11, fontWeight: "900", letterSpacing: 1 },

  title: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.5,
  },

  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  resultBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  resultText: { fontSize: 11, fontWeight: "900", letterSpacing: 0.5 },
  completedText: { fontSize: 11, fontWeight: fontWeight.semibold },

  divider: { height: StyleSheet.hairlineWidth },

  section: { gap: spacing.lg },
  sectionEyebrow: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    letterSpacing: 1,
  },
  summaryBox: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  summary: {
    fontSize: fontSize.sm,
    lineHeight: 22,
    fontWeight: fontWeight.medium,
  },

  sectionTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold },

  ratings: { gap: 0, marginBottom: spacing.md },
  ratingRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  ratingLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  ratingValueBox: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  ratingValueText: { fontSize: 9.5, fontWeight: "900", letterSpacing: 0.5 },

  checkStrip: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  checkRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  checkText: { flex: 1, fontSize: fontSize.sm, fontWeight: fontWeight.bold },

  photoList: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  photoItem: {
    width: "48%",
    aspectRatio: 4 / 3,
    borderRadius: radius.md,
    overflow: "hidden",
    borderWidth: 1,
  },
  photo: { width: "100%", height: "100%" },
  captionOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  captionText: { color: "#FFFFFF", fontSize: 9, fontWeight: fontWeight.bold },

  emptyEvidence: {
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  emptyEvidenceText: { fontSize: fontSize.sm, textAlign: "center" },
});
