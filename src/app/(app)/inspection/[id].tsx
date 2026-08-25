import * as ImagePicker from "expo-image-picker";
import {
  router,
  useLocalSearchParams,
} from "expo-router";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import JobStatusBadge from "@/components/jobs/JobStatusBadge";
import JobTypeBadge from "@/components/jobs/JobTypeBadge";
import JobWorkflow from "@/components/jobs/JobWorkflow";
import InspectorListState from "@/components/inspector/InspectorListState";
import AppModal from "@/components/ui/AppModal";
import ScreenContainer from "@/components/ui/ScreenContainer";
import { fontWeight } from "@/constants/theme";
import { useAuth } from "@/features/auth/use-auth";
import {
  getWorkerJobAction,
} from "@/features/jobs/job.actions";
import {
  formatJobDate,
  formatJobTime,
} from "@/features/jobs/job.helpers";
import {
  useRunWorkerJobAction,
  useWorkerJobDetail,
} from "@/features/jobs/use-worker-jobs";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
  callPhone,
  openExternalNavigation,
} from "@/services/location/navigation";
import {
  deleteInspectionImage,
  fetchInspectionReport,
  saveInspectionReport,
  submitInspectionReport,
  uploadInspectionImage,
  type ConditionRating,
  type InspectionImage,
  type InspectionReportBundle,
  type InspectionResult,
} from "@/services/inspection/inspection-report.service";

import { showFeedbackToast } from "@/features/toast/toast-store";
import { toastSuccess } from "@/features/toast/toast-store";
type ConditionKey =
  | "body"
  | "tyres"
  | "brakes"
  | "engine"
  | "interior"
  | "lights";

type Conditions = Record<
  ConditionKey,
  ConditionRating
>;

const INITIAL_CONDITIONS: Conditions = {
  body: "not_checked",
  tyres: "not_checked",
  brakes: "not_checked",
  engine: "not_checked",
  interior: "not_checked",
  lights: "not_checked",
};

const CONDITION_OPTIONS: Array<{
  value: ConditionRating;
  label: string;
}> = [
  {
    value: "excellent",
    label: "Excellent",
  },
  {
    value: "good",
    label: "Good",
  },
  {
    value: "fair",
    label: "Fair",
  },
  {
    value: "poor",
    label: "Poor",
  },
];

const RESULT_OPTIONS: Array<{
  value: InspectionResult;
  label: string;
}> = [
  {
    value: "passed",
    label: "Passed",
  },
  {
    value:
      "passed_with_advisories",
    label: "Passed + advisories",
  },
  {
    value:
      "attention_required",
    label: "Attention required",
  },
  {
    value: "not_suitable",
    label: "Not suitable",
  },
];

export default function InspectionWorkspaceScreen() {
  const theme = useAppTheme();
  const insets =
    useSafeAreaInsets();

  const {
    id,
  } =
    useLocalSearchParams<{
      id: string;
    }>();

  const { profile } = useAuth();

  const [
    message,
    setMessageState,
  ] =
    useState<{
      title: string;
      text: string;
    } | null>(null);

  const setMessage = (
    next: {
      title: string;
      text: string;
    } | null,
  ) => {
    /**
     * Existing screen code can keep calling setMessage(...).
     * Informational feedback now becomes the global toast,
     * while the old modal state stays closed.
     */
    setMessageState(null);

    if (next) {
      showFeedbackToast(
        next.title,
        next.text,
      );
    }
  };

  const [
    conditions,
    setConditions,
  ] =
    useState<Conditions>(
      INITIAL_CONDITIONS,
    );

  const [
    overallResult,
    setOverallResult,
  ] =
    useState<
      InspectionResult | null
    >(null);

  const [
    mileageChecked,
    setMileageChecked,
  ] = useState(false);

  const [
    registrationChecked,
    setRegistrationChecked,
  ] = useState(false);

  const [
    summary,
    setSummary,
  ] = useState("");

  const [
    notes,
    setNotes,
  ] = useState("");

  const [
    reportBundle,
    setReportBundle,
  ] =
    useState<InspectionReportBundle>({
      report: null,
      images: [],
    });

  const [
    reportLoading,
    setReportLoading,
  ] = useState(false);

  const [
    saveLoading,
    setSaveLoading,
  ] = useState(false);

  const [
    photoLoading,
    setPhotoLoading,
  ] = useState(false);

  const [
    submitLoading,
    setSubmitLoading,
  ] = useState(false);

  const hydratedReportId =
    useRef<string | null>(
      null,
    );

  const {
    data: job,
    isLoading,
    isError,
    refetch,
  } = useWorkerJobDetail(
    profile?.id,
    id,
  );

  const actionMutation =
    useRunWorkerJobAction(
      profile?.id,
    );

  const requestId =
    job?.kind ===
    "inspection"
      ? job.jobId
      : undefined;

  const editable =
    job?.status ===
    "inspection_in_progress";

  const submitted =
    job?.status ===
      "report_submitted" ||
    job?.status ===
      "completed";

  const loadReport =
    async (
      showSpinner = true,
    ) => {
      if (!requestId) {
        return;
      }

      if (showSpinner) {
        setReportLoading(true);
      }

      try {
        const bundle =
          await fetchInspectionReport(
            requestId,
          );

        setReportBundle(
          bundle,
        );
      } catch (error) {
        setMessage({
          title:
            "Report load failed",
          text:
            error instanceof Error
              ? error.message
              : "The saved inspection report could not be loaded.",
        });
      } finally {
        if (showSpinner) {
          setReportLoading(false);
        }
      }
    };

  useEffect(() => {
    if (!requestId) {
      return;
    }

    void loadReport();
  }, [requestId]);

  useEffect(() => {
    const report =
      reportBundle.report;

    if (
      !report ||
      hydratedReportId.current ===
        report.id
    ) {
      return;
    }

    hydratedReportId.current =
      report.id;

    setOverallResult(
      report.overallResult,
    );

    setConditions(
      (current) => ({
        ...current,

        body:
          report.bodyCondition,

        tyres:
          report.tyreCondition,

        interior:
          report.interiorCondition,

        engine:
          report.engineCondition,

        brakes:
          report.brakesCondition,

        /**
         * Existing RPC does not persist lights /
         * additional_checks yet. Keep the UI value
         * at not_checked instead of pretending it
         * was saved.
         */
        lights:
          "not_checked",
      }),
    );

    setMileageChecked(
      report.mileageChecked,
    );

    setRegistrationChecked(
      report.registrationChecked,
    );

    setSummary(
      report.summary ?? "",
    );

    setNotes(
      report.inspectorNotes ??
        "",
    );
  }, [
    reportBundle.report,
  ]);

  const completedChecks =
    useMemo(() => {
      return (
        Object.values(
          conditions,
        ).filter(
          (value) =>
            value !==
            "not_checked",
        ).length +
        Number(mileageChecked) +
        Number(
          registrationChecked,
        )
      );
    }, [
      conditions,
      mileageChecked,
      registrationChecked,
    ]);

  if (isLoading) {
    return (
      <ScreenContainer>
        <InspectorListState
          loading
          title="Loading inspection"
          message="Getting the latest inspection details."
        />
      </ScreenContainer>
    );
  }

  if (
    isError ||
    !job ||
    job.kind !== "inspection"
  ) {
    return (
      <ScreenContainer>
        <InspectorListState
          title="Couldn't load inspection"
          message="This inspection job could not be loaded."
          onRetry={() => {
            void refetch();
          }}
        />
      </ScreenContainer>
    );
  }

  const action =
    getWorkerJobAction(job);

  const appointment =
    formatJobDate(
      job.scheduledDate,
    ) +
    " · " +
    formatJobTime(
      job.scheduledTime,
    );

  const startInspection =
    async () => {
      if (
        !action ||
        action.type !==
          "inspection" ||
        actionMutation.isPending
      ) {
        return;
      }

      try {
        await actionMutation.mutateAsync({
          job,
        });

        await refetch();
      } catch (error) {
        setMessage({
          title:
            "Inspection update failed",
          text:
            error instanceof Error
              ? error.message
              : "The inspection could not be started.",
        });
      }
    };

  const buildSaveInput =
    () => ({
      verificationRequestId:
        job.jobId,

      overallResult,

      summary,
      notes,

      body:
        conditions.body,

      tyres:
        conditions.tyres,

      interior:
        conditions.interior,

      engine:
        conditions.engine,

      brakes:
        conditions.brakes,

      mileageChecked,
      registrationChecked,
    });

  const saveDraft =
    async ({
      silent = false,
    }: {
      silent?: boolean;
    } = {}) => {
      if (!editable) {
        throw new Error(
          "This inspection report is no longer editable.",
        );
      }

      setSaveLoading(true);

      try {
        const reportId =
          await saveInspectionReport(
            buildSaveInput(),
          );

        await loadReport(false);

        if (!silent) {
          setMessage({
            title:
              "Draft saved",
            text:
              "The inspection report has been saved to Fengxing.",
          });
        }

        return reportId;
      } catch (error) {
        if (!silent) {
          setMessage({
            title:
              "Save failed",
            text:
              error instanceof Error
                ? error.message
                : "The inspection report could not be saved.",
          });
        }

        throw error;
      } finally {
        setSaveLoading(false);
      }
    };

  const choosePhoto =
    async (
      source:
        | "camera"
        | "library",
    ) => {
      if (!editable) {
        return;
      }

      try {
        if (
          source ===
          "camera"
        ) {
          const permission =
            await ImagePicker.requestCameraPermissionsAsync();

          if (
            !permission.granted
          ) {
            setMessage({
              title:
                "Camera permission required",
              text:
                "Allow camera access to capture inspection evidence.",
            });

            return;
          }
        } else {
          const permission =
            await ImagePicker.requestMediaLibraryPermissionsAsync();

          if (
            !permission.granted
          ) {
            setMessage({
              title:
                "Photo permission required",
              text:
                "Allow photo access to select inspection evidence.",
            });

            return;
          }
        }

        const result =
          source === "camera"
            ? await ImagePicker.launchCameraAsync({
                mediaTypes:
                  ImagePicker.MediaTypeOptions.Images,

                quality: 0.72,
                allowsEditing: false,
              })
            : await ImagePicker.launchImageLibraryAsync({
                mediaTypes:
                  ImagePicker.MediaTypeOptions.Images,

                quality: 0.72,
                allowsMultipleSelection:
                  false,
              });

        if (
          result.canceled ||
          result.assets.length ===
            0
        ) {
          return;
        }

        const asset =
          result.assets[0];

        setPhotoLoading(true);

        /**
         * Storage RLS requires an inspection_reports
         * row to exist first, so auto-save the current
         * draft before uploading evidence.
         */
        const reportId =
          reportBundle.report?.id ??
          (await saveDraft({
            silent: true,
          }));

        await uploadInspectionImage({
          verificationRequestId:
            job.jobId,

          inspectionReportId:
            reportId,

          uri:
            asset.uri,

          fileName:
            asset.fileName,

          mimeType:
            asset.mimeType,

          sortOrder:
            reportBundle.images
              .length,
        });

        await loadReport(false);

        toastSuccess(
          "Inspection photo uploaded.",
        );
      } catch (error) {
        setMessage({
          title:
            "Photo upload failed",
          text:
            error instanceof Error
              ? error.message
              : "The inspection photo could not be uploaded.",
        });
      } finally {
        setPhotoLoading(false);
      }
    };

  const removePhoto =
    async (
      image: InspectionImage,
    ) => {
      if (!editable) {
        return;
      }

      setPhotoLoading(true);

      try {
        await deleteInspectionImage(
          image,
        );

        await loadReport(false);

        toastSuccess(
          "Inspection photo deleted.",
        );
      } catch (error) {
        setMessage({
          title:
            "Photo delete failed",
          text:
            error instanceof Error
              ? error.message
              : "The inspection photo could not be deleted.",
        });
      } finally {
        setPhotoLoading(false);
      }
    };

  const validateSubmission =
    () => {
      if (!overallResult) {
        return "Select the overall inspection result.";
      }

      if (
        summary.trim().length <
        20
      ) {
        return "Add an inspection summary of at least 20 characters.";
      }

      const required:
        Array<
          [
            string,
            ConditionRating,
          ]
        > = [
          [
            "Body",
            conditions.body,
          ],
          [
            "Tyres",
            conditions.tyres,
          ],
          [
            "Brakes",
            conditions.brakes,
          ],
          [
            "Engine",
            conditions.engine,
          ],
          [
            "Interior",
            conditions.interior,
          ],
        ];

      const missing =
        required.find(
          ([, value]) =>
            value ===
            "not_checked",
        );

      if (missing) {
        return (
          "Complete the " +
          missing[0] +
          " condition check."
        );
      }

      if (!mileageChecked) {
        return "Confirm that mileage was checked.";
      }

      if (
        !registrationChecked
      ) {
        return "Confirm that registration was checked.";
      }

      if (
        reportBundle.images
          .length === 0
      ) {
        return "Add at least one inspection evidence photo.";
      }

      return null;
    };

  const submitReport =
    async () => {
      if (!editable) {
        return;
      }

      const validation =
        validateSubmission();

      if (validation) {
        setMessage({
          title:
            "Report incomplete",
          text: validation,
        });

        return;
      }

      setSubmitLoading(true);

      try {
        /**
         * Always save the latest form values immediately
         * before submission.
         */
        await saveInspectionReport(
          buildSaveInput(),
        );

        await submitInspectionReport(
          job.jobId,
        );

        await Promise.all([
          refetch(),
          loadReport(false),
        ]);

        setMessage({
          title:
            "Report submitted",
          text:
            "The inspection report has been submitted. An admin will finalise the verification.",
        });
      } catch (error) {
        setMessage({
          title:
            "Submit failed",
          text:
            error instanceof Error
              ? error.message
              : "The inspection report could not be submitted.",
        });
      } finally {
        setSubmitLoading(false);
      }
    };

  return (
    <>
      <ScreenContainer>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : "height"
          }
        >
          <View style={styles.screen}>
            <ScrollView
              contentContainerStyle={[
                styles.content,
                {
                  paddingBottom:
                    action &&
                    action.type ===
                      "inspection"
                      ? 120 +
                        Math.max(
                          insets.bottom,
                          8,
                        )
                      : 42,
                },
              ]}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="none"
              showsVerticalScrollIndicator={
                false
              }
            >
              <View style={styles.topBar}>
                <Pressable
                  hitSlop={12}
                  onPress={() =>
                    router.back()
                  }
                  style={({ pressed }) => [
                    styles.backButton,
                    pressed && {
                      opacity: 0.55,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.backText,
                      {
                        color:
                          theme.primary,
                      },
                    ]}
                  >
                    ‹ Back
                  </Text>
                </Pressable>

                <JobStatusBadge
                  status={job.status}
                />
              </View>

              <View style={styles.hero}>
                <JobTypeBadge
                  kind="inspection"
                />

                <Text
                  style={[
                    styles.title,
                    {
                      color: theme.text,
                    },
                  ]}
                >
                  {job.vehicleLabel}
                </Text>

                <View
                  style={
                    styles.heroMeta
                  }
                >
                  {job.registration ? (
                    <Text
                      style={[
                        styles.registration,
                        {
                          color:
                            theme.text,
                        },
                      ]}
                    >
                      {job.registration.toUpperCase()}
                    </Text>
                  ) : null}

                  <Text
                    style={[
                      styles.inspectionLabel,
                      {
                        color:
                          theme.textSecondary,
                      },
                    ]}
                  >
                    Vehicle inspection
                  </Text>
                </View>
              </View>

              <Divider />

              <JobWorkflow
                job={job}
              />

              <Divider />

              <View
                style={
                  styles.infoGrid
                }
              >
                <InfoBlock
                  eyebrow="APPOINTMENT"
                  value={appointment}
                />

                <InfoBlock
                  eyebrow="CONTACT"
                  value={
                    job.customerName ||
                    "Not available"
                  }
                  secondary={
                    job.customerPhone ??
                    undefined
                  }
                  onSecondaryPress={
                    job.customerPhone
                      ? () => {
                          void callPhone(
                            job.customerPhone as string,
                          );
                        }
                      : undefined
                  }
                />
              </View>

              <Divider />

              <View style={styles.section}>
                <Text
                  style={[
                    styles.sectionLabel,
                    {
                      color:
                        theme.textMuted,
                    },
                  ]}
                >
                  LOCATION
                </Text>

                <Text
                  selectable
                  style={[
                    styles.location,
                    {
                      color:
                        theme.text,
                    },
                  ]}
                >
                  {job.address ||
                    "Location not available"}
                </Text>

                <View
                  style={
                    styles.inlineActions
                  }
                >
                  {job.address ? (
                    <TextAction
                      label="Open navigation"
                      onPress={() => {
                        void openExternalNavigation(
                          job.address,
                        );
                      }}
                    />
                  ) : null}

                  {job.customerPhone ? (
                    <TextAction
                      label="Call contact"
                      onPress={() => {
                        void callPhone(
                          job.customerPhone as string,
                        );
                      }}
                    />
                  ) : null}
                </View>
              </View>

              {reportLoading ? (
                <>
                  <Divider />

                  <View
                    style={
                      styles.loadingReport
                    }
                  >
                    <ActivityIndicator
                      size="small"
                      color={
                        theme.primary
                      }
                    />

                    <Text
                      style={[
                        styles.helperText,
                        {
                          color:
                            theme.textSecondary,
                        },
                      ]}
                    >
                      Loading saved report…
                    </Text>
                  </View>
                </>
              ) : null}

              {editable ||
              submitted ? (
                <>
                  <Divider />

                  <View style={styles.section}>
                    {submitted ? (
                      <View
                        style={[
                          styles.submittedBanner,
                          {
                            borderColor:
                              theme.border,
                            backgroundColor:
                              theme.surface,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.submittedTitle,
                            {
                              color:
                                theme.text,
                            },
                          ]}
                        >
                          Report submitted
                        </Text>

                        <Text
                          style={[
                            styles.submittedText,
                            {
                              color:
                                theme.textSecondary,
                            },
                          ]}
                        >
                          This report is read-only while it waits for admin finalisation.
                        </Text>
                      </View>
                    ) : null}

                    <View
                      style={
                        styles.sectionHeadingRow
                      }
                    >
                      <View style={styles.flex}>
                        <Text
                          style={[
                            styles.sectionLabel,
                            {
                              color:
                                theme.textMuted,
                            },
                          ]}
                        >
                          INSPECTION CHECKLIST
                        </Text>

                        <Text
                          style={[
                            styles.sectionTitle,
                            {
                              color:
                                theme.text,
                            },
                          ]}
                        >
                          Vehicle condition
                        </Text>
                      </View>

                      <Text
                        style={[
                          styles.progressText,
                          {
                            color:
                              theme.textSecondary,
                          },
                        ]}
                      >
                        {completedChecks}/8
                      </Text>
                    </View>

                    <ConditionRow
                      label="Body"
                      value={
                        conditions.body
                      }
                      disabled={
                        !editable
                      }
                      onChange={(value) =>
                        setConditions(
                          (current) => ({
                            ...current,
                            body: value,
                          }),
                        )
                      }
                    />

                    <ConditionRow
                      label="Tyres"
                      value={
                        conditions.tyres
                      }
                      disabled={
                        !editable
                      }
                      onChange={(value) =>
                        setConditions(
                          (current) => ({
                            ...current,
                            tyres: value,
                          }),
                        )
                      }
                    />

                    <ConditionRow
                      label="Brakes"
                      value={
                        conditions.brakes
                      }
                      disabled={
                        !editable
                      }
                      onChange={(value) =>
                        setConditions(
                          (current) => ({
                            ...current,
                            brakes: value,
                          }),
                        )
                      }
                    />

                    <ConditionRow
                      label="Engine"
                      value={
                        conditions.engine
                      }
                      disabled={
                        !editable
                      }
                      onChange={(value) =>
                        setConditions(
                          (current) => ({
                            ...current,
                            engine: value,
                          }),
                        )
                      }
                    />

                    <ConditionRow
                      label="Interior"
                      value={
                        conditions.interior
                      }
                      disabled={
                        !editable
                      }
                      onChange={(value) =>
                        setConditions(
                          (current) => ({
                            ...current,
                            interior: value,
                          }),
                        )
                      }
                    />

                    <ConditionRow
                      label="Lights"
                      value={
                        conditions.lights
                      }
                      disabled={
                        !editable
                      }
                      onChange={(value) =>
                        setConditions(
                          (current) => ({
                            ...current,
                            lights: value,
                          }),
                        )
                      }
                    />

                    <Text
                      style={[
                        styles.backendNote,
                        {
                          color:
                            theme.textMuted,
                        },
                      ]}
                    >
                      Lights are visible in the mobile checklist, but the current backend RPC has no lights/additional_checks parameter yet.
                    </Text>
                  </View>

                  <Divider />

                  <View style={styles.section}>
                    <Text
                      style={[
                        styles.sectionLabel,
                        {
                          color:
                            theme.textMuted,
                        },
                      ]}
                    >
                      VERIFICATION
                    </Text>

                    <BinaryCheckRow
                      label="Mileage checked"
                      checked={
                        mileageChecked
                      }
                      disabled={
                        !editable
                      }
                      onPress={() =>
                        setMileageChecked(
                          (current) =>
                            !current,
                        )
                      }
                    />

                    <BinaryCheckRow
                      label="Registration checked"
                      checked={
                        registrationChecked
                      }
                      disabled={
                        !editable
                      }
                      onPress={() =>
                        setRegistrationChecked(
                          (current) =>
                            !current,
                        )
                      }
                    />
                  </View>

                  <Divider />

                  <View style={styles.section}>
                    <Text
                      style={[
                        styles.sectionLabel,
                        {
                          color:
                            theme.textMuted,
                        },
                      ]}
                    >
                      OVERALL RESULT
                    </Text>

                    <View
                      style={
                        styles.resultWrap
                      }
                    >
                      {RESULT_OPTIONS.map(
                        (option) => (
                          <ChoiceButton
                            key={
                              option.value
                            }
                            label={
                              option.label
                            }
                            active={
                              overallResult ===
                              option.value
                            }
                            disabled={
                              !editable
                            }
                            onPress={() =>
                              setOverallResult(
                                option.value,
                              )
                            }
                          />
                        ),
                      )}
                    </View>
                  </View>

                  <Divider />

                  <View style={styles.section}>
                    <Text
                      style={[
                        styles.sectionLabel,
                        {
                          color:
                            theme.textMuted,
                        },
                      ]}
                    >
                      REPORT
                    </Text>

                    <TextInput
                      value={summary}
                      onChangeText={
                        setSummary
                      }
                      editable={editable}
                      placeholder="Summarise the overall vehicle condition..."
                      placeholderTextColor={
                        theme.textMuted
                      }
                      selectionColor={
                        theme.primary
                      }
                      multiline
                      textAlignVertical="top"
                      style={[
                        styles.textArea,
                        {
                          color:
                            theme.text,
                          borderColor:
                            theme.inputBorder,
                          backgroundColor:
                            theme.surface,
                        },
                      ]}
                    />

                    <Text
                      style={[
                        styles.fieldLabel,
                        {
                          color:
                            theme.textSecondary,
                        },
                      ]}
                    >
                      Inspector notes
                    </Text>

                    <TextInput
                      value={notes}
                      onChangeText={
                        setNotes
                      }
                      editable={editable}
                      placeholder="Add any additional observations..."
                      placeholderTextColor={
                        theme.textMuted
                      }
                      selectionColor={
                        theme.primary
                      }
                      multiline
                      textAlignVertical="top"
                      style={[
                        styles.textArea,
                        styles.notesArea,
                        {
                          color:
                            theme.text,
                          borderColor:
                            theme.inputBorder,
                          backgroundColor:
                            theme.surface,
                        },
                      ]}
                    />

                    {editable ? (
                      <Pressable
                        disabled={
                          saveLoading ||
                          submitLoading
                        }
                        onPress={() => {
                          void saveDraft();
                        }}
                        style={({ pressed }) => [
                          styles.secondaryButton,
                          {
                            borderColor:
                              theme.primary,
                          },
                          pressed && {
                            opacity: 0.65,
                          },
                        ]}
                      >
                        {saveLoading ? (
                          <ActivityIndicator
                            size="small"
                            color={
                              theme.primary
                            }
                          />
                        ) : (
                          <Text
                            style={[
                              styles.secondaryButtonText,
                              {
                                color:
                                  theme.primary,
                              },
                            ]}
                          >
                            Save draft
                          </Text>
                        )}
                      </Pressable>
                    ) : null}
                  </View>

                  <Divider />

                  <View style={styles.section}>
                    <Text
                      style={[
                        styles.sectionLabel,
                        {
                          color:
                            theme.textMuted,
                        },
                      ]}
                    >
                      PHOTO EVIDENCE
                    </Text>

                    <Text
                      style={[
                        styles.sectionTitle,
                        {
                          color:
                            theme.text,
                        },
                      ]}
                    >
                      Inspection photos
                    </Text>

                    {editable ? (
                      <View
                        style={
                          styles.photoActions
                        }
                      >
                        <Pressable
                          disabled={
                            photoLoading
                          }
                          onPress={() => {
                            void choosePhoto(
                              "camera",
                            );
                          }}
                          style={({ pressed }) => [
                            styles.photoAction,
                            {
                              borderColor:
                                theme.border,
                            },
                            pressed && {
                              opacity: 0.65,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.photoActionText,
                              {
                                color:
                                  theme.text,
                              },
                            ]}
                          >
                            Take photo
                          </Text>
                        </Pressable>

                        <Pressable
                          disabled={
                            photoLoading
                          }
                          onPress={() => {
                            void choosePhoto(
                              "library",
                            );
                          }}
                          style={({ pressed }) => [
                            styles.photoAction,
                            {
                              borderColor:
                                theme.border,
                            },
                            pressed && {
                              opacity: 0.65,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.photoActionText,
                              {
                                color:
                                  theme.text,
                              },
                            ]}
                          >
                            Choose photo
                          </Text>
                        </Pressable>
                      </View>
                    ) : null}

                    {photoLoading ? (
                      <View
                        style={
                          styles.photoLoading
                        }
                      >
                        <ActivityIndicator
                          size="small"
                          color={
                            theme.primary
                          }
                        />

                        <Text
                          style={[
                            styles.helperText,
                            {
                              color:
                                theme.textSecondary,
                            },
                          ]}
                        >
                          Updating evidence…
                        </Text>
                      </View>
                    ) : null}

                    {reportBundle.images
                      .length === 0 ? (
                      <Text
                        style={[
                          styles.helperText,
                          {
                            color:
                              theme.textSecondary,
                          },
                        ]}
                      >
                        At least one evidence photo is required before submission.
                      </Text>
                    ) : (
                      <View
                        style={
                          styles.photoGrid
                        }
                      >
                        {reportBundle.images.map(
                          (image) => (
                            <View
                              key={
                                image.id
                              }
                              style={
                                styles.photoItem
                              }
                            >
                              {image.signedUrl ? (
                                <Image
                                  source={{
                                    uri:
                                      image.signedUrl,
                                  }}
                                  resizeMode="cover"
                                  style={
                                    styles.photo
                                  }
                                />
                              ) : (
                                <View
                                  style={[
                                    styles.photo,
                                    styles.photoUnavailable,
                                    {
                                      backgroundColor:
                                        theme.surface,
                                    },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.photoUnavailableText,
                                      {
                                        color:
                                          theme.textMuted,
                                      },
                                    ]}
                                  >
                                    Preview unavailable
                                  </Text>
                                </View>
                              )}

                              {editable ? (
                                <Pressable
                                  onPress={() => {
                                    void removePhoto(
                                      image,
                                    );
                                  }}
                                  style={({ pressed }) => [
                                    styles.deletePhoto,
                                    {
                                      backgroundColor:
                                        theme.background,
                                      borderColor:
                                        theme.border,
                                    },
                                    pressed && {
                                      opacity: 0.65,
                                    },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.deletePhotoText,
                                      {
                                        color:
                                          theme.primary,
                                      },
                                    ]}
                                  >
                                    Delete
                                  </Text>
                                </Pressable>
                              ) : null}
                            </View>
                          ),
                        )}
                      </View>
                    )}
                  </View>

                  {editable ? (
                    <>
                      <Divider />

                      <View
                        style={
                          styles.submitSection
                        }
                      >
                        <Pressable
                          disabled={
                            submitLoading ||
                            saveLoading ||
                            photoLoading
                          }
                          onPress={() => {
                            void submitReport();
                          }}
                          style={({ pressed }) => [
                            styles.primaryButton,
                            {
                              backgroundColor:
                                theme.action,
                            },
                            pressed && {
                              opacity: 0.8,
                            },
                            submitLoading && {
                              opacity: 0.6,
                            },
                          ]}
                        >
                          {submitLoading ? (
                            <ActivityIndicator
                              size="small"
                              color={theme.actionText}
                            />
                          ) : (
                            <Text style={[styles.primaryButtonText, { color: theme.actionText }]}>
                              Submit report
                            </Text>
                          )}
                        </Pressable>

                        <Text
                          style={[
                            styles.submitHelp,
                            {
                              color:
                                theme.textMuted,
                            },
                          ]}
                        >
                          Submission sends the report for admin finalisation. It does not mark the inspection completed yet.
                        </Text>
                      </View>
                    </>
                  ) : null}
                </>
              ) : null}
            </ScrollView>

            {action &&
            action.type ===
              "inspection" ? (
              <View
                style={[
                  styles.footer,
                  {
                    backgroundColor:
                      theme.background,
                    borderTopColor:
                      theme.border,
                    paddingBottom:
                      Math.max(
                        insets.bottom,
                        10,
                      ),
                  },
                ]}
              >
                <Pressable
                  disabled={
                    actionMutation.isPending
                  }
                  onPress={() => {
                    void startInspection();
                  }}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    {
                      backgroundColor:
                        theme.action,
                    },
                    pressed && {
                      opacity: 0.8,
                    },
                  ]}
                >
                  {actionMutation.isPending ? (
                    <ActivityIndicator
                      size="small"
                      color={theme.actionText}
                    />
                  ) : (
                    <Text style={[styles.primaryButtonText, { color: theme.actionText }]}>
                      {action.label}
                    </Text>
                  )}
                </Pressable>
              </View>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </ScreenContainer>

      <AppModal
        visible={Boolean(message)}
        title={
          message?.title ??
          ""
        }
        message={
          message?.text
        }
        onClose={() =>
          setMessage(null)
        }
      />
    </>
  );
}

function Divider() {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.divider,
        {
          backgroundColor:
            theme.border,
        },
      ]}
    />
  );
}

function InfoBlock({
  eyebrow,
  value,
  secondary,
  onSecondaryPress,
}: {
  eyebrow: string;
  value: string;
  secondary?: string;
  onSecondaryPress?: () => void;
}) {
  const theme = useAppTheme();

  return (
    <View style={styles.infoBlock}>
      <Text
        style={[
          styles.sectionLabel,
          {
            color:
              theme.textMuted,
          },
        ]}
      >
        {eyebrow}
      </Text>

      <Text
        style={[
          styles.infoValue,
          {
            color:
              theme.text,
          },
        ]}
      >
        {value}
      </Text>

      {secondary ? (
        onSecondaryPress ? (
          <Pressable
            onPress={
              onSecondaryPress
            }
          >
            <Text
              style={[
                styles.infoSecondary,
                {
                  color:
                    theme.primary,
                },
              ]}
            >
              {secondary}
            </Text>
          </Pressable>
        ) : (
          <Text
            style={[
              styles.infoSecondary,
              {
                color:
                  theme.textSecondary,
              },
            ]}
          >
            {secondary}
          </Text>
        )
      ) : null}
    </View>
  );
}

function TextAction({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      hitSlop={10}
      onPress={onPress}
      style={({ pressed }) => [
        styles.textAction,
        pressed && {
          opacity: 0.55,
        },
      ]}
    >
      <Text
        style={[
          styles.textActionLabel,
          {
            color:
              theme.primary,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ConditionRow({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: ConditionRating;
  disabled: boolean;
  onChange: (
    value: ConditionRating,
  ) => void;
}) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.conditionRow,
        {
          borderBottomColor:
            theme.border,
        },
      ]}
    >
      <Text
        style={[
          styles.conditionLabel,
          {
            color:
              theme.text,
          },
        ]}
      >
        {label}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.conditionOptions
        }
      >
        {CONDITION_OPTIONS.map(
          (option) => (
            <ChoiceButton
              key={
                option.value
              }
              label={
                option.label
              }
              active={
                value ===
                option.value
              }
              disabled={
                disabled
              }
              onPress={() =>
                onChange(
                  option.value,
                )
              }
            />
          ),
        )}
      </ScrollView>
    </View>
  );
}

function ChoiceButton({
  label,
  active,
  disabled = false,
  onPress,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.choiceButton,
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
        disabled && {
          opacity: 0.72,
        },
        pressed &&
          !disabled && {
            opacity: 0.65,
          },
      ]}
    >
      <Text
        style={[
          styles.choiceText,
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

function BinaryCheckRow({
  label,
  checked,
  disabled,
  onPress,
}: {
  label: string;
  checked: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.binaryRow,
        {
          borderBottomColor:
            theme.border,
        },
        disabled && {
          opacity: 0.72,
        },
        pressed &&
          !disabled && {
            opacity: 0.65,
          },
      ]}
    >
      <Text
        style={[
          styles.conditionLabel,
          {
            color:
              theme.text,
          },
        ]}
      >
        {label}
      </Text>

      <View
        style={[
          styles.checkbox,
          {
            borderColor:
              checked
                ? theme.action
                : theme.border,

            backgroundColor:
              checked
                ? theme.action
                : "transparent",
          },
        ]}
      >
        {checked ? (
          <Text
            style={[
              styles.checkmark,
              { color: theme.actionText },
            ]}
          >
            ✓
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles =
  StyleSheet.create({
    flex: {
      flex: 1,
    },

    screen: {
      flex: 1,
    },

    content: {
      paddingTop: 16,
    },

    topBar: {
      minHeight: 42,

      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",

      gap: 16,
    },

    backButton: {
      minHeight: 36,
      justifyContent: "center",
    },

    backText: {
      fontSize: 14,
      lineHeight: 20,

      fontWeight:
        fontWeight.bold,
    },

    hero: {
      paddingTop: 22,
      paddingBottom: 26,
    },

    title: {
      marginTop: 13,

      fontSize: 31,
      lineHeight: 36,

      fontWeight:
        fontWeight.bold,

      letterSpacing: -0.85,
    },

    heroMeta: {
      marginTop: 9,

      flexDirection: "row",
      alignItems: "center",

      gap: 12,
    },

    registration: {
      fontSize: 12,
      lineHeight: 17,

      fontWeight:
        fontWeight.bold,

      letterSpacing: 0.75,
    },

    inspectionLabel: {
      fontSize: 13,
      lineHeight: 18,

      fontWeight:
        fontWeight.medium,
    },

    divider: {
      height:
        StyleSheet.hairlineWidth,
    },

    infoGrid: {
      paddingVertical: 24,

      flexDirection: "row",
      gap: 20,
    },

    infoBlock: {
      flex: 1,
      minWidth: 0,
    },

    section: {
      paddingVertical: 24,
    },

    loadingReport: {
      minHeight: 80,

      flexDirection: "row",
      alignItems: "center",

      gap: 10,
    },

    submittedBanner: {
      marginBottom: 22,

      paddingVertical: 14,
      paddingHorizontal: 15,

      borderWidth: 1,
      borderRadius: 12,
    },

    submittedTitle: {
      fontSize: 14,
      lineHeight: 20,

      fontWeight:
        fontWeight.bold,
    },

    submittedText: {
      marginTop: 4,

      fontSize: 12,
      lineHeight: 18,
    },

    sectionHeadingRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent:
        "space-between",

      gap: 16,
    },

    sectionLabel: {
      fontSize: 10,
      lineHeight: 14,

      fontWeight:
        fontWeight.bold,

      letterSpacing: 0.95,
    },

    sectionTitle: {
      marginTop: 8,

      fontSize: 17,
      lineHeight: 23,

      fontWeight:
        fontWeight.bold,
    },

    helperText: {
      marginTop: 8,

      fontSize: 13,
      lineHeight: 20,
    },

    backendNote: {
      marginTop: 10,

      fontSize: 11,
      lineHeight: 17,
    },

    progressText: {
      marginTop: 19,

      fontSize: 12,
      lineHeight: 17,

      fontWeight:
        fontWeight.bold,
    },

    infoValue: {
      marginTop: 8,

      fontSize: 15,
      lineHeight: 21,

      fontWeight:
        fontWeight.bold,
    },

    infoSecondary: {
      marginTop: 5,

      fontSize: 12,
      lineHeight: 17,

      fontWeight:
        fontWeight.medium,
    },

    location: {
      marginTop: 9,

      fontSize: 16,
      lineHeight: 23,

      fontWeight:
        fontWeight.semibold,
    },

    inlineActions: {
      marginTop: 12,

      flexDirection: "row",
      flexWrap: "wrap",

      gap: 20,
    },

    textAction: {
      minHeight: 34,
      justifyContent: "center",
    },

    textActionLabel: {
      fontSize: 13,
      lineHeight: 18,

      fontWeight:
        fontWeight.bold,
    },

    conditionRow: {
      paddingVertical: 13,

      borderBottomWidth:
        StyleSheet.hairlineWidth,
    },

    conditionLabel: {
      fontSize: 14,
      lineHeight: 20,

      fontWeight:
        fontWeight.semibold,
    },

    conditionOptions: {
      paddingTop: 10,

      gap: 7,
    },

    choiceButton: {
      minHeight: 36,

      paddingHorizontal: 11,

      alignItems: "center",
      justifyContent: "center",

      borderWidth: 1,
      borderRadius: 9,
    },

    choiceText: {
      fontSize: 11,
      lineHeight: 15,

      fontWeight:
        fontWeight.bold,
    },

    binaryRow: {
      minHeight: 58,

      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",

      borderBottomWidth:
        StyleSheet.hairlineWidth,
    },

    checkbox: {
      width: 23,
      height: 23,

      alignItems: "center",
      justifyContent: "center",

      borderWidth: 1.2,
      borderRadius: 6,
    },

    checkmark: {
      fontSize: 14,
      lineHeight: 17,

      fontWeight:
        fontWeight.bold,
    },

    resultWrap: {
      marginTop: 14,

      flexDirection: "row",
      flexWrap: "wrap",

      gap: 8,
    },

    fieldLabel: {
      marginTop: 20,
      marginBottom: 8,

      fontSize: 12,
      lineHeight: 17,

      fontWeight:
        fontWeight.semibold,
    },

    textArea: {
      minHeight: 112,

      marginTop: 14,

      paddingHorizontal: 14,
      paddingVertical: 13,

      borderWidth: 1,
      borderRadius: 12,

      fontSize: 14,
      lineHeight: 21,
    },

    notesArea: {
      minHeight: 96,
      marginTop: 0,
    },

    secondaryButton: {
      minHeight: 46,

      marginTop: 16,

      alignItems: "center",
      justifyContent: "center",

      borderWidth: 1,
      borderRadius: 11,
    },

    secondaryButtonText: {
      fontSize: 13,
      lineHeight: 18,

      fontWeight:
        fontWeight.bold,
    },

    photoActions: {
      marginTop: 15,

      flexDirection: "row",

      gap: 10,
    },

    photoAction: {
      flex: 1,

      minHeight: 46,

      alignItems: "center",
      justifyContent: "center",

      borderWidth: 1,
      borderRadius: 11,
    },

    photoActionText: {
      fontSize: 13,
      lineHeight: 18,

      fontWeight:
        fontWeight.bold,
    },

    photoLoading: {
      marginTop: 12,

      flexDirection: "row",
      alignItems: "center",

      gap: 10,
    },

    photoGrid: {
      marginTop: 15,

      flexDirection: "row",
      flexWrap: "wrap",

      gap: 10,
    },

    photoItem: {
      width: "48%",
    },

    photo: {
      width: "100%",
      aspectRatio: 1,

      borderRadius: 11,
    },

    photoUnavailable: {
      alignItems: "center",
      justifyContent: "center",
    },

    photoUnavailableText: {
      paddingHorizontal: 10,

      textAlign: "center",

      fontSize: 11,
      lineHeight: 16,
    },

    deletePhoto: {
      minHeight: 34,

      marginTop: 6,

      alignItems: "center",
      justifyContent: "center",

      borderWidth: 1,
      borderRadius: 9,
    },

    deletePhotoText: {
      fontSize: 11,
      lineHeight: 15,

      fontWeight:
        fontWeight.bold,
    },

    submitSection: {
      paddingVertical: 24,
    },

    submitHelp: {
      marginTop: 9,

      textAlign: "center",

      fontSize: 11,
      lineHeight: 17,
    },

    footer: {
      position: "absolute",

      left: 0,
      right: 0,
      bottom: 0,

      paddingTop: 12,

      borderTopWidth:
        StyleSheet.hairlineWidth,
    },

    primaryButton: {
      minHeight: 52,

      alignItems: "center",
      justifyContent: "center",

      borderRadius: 12,
    },

    primaryButtonText: {
      fontSize: 14,
      lineHeight: 19,

      fontWeight:
        fontWeight.bold,
    },
  });

