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
  deleteServiceImage,
  fetchServiceJobReport,
  saveServiceJobReport,
  uploadServiceImage,
  type ServiceEvidenceStage,
  type ServiceJobImage,
  type ServiceJobReportBundle,
} from "@/services/service/service-job-report.service";

import { showFeedbackToast } from "@/features/toast/toast-store";
import { toastSuccess } from "@/features/toast/toast-store";
export default function MobileServiceScreen() {
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
    workerNotes,
    setWorkerNotes,
  ] = useState("");

  const [
    bundle,
    setBundle,
  ] =
    useState<ServiceJobReportBundle>({
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

  const bookingId =
    job?.kind ===
    "service"
      ? job.jobId
      : undefined;

  const editable =
    job?.status ===
    "in_progress";

  const completed =
    job?.status ===
    "completed";

  const loadReport =
    async (
      showSpinner = true,
    ) => {
      if (!bookingId) {
        return;
      }

      if (showSpinner) {
        setReportLoading(true);
      }

      try {
        const next =
          await fetchServiceJobReport(
            bookingId,
          );

        setBundle(next);
      } catch (error) {
        setMessage({
          title:
            "Service evidence failed",
          text:
            error instanceof Error
              ? error.message
              : "The saved service evidence could not be loaded.",
        });
      } finally {
        if (showSpinner) {
          setReportLoading(false);
        }
      }
    };

  useEffect(() => {
    if (!bookingId) {
      return;
    }

    void loadReport();
  }, [bookingId]);

  useEffect(() => {
    const report =
      bundle.report;

    if (
      !report ||
      hydratedReportId.current ===
        report.id
    ) {
      return;
    }

    hydratedReportId.current =
      report.id;

    setWorkerNotes(
      report.workerNotes ?? "",
    );
  }, [bundle.report]);

  const beforeImages =
    useMemo(
      () =>
        bundle.images.filter(
          (image) =>
            image.stage ===
            "before",
        ),
      [bundle.images],
    );

  const afterImages =
    useMemo(
      () =>
        bundle.images.filter(
          (image) =>
            image.stage ===
            "after",
        ),
      [bundle.images],
    );

  if (isLoading) {
    return (
      <ScreenContainer>
        <InspectorListState
          loading
          title="Loading service"
          message="Getting the latest service details."
        />
      </ScreenContainer>
    );
  }

  if (
    isError ||
    !job ||
    job.kind !== "service"
  ) {
    return (
      <ScreenContainer>
        <InspectorListState
          title="Couldn't load service"
          message="This mobile service job could not be loaded."
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

  const saveNotes =
    async ({
      silent = false,
    }: {
      silent?: boolean;
    } = {}) => {
      if (!editable) {
        throw new Error(
          "This service job is not currently editable.",
        );
      }

      setSaveLoading(true);

      try {
        const reportId =
          await saveServiceJobReport(
            job.jobId,
            workerNotes,
          );

        await loadReport(false);

        if (!silent) {
          setMessage({
            title:
              "Notes saved",
            text:
              "Worker notes have been saved to Fengxing.",
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
                : "Worker notes could not be saved.",
          });
        }

        throw error;
      } finally {
        setSaveLoading(false);
      }
    };

  const choosePhoto =
    async (
      stage: ServiceEvidenceStage,
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
                "Allow camera access to capture service evidence.",
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
                "Allow photo access to select service evidence.",
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
         * The private storage policy requires
         * service_job_reports to exist first.
         */
        const reportId =
          bundle.report?.id ??
          (await saveNotes({
            silent: true,
          }));

        const stageCount =
          stage === "before"
            ? beforeImages.length
            : afterImages.length;

        await uploadServiceImage({
          serviceBookingId:
            job.jobId,

          serviceJobReportId:
            reportId,

          uri:
            asset.uri,

          fileName:
            asset.fileName,

          mimeType:
            asset.mimeType,

          stage,
          sortOrder:
            stageCount,
        });

        await loadReport(false);

        toastSuccess(
          stage === "before"
            ? "Before-service photo uploaded."
            : "After-service photo uploaded.",
        );
      } catch (error) {
        setMessage({
          title:
            "Photo upload failed",
          text:
            error instanceof Error
              ? error.message
              : "The service photo could not be uploaded.",
        });
      } finally {
        setPhotoLoading(false);
      }
    };

  const removePhoto =
    async (
      image: ServiceJobImage,
    ) => {
      if (!editable) {
        return;
      }

      setPhotoLoading(true);

      try {
        await deleteServiceImage(
          image,
        );

        await loadReport(false);

        toastSuccess(
          "Service photo deleted.",
        );
      } catch (error) {
        setMessage({
          title:
            "Photo delete failed",
          text:
            error instanceof Error
              ? error.message
              : "The service photo could not be deleted.",
        });
      } finally {
        setPhotoLoading(false);
      }
    };

  const runAction =
    async () => {
      if (
        !action ||
        action.type !== "service" ||
        actionMutation.isPending
      ) {
        return;
      }

      /**
       * Service completion requires both evidence stages
       * in the mobile workflow.
       */
      if (
        action.target ===
        "completed"
      ) {
        if (
          beforeImages.length ===
          0
        ) {
          setMessage({
            title:
              "Before photo required",
            text:
              "Add at least one before-service photo before completing the job.",
          });

          return;
        }

        if (
          afterImages.length ===
          0
        ) {
          setMessage({
            title:
              "After photo required",
            text:
              "Add at least one after-service photo before completing the job.",
          });

          return;
        }

        try {
          await saveServiceJobReport(
            job.jobId,
            workerNotes,
          );
        } catch (error) {
          setMessage({
            title:
              "Notes save failed",
            text:
              error instanceof Error
                ? error.message
                : "The latest worker notes could not be saved.",
          });

          return;
        }
      }

      try {
        await actionMutation.mutateAsync({
          job,
        });

        await refetch();

        /**
         * Start job changes assignment to in_progress.
         * Refresh the evidence area once that transition
         * has completed.
         */
        if (
          action.target ===
          "in_progress"
        ) {
          await loadReport(false);
        }

        if (
          action.target ===
          "completed"
        ) {
          router.back();
        }
      } catch (error) {
        setMessage({
          title:
            "Service update failed",
          text:
            error instanceof Error
              ? error.message
              : "The service status could not be updated.",
        });
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
                      "service"
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
                  kind="service"
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
                      styles.serviceName,
                      {
                        color:
                          theme.textSecondary,
                      },
                    ]}
                  >
                    {job.title}
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
                  eyebrow="CUSTOMER"
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
                      label="Call customer"
                      onPress={() => {
                        void callPhone(
                          job.customerPhone as string,
                        );
                      }}
                    />
                  ) : null}
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
                  BOOKING NOTES
                </Text>

                <Text
                  style={[
                    styles.bookingNotes,
                    {
                      color:
                        job.notes
                          ? theme.textSecondary
                          : theme.textMuted,
                    },
                  ]}
                >
                  {job.notes ||
                    "No booking notes were provided."}
                </Text>
              </View>

              {reportLoading ? (
                <>
                  <Divider />

                  <View
                    style={
                      styles.loadingRow
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
                      Loading service evidence…
                    </Text>
                  </View>
                </>
              ) : null}

              {editable ||
              completed ? (
                <>
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
                      WORKER NOTES
                    </Text>

                    <TextInput
                      value={
                        workerNotes
                      }
                      onChangeText={
                        setWorkerNotes
                      }
                      editable={
                        editable
                      }
                      placeholder="Add work completed, issues found, parts used or follow-up notes..."
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

                    {editable ? (
                      <Pressable
                        disabled={
                          saveLoading
                        }
                        onPress={() => {
                          void saveNotes();
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
                            Save notes
                          </Text>
                        )}
                      </Pressable>
                    ) : null}
                  </View>

                  <Divider />

                  <EvidenceSection
                    title="Before service"
                    help="Capture the vehicle condition before carrying out the service."
                    stage="before"
                    images={
                      beforeImages
                    }
                    editable={
                      editable
                    }
                    busy={
                      photoLoading
                    }
                    onCamera={() => {
                      void choosePhoto(
                        "before",
                        "camera",
                      );
                    }}
                    onLibrary={() => {
                      void choosePhoto(
                        "before",
                        "library",
                      );
                    }}
                    onDelete={
                      removePhoto
                    }
                  />

                  <Divider />

                  <EvidenceSection
                    title="After service"
                    help="Capture the completed work and final vehicle condition."
                    stage="after"
                    images={
                      afterImages
                    }
                    editable={
                      editable
                    }
                    busy={
                      photoLoading
                    }
                    onCamera={() => {
                      void choosePhoto(
                        "after",
                        "camera",
                      );
                    }}
                    onLibrary={() => {
                      void choosePhoto(
                        "after",
                        "library",
                      );
                    }}
                    onDelete={
                      removePhoto
                    }
                  />
                </>
              ) : (
                <>
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
                      FIELD EVIDENCE
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
                      Available after Start job
                    </Text>

                    <Text
                      style={[
                        styles.helperText,
                        {
                          color:
                            theme.textSecondary,
                        },
                      ]}
                    >
                      Once the job is in progress, add worker notes plus before and after service photos here.
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>

            {action &&
            action.type ===
              "service" ? (
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
                    void runAction();
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
                    actionMutation.isPending && {
                      opacity: 0.6,
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

function EvidenceSection({
  title,
  help,
  images,
  editable,
  busy,
  onCamera,
  onLibrary,
  onDelete,
}: {
  title: string;
  help: string;
  stage: ServiceEvidenceStage;
  images: ServiceJobImage[];
  editable: boolean;
  busy: boolean;
  onCamera: () => void;
  onLibrary: () => void;
  onDelete: (
    image: ServiceJobImage,
  ) => Promise<void>;
}) {
  const theme = useAppTheme();

  return (
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
            color: theme.text,
          },
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          styles.helperText,
          {
            color:
              theme.textSecondary,
          },
        ]}
      >
        {help}
      </Text>

      {editable ? (
        <View
          style={
            styles.photoActions
          }
        >
          <Pressable
            disabled={busy}
            onPress={onCamera}
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
            disabled={busy}
            onPress={onLibrary}
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

      {busy ? (
        <View
          style={
            styles.loadingRow
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

      {images.length === 0 ? (
        <Text
          style={[
            styles.emptyEvidence,
            {
              color:
                theme.textMuted,
            },
          ]}
        >
          No photos added yet.
        </Text>
      ) : (
        <View
          style={
            styles.photoGrid
          }
        >
          {images.map(
            (image) => (
              <View
                key={image.id}
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
                      void onDelete(
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

    serviceName: {
      flex: 1,

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
      marginTop: 7,

      fontSize: 13,
      lineHeight: 20,
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

    bookingNotes: {
      marginTop: 9,

      fontSize: 14,
      lineHeight: 21,
    },

    loadingRow: {
      minHeight: 54,

      flexDirection: "row",
      alignItems: "center",

      gap: 10,
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

    emptyEvidence: {
      marginTop: 13,

      fontSize: 12,
      lineHeight: 18,
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

