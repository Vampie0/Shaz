import { Ionicons } from "@expo/vector-icons";
import {
  useLocalSearchParams,
} from "expo-router";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import CustomerTopBar from "@/components/customer/CustomerTopBar";
import ScreenContainer from "@/components/ui/ScreenContainer";
import {
  fontSize,
  fontWeight,
  radius,
  spacing,
} from "@/constants/theme";
import { useAuth } from "@/features/auth/use-auth";
import { useCustomerInspectionReport } from "@/features/customer/use-customer-inspection-detail";
import { useAppTheme } from "@/hooks/use-app-theme";

function titleCase(
  value: string,
) {
  return value
    .replaceAll(
      "_",
      " ",
    )
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}

function inspectionTypeLabel(
  value: string,
) {
  if (
    value ===
    "seller_pre_inspection"
  ) {
    return "Seller pre-inspection";
  }

  if (
    value ===
    "buyer_inspection"
  ) {
    return "Buyer inspection";
  }

  return titleCase(value);
}

function formatDate(
  value: string | null,
) {
  if (!value) {
    return null;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    "en-GB",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );
}

function ratingTone(
  value: string,
) {
  const normalized =
    value.toLowerCase();

  if (
    normalized ===
      "excellent" ||
    normalized ===
      "good"
  ) {
    return "success";
  }

  if (
    normalized ===
      "fair" ||
    normalized ===
      "advisory"
  ) {
    return "warning";
  }

  if (
    normalized ===
      "poor" ||
    normalized ===
      "fail" ||
    normalized ===
      "failed"
  ) {
    return "danger";
  }

  return "neutral";
}

export default function CustomerInspectionReportScreen() {
  const theme =
    useAppTheme();

  const {
    session,
  } = useAuth();

  const params =
    useLocalSearchParams<{
      inspectionId?: string;
    }>();

  const inspectionId =
    typeof params.inspectionId ===
    "string"
      ? params.inspectionId
      : "";

  const query =
    useCustomerInspectionReport(
      session?.user.id,
      inspectionId,
    );

  const report =
    query.data;

  if (
    query.isLoading
  ) {
    return (
      <ScreenContainer
        contentStyle={
          styles.screen
        }
      >
        <CustomerTopBar
          title="Inspection Report"
          showBack
        />

        <View style={styles.state}>
          <ActivityIndicator
            color={
              theme.primary
            }
          />

          <Text
            style={[
              styles.stateText,
              {
                color:
                  theme.textSecondary,
              },
            ]}
          >
            Loading inspection report…
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  if (
    query.isError ||
    !report
  ) {
    return (
      <ScreenContainer
        contentStyle={
          styles.screen
        }
      >
        <CustomerTopBar
          title="Inspection Report"
          showBack
        />

        <View style={styles.state}>
          <Ionicons
            name="document-text-outline"
            size={32}
            color={
              theme.primary
            }
          />

          <Text
            style={[
              styles.stateTitle,
              {
                color:
                  theme.text,
              },
            ]}
          >
            Report unavailable
          </Text>

          <Text
            style={[
              styles.stateText,
              {
                color:
                  theme.textSecondary,
              },
            ]}
          >
            The completed report could not be loaded.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  const inspection =
    report.inspection;

  const title = [
    inspection.year,
    inspection.make,
    inspection.model,
    inspection.vehicle?.variant,
  ]
    .filter(Boolean)
    .join(" ");

  const completedDate =
    formatDate(
      inspection.completedAt ??
        report.submittedAt,
    );

  const ratings = [
    {
      label:
        "Bodywork & Frame",
      value:
        report.bodyCondition,
    },
    {
      label:
        "Tyres & Wheels",
      value:
        report.tyreCondition,
    },
    {
      label:
        "Interior & Cabin",
      value:
        report.interiorCondition,
    },
    {
      label:
        "Engine & Drivetrain",
      value:
        report.engineCondition,
    },
    {
      label:
        "Brakes & Suspension",
      value:
        report.brakesCondition,
    },
  ];

  const overall =
    report.overallResult
      ? titleCase(
          report.overallResult,
        )
      : "Completed";

  const overallTone =
    ratingTone(
      report.overallResult ??
        "",
    );

  const overallBackground =
    overallTone ===
    "success"
      ? theme.successSoft
      : overallTone ===
          "danger"
        ? theme.dangerSoft
        : overallTone ===
            "warning"
          ? theme.warningSoft
          : theme.surfaceSecondary;

  const overallColor =
    overallTone ===
    "success"
      ? theme.success
      : overallTone ===
          "danger"
        ? theme.danger
        : overallTone ===
            "warning"
          ? theme.warning
          : theme.textSecondary;

  return (
    <ScreenContainer
      contentStyle={
        styles.screen
      }
    >
      <CustomerTopBar
        title="Inspection Report"
        showBack
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.content
        }
        refreshControl={
          <RefreshControl
            refreshing={
              query.isRefetching
            }
            onRefresh={() =>
              void query.refetch()
            }
            tintColor={
              theme.primary
            }
            colors={[
              theme.primary,
            ]}
          />
        }
      >
        <View style={styles.hero}>
          <Text
            style={[
              styles.eyebrow,
              {
                color:
                  theme.primary,
              },
            ]}
          >
            {inspectionTypeLabel(
              inspection.inspectionType,
            ).toUpperCase()}
          </Text>

          {inspection.registration ? (
            <Text
              style={[
                styles.registration,
                {
                  color:
                    theme.textSecondary,
                },
              ]}
            >
              {inspection.registration}
            </Text>
          ) : null}

          <Text
            style={[
              styles.title,
              {
                color:
                  theme.text,
              },
            ]}
          >
            {title ||
              "Vehicle"}{" "}
            · {inspection.city}
          </Text>

          <View style={styles.resultRow}>
            <View
              style={[
                styles.resultBadge,
                {
                  backgroundColor:
                    overallBackground,
                },
              ]}
            >
              <Text
                style={[
                  styles.resultText,
                  {
                    color:
                      overallColor,
                  },
                ]}
              >
                {overall.toUpperCase()}
              </Text>
            </View>

            {completedDate ? (
              <Text
                style={[
                  styles.completedText,
                  {
                    color:
                      theme.textMuted,
                  },
                ]}
              >
                Completed{" "}
                {completedDate}
              </Text>
            ) : null}
          </View>
        </View>

        <View
          style={[
            styles.divider,
            {
              backgroundColor:
                theme.border,
            },
          ]}
        />

        <View style={styles.section}>
          <Text
            style={[
              styles.sectionEyebrow,
              {
                color:
                  theme.textMuted,
              },
            ]}
          >
            EXECUTIVE SUMMARY
          </Text>

          <Text
            style={[
              styles.summary,
              {
                color:
                  theme.textSecondary,
              },
            ]}
          >
            {report.summary?.trim() ||
              "No executive summary was provided."}
          </Text>
        </View>

        <View
          style={[
            styles.divider,
            {
              backgroundColor:
                theme.border,
            },
          ]}
        />

        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color:
                  theme.text,
              },
            ]}
          >
            Component condition ratings
          </Text>

          <View style={styles.ratings}>
            {ratings.map(
              (
                item,
              ) => {
                const tone =
                  ratingTone(
                    item.value,
                  );

                const background =
                  tone ===
                  "success"
                    ? theme.successSoft
                    : tone ===
                        "danger"
                      ? theme.dangerSoft
                      : tone ===
                          "warning"
                        ? theme.warningSoft
                        : theme.surfaceSecondary;

                const color =
                  tone ===
                  "success"
                    ? theme.success
                    : tone ===
                        "danger"
                      ? theme.danger
                      : tone ===
                          "warning"
                        ? theme.warning
                        : theme.textSecondary;

                return (
                  <View
                    key={
                      item.label
                    }
                    style={styles.ratingRow}
                  >
                    <Text
                      style={[
                        styles.ratingLabel,
                        {
                          color:
                            theme.text,
                        },
                      ]}
                    >
                      {item.label}
                    </Text>

                    <View
                      style={[
                        styles.ratingValue,
                        {
                          backgroundColor:
                            background,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.ratingValueText,
                          {
                            color,
                          },
                        ]}
                      >
                        {titleCase(
                          item.value,
                        ).toUpperCase()}
                      </Text>
                    </View>
                  </View>
                );
              },
            )}
          </View>

          <View
            style={[
              styles.checkStrip,
              {
                backgroundColor:
                  theme.surfaceSecondary,
              },
            ]}
          >
            <View style={styles.checkRow}>
              <Ionicons
                name={
                  report.mileageChecked
                    ? "checkmark-circle"
                    : "ellipse-outline"
                }
                size={21}
                color={
                  report.mileageChecked
                    ? theme.success
                    : theme.textMuted
                }
              />

              <Text
                style={[
                  styles.checkText,
                  {
                    color:
                      theme.text,
                  },
                ]}
              >
                Odometer Mileage{" "}
                {report.mileageChecked
                  ? "Verified"
                  : "Not verified"}
              </Text>
            </View>

            <View style={styles.checkRow}>
              <Ionicons
                name={
                  report.registrationChecked
                    ? "checkmark-circle"
                    : "ellipse-outline"
                }
                size={21}
                color={
                  report.registrationChecked
                    ? theme.success
                    : theme.textMuted
                }
              />

              <Text
                style={[
                  styles.checkText,
                  {
                    color:
                      theme.text,
                  },
                ]}
              >
                VIN & Registration Plate{" "}
                {report.registrationChecked
                  ? "Verified"
                  : "Not verified"}
              </Text>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.divider,
            {
              backgroundColor:
                theme.border,
            },
          ]}
        />

        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color:
                  theme.text,
              },
            ]}
          >
            Inspection evidence photos
            {report.images.length
              ? ` (${report.images.length})`
              : ""}
          </Text>

          {report.images.length ? (
            <View style={styles.photoList}>
              {report.images.map(
                (
                  image,
                ) => (
                  <View
                    key={
                      image.id
                    }
                    style={styles.photoItem}
                  >
                    <Image
                      source={{
                        uri:
                          image.url,
                      }}
                      resizeMode="cover"
                      style={styles.photo}
                    />

                    {image.caption ? (
                      <Text
                        style={[
                          styles.caption,
                          {
                            color:
                              theme.textSecondary,
                          },
                        ]}
                      >
                        {image.caption}
                      </Text>
                    ) : null}
                  </View>
                ),
              )}
            </View>
          ) : (
            <View
              style={[
                styles.emptyEvidence,
                {
                  backgroundColor:
                    theme.surfaceSecondary,
                },
              ]}
            >
              <Ionicons
                name="images-outline"
                size={26}
                color={
                  theme.textMuted
                }
              />

              <Text
                style={[
                  styles.emptyEvidenceText,
                  {
                    color:
                      theme.textSecondary,
                  },
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

const styles =
  StyleSheet.create({
    screen: {
      paddingHorizontal: 0,
    },

    content: {
      paddingHorizontal:
        spacing.xl,
      paddingTop:
        spacing.xxl,
      paddingBottom:
        spacing.xxxl,
      gap: spacing.xxl,
    },

    state: {
      flex: 1,
      minHeight: 320,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      paddingHorizontal:
        spacing.xl,
    },

    stateTitle: {
      fontSize:
        fontSize.lg,
      fontWeight:
        fontWeight.bold,
    },

    stateText: {
      fontSize:
        fontSize.sm,
      lineHeight: 21,
      textAlign: "center",
    },

    hero: {
      gap: spacing.sm,
    },

    eyebrow: {
      fontSize:
        fontSize.xs,
      fontWeight:
        fontWeight.bold,
      letterSpacing: 1.3,
    },

    registration: {
      fontSize:
        fontSize.sm,
      fontWeight:
        fontWeight.bold,
    },

    title: {
      fontSize: 29,
      lineHeight: 35,
      fontWeight:
        fontWeight.bold,
      letterSpacing: -0.6,
    },

    resultRow: {
      marginTop:
        spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      flexWrap: "wrap",
      gap: spacing.sm,
    },

    resultBadge: {
      paddingHorizontal:
        spacing.md,
      paddingVertical: 7,
      borderRadius:
        radius.pill,
    },

    resultText: {
      fontSize:
        fontSize.xs,
      fontWeight:
        fontWeight.bold,
      letterSpacing: 0.7,
    },

    completedText: {
      fontSize:
        fontSize.sm,
      fontWeight:
        fontWeight.semibold,
    },

    divider: {
      height:
        StyleSheet.hairlineWidth,
    },

    section: {
      gap: spacing.lg,
    },

    sectionEyebrow: {
      fontSize: 11,
      fontWeight:
        fontWeight.bold,
      letterSpacing: 0.9,
    },

    sectionTitle: {
      fontSize:
        fontSize.xl,
      fontWeight:
        fontWeight.bold,
    },

    summary: {
      fontSize:
        fontSize.md,
      lineHeight: 25,
    },

    ratings: {
      gap: 0,
    },

    ratingRow: {
      minHeight: 58,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      gap: spacing.md,
      borderBottomWidth:
        StyleSheet.hairlineWidth,
      borderBottomColor:
        "rgba(148,163,184,0.28)",
    },

    ratingLabel: {
      flex: 1,
      fontSize:
        fontSize.sm,
      fontWeight:
        fontWeight.semibold,
    },

    ratingValue: {
      paddingHorizontal:
        spacing.sm,
      paddingVertical: 6,
      borderRadius:
        radius.pill,
    },

    ratingValueText: {
      fontSize: 10,
      fontWeight:
        fontWeight.bold,
      letterSpacing: 0.4,
    },

    checkStrip: {
      gap: spacing.md,
      padding:
        spacing.lg,
      borderTopLeftRadius: 8,
      borderTopRightRadius: 22,
      borderBottomLeftRadius: 22,
      borderBottomRightRadius: 8,
    },

    checkRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },

    checkText: {
      flex: 1,
      fontSize:
        fontSize.sm,
      fontWeight:
        fontWeight.semibold,
    },

    photoList: {
      gap: spacing.lg,
    },

    photoItem: {
      gap: spacing.sm,
    },

    photo: {
      width: "100%",
      aspectRatio: 4 / 3,
      borderRadius:
        radius.lg,
    },

    caption: {
      fontSize:
        fontSize.sm,
      lineHeight: 20,
    },

    emptyEvidence: {
      minHeight: 130,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      borderRadius:
        radius.lg,
      padding:
        spacing.lg,
    },

    emptyEvidenceText: {
      fontSize:
        fontSize.sm,
      textAlign: "center",
    },
  });

