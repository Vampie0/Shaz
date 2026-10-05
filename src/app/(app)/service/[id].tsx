import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import InspectorListState from "@/components/inspector/InspectorListState";
import JobStatusBadge from "@/components/jobs/JobStatusBadge";
import JobTypeBadge from "@/components/jobs/JobTypeBadge";
import JobWorkflow from "@/components/jobs/JobWorkflow";
import AppLoadingOverlay from "@/components/ui/AppLoadingOverlay";
import AppModal from "@/components/ui/AppModal";
import ScreenContainer from "@/components/ui/ScreenContainer";
import { spacing } from "@/constants/theme";
import { useAuth } from "@/features/auth/use-auth";
import { getWorkerJobAction } from "@/features/jobs/job.actions";
import { formatJobDate, formatJobTime } from "@/features/jobs/job.helpers";
import {
  useRunWorkerJobAction,
  useWorkerJobDetail,
} from "@/features/jobs/use-worker-jobs";
import { showFeedbackToast, toastSuccess } from "@/features/toast/toast-store";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useSingleNavigation } from "@/hooks/use-single-navigation";
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

export default function MobileServiceScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const { navigate, isBlocked } = useSingleNavigation();

  const [message, setMessageState] = useState<{
    title: string;
    text: string;
  } | null>(null);
  const setMessage = (next: { title: string; text: string } | null) => {
    setMessageState(null);
    if (next) showFeedbackToast(next.title, next.text);
  };

  const [workerNotes, setWorkerNotes] = useState("");
  const [bundle, setBundle] = useState<ServiceJobReportBundle>({
    report: null,
    images: [],
  });
  const [reportLoading, setReportLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const hydratedReportId = useRef<string | null>(null);

  const {
    data: job,
    isLoading,
    isError,
    refetch,
  } = useWorkerJobDetail(profile?.id, id);
  const actionMutation = useRunWorkerJobAction(profile?.id);
  const bookingId = job?.kind === "service" ? job.jobId : undefined;
  const editable = job?.status === "in_progress";

  const loadReport = async (showSpinner = true) => {
    if (!bookingId) return;
    if (showSpinner) setReportLoading(true);
    try {
      const next = await fetchServiceJobReport(bookingId);
      setBundle(next);
    } catch (error) {
      console.log("Evidence load error:", error);
    } finally {
      if (showSpinner) setReportLoading(false);
    }
  };

  useEffect(() => {
    if (isLoading || !bookingId) return;
    void loadReport();
  }, [bookingId, isLoading]);

  useEffect(() => {
    const report = bundle.report;
    if (!report || hydratedReportId.current === report.id) return;
    hydratedReportId.current = report.id;
    setWorkerNotes(report.workerNotes ?? "");
  }, [bundle.report]);

  const beforeImages = useMemo(
    () => bundle.images.filter((image) => image.stage === "before"),
    [bundle.images],
  );
  const afterImages = useMemo(
    () => bundle.images.filter((image) => image.stage === "after"),
    [bundle.images],
  );

  const isOverlayLoading =
    isLoading ||
    reportLoading ||
    saveLoading ||
    photoLoading ||
    actionMutation.isPending;
  const overlayMessage = isLoading
    ? "Loading job details..."
    : reportLoading
      ? "Loading service report..."
      : saveLoading
        ? "Saving notes..."
        : photoLoading
          ? "Updating photos..."
          : actionMutation.isPending
            ? "Updating status..."
            : "Please wait...";

  const action = job ? getWorkerJobAction(job) : null;
  const appointment = job
    ? formatJobDate(job.scheduledDate) +
      " · " +
      formatJobTime(job.scheduledTime)
    : "";

  const saveNotes = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!job) return;
    if (isBlocked) return;
    if (!editable) {
      if (!silent)
        setMessage({
          title: "Read-only",
          text: "You can only save notes while the job is in progress.",
        });
      return;
    }
    setSaveLoading(true);
    try {
      const reportId = await saveServiceJobReport(job.jobId, workerNotes);
      await loadReport(false);
      if (!silent) toastSuccess("Worker notes saved successfully.");
      return reportId;
    } catch (error: any) {
      const errorMsg = error?.message || "Worker notes could not be saved.";
      if (errorMsg.includes("Assigned worker in progress required")) {
        setMessage({
          title: "Action Required",
          text: "You must click 'Start Job' and ensure you are the assigned worker before saving notes.",
        });
      } else {
        if (!silent) setMessage({ title: "Save failed", text: errorMsg });
      }
      throw error;
    } finally {
      setSaveLoading(false);
    }
  };

  const choosePhoto = async (
    stage: ServiceEvidenceStage,
    source: "camera" | "library",
  ) => {
    if (!editable || photoLoading || isBlocked) return;
    try {
      const perm =
        source === "camera"
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setMessage({
          title: "Permission required",
          text: "Access is needed to take photos.",
        });
        return;
      }
      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync({
              quality: 0.72,
              allowsEditing: false,
            })
          : await ImagePicker.launchImageLibraryAsync({
              quality: 0.72,
              allowsMultipleSelection: false,
            });
      if (result.canceled || result.assets.length === 0) return;
      setPhotoLoading(true);
      const reportId = bundle.report?.id ?? (await saveNotes({ silent: true }));
      await uploadServiceImage({
        serviceBookingId: job!.jobId,
        serviceJobReportId: reportId!,
        uri: result.assets[0].uri,
        fileName: result.assets[0].fileName,
        mimeType: result.assets[0].mimeType,
        stage,
        sortOrder:
          stage === "before" ? beforeImages.length : afterImages.length,
      });
      await loadReport(false);
      toastSuccess("Photo uploaded.");
    } catch (error) {
      setMessage({
        title: "Upload failed",
        text: "Photo could not be uploaded.",
      });
    } finally {
      setPhotoLoading(false);
    }
  };

  const runAction = async () => {
    if (
      !job ||
      !action ||
      action.type !== "service" ||
      actionMutation.isPending ||
      isBlocked
    )
      return;
    if (action.target === "completed") await saveNotes({ silent: true });
    try {
      await actionMutation.mutateAsync({ job });
      await refetch();
      if (action.target === "completed") {
        if (isBlocked) return;
        router.back();
      }
    } catch (error) {
      setMessage({
        title: "Update failed",
        text: "Status could not be updated.",
      });
    }
  };

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      {isError ? (
        <ScreenContainer>
          <InspectorListState
            title="Error"
            message="Could not load service."
            onRetry={() => void refetch()}
          />
        </ScreenContainer>
      ) : job && job.kind === "service" ? (
        <>
          <ScreenContainer contentStyle={styles.noPadding}>
            <KeyboardAvoidingView
              style={styles.flex}
              behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.content, { paddingBottom: 160 }]}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.topBar}>
                  <Pressable
                    disabled={isBlocked}
                    onPress={() => {
                      if (isBlocked) return;
                      router.back();
                    }}
                    style={styles.backButton}
                  >
                    <Text style={[styles.backText, { color: theme.primary }]}>
                      ‹ Back
                    </Text>
                  </Pressable>
                  <JobStatusBadge status={job.status} />
                </View>

                <View style={styles.hero}>
                  <JobTypeBadge kind="service" label={job.jobTypeLabel} />
                  <Text style={[styles.title, { color: theme.text }]}>
                    {job.vehicleLabel}
                  </Text>
                  <Text
                    style={[styles.serviceName, { color: theme.textSecondary }]}
                  >
                    {job.title}
                  </Text>
                </View>

                <Divider />
                <JobWorkflow job={job} />
                <Divider />

                <View style={styles.infoGrid}>
                  <View style={styles.infoBlock}>
                    <Text
                      style={[styles.sectionLabel, { color: theme.textMuted }]}
                    >
                      APPOINTMENT
                    </Text>
                    <Text style={[styles.infoValue, { color: theme.text }]}>
                      {appointment}
                    </Text>
                  </View>
                  <View style={styles.infoBlock}>
                    <Text
                      style={[styles.sectionLabel, { color: theme.textMuted }]}
                    >
                      CUSTOMER
                    </Text>
                    <Text style={[styles.infoValue, { color: theme.text }]}>
                      {job.customerName || "Customer"}
                    </Text>
                    {job.customerPhone && (
                      <Pressable
                        disabled={isBlocked}
                        onPress={() => {
                          if (isBlocked) return;
                          callPhone(job.customerPhone!);
                        }}
                      >
                        <Text
                          style={{
                            color: theme.primary,
                            fontSize: 13,
                            fontWeight: "bold",
                          }}
                        >
                          {job.customerPhone}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </View>

                <Divider />

                <View style={styles.section}>
                  <Text
                    style={[styles.sectionLabel, { color: theme.textMuted }]}
                  >
                    LOCATION
                  </Text>
                  <Text style={[styles.location, { color: theme.text }]}>
                    {job.address}
                  </Text>
                  <Pressable
                    disabled={isBlocked}
                    onPress={() => {
                      if (isBlocked) return;
                      openExternalNavigation(job.address);
                    }}
                    style={[
                      styles.navBtn,
                      {
                        borderColor: theme.border,
                        backgroundColor: theme.surfaceSecondary,
                      },
                    ]}
                  >
                    <Ionicons name="navigate" size={16} color={theme.primary} />
                    <Text
                      style={{
                        color: theme.primary,
                        fontWeight: "bold",
                        fontSize: 12,
                      }}
                    >
                      OPEN NAVIGATION
                    </Text>
                  </Pressable>
                </View>

                <Divider />

                <View style={styles.section}>
                  <Text
                    style={[styles.sectionLabel, { color: theme.textMuted }]}
                  >
                    WORKER NOTES
                  </Text>
                  <TextInput
                    value={workerNotes}
                    onChangeText={setWorkerNotes}
                    editable={editable}
                    placeholder="Work details..."
                    placeholderTextColor={theme.textMuted}
                    multiline
                    textAlignVertical="top"
                    style={[
                      styles.textArea,
                      {
                        color: theme.text,
                        borderColor: theme.inputBorder,
                        backgroundColor: theme.surface,
                      },
                    ]}
                  />
                  {editable && (
                    <Pressable
                      disabled={saveLoading || isBlocked}
                      onPress={() => saveNotes()}
                      style={styles.saveNotesBtn}
                    >
                      <Text
                        style={{ color: theme.primary, fontWeight: "bold" }}
                      >
                        Save notes
                      </Text>
                    </Pressable>
                  )}
                </View>

                <Divider />

                <EvidenceSection
                  title="Before service"
                  images={beforeImages}
                  editable={editable}
                  busy={photoLoading}
                  isNavBlocked={isBlocked}
                  onCamera={() => choosePhoto("before", "camera")}
                  onLibrary={() => choosePhoto("before", "library")}
                  onDelete={async (img: ServiceJobImage) => {
                    if (isBlocked) return;
                    await deleteServiceImage(img);
                    await loadReport(false);
                  }}
                />
                <Divider />
                <EvidenceSection
                  title="After service"
                  images={afterImages}
                  editable={editable}
                  busy={photoLoading}
                  isNavBlocked={isBlocked}
                  onCamera={() => choosePhoto("after", "camera")}
                  onLibrary={() => choosePhoto("after", "library")}
                  onDelete={async (img: ServiceJobImage) => {
                    if (isBlocked) return;
                    await deleteServiceImage(img);
                    await loadReport(false);
                  }}
                />
              </ScrollView>
            </KeyboardAvoidingView>
          </ScreenContainer>

          {action && action.type === "service" && (
            <View
              style={[
                styles.footer,
                {
                  backgroundColor: theme.surface,
                  borderTopColor: theme.border,
                  paddingBottom: Math.max(insets.bottom, 16),
                },
              ]}
            >
              <Pressable
                disabled={actionMutation.isPending || isBlocked}
                onPress={runAction}
                style={({ pressed }) => [
                  styles.primaryButton,
                  {
                    backgroundColor: pressed
                      ? theme.actionPressed
                      : theme.action,
                    opacity:
                      pressed || isBlocked
                        ? 0.7
                        : actionMutation.isPending
                          ? 0.6
                          : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.primaryButtonText,
                    { color: theme.actionText },
                  ]}
                >
                  {action.label}
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={theme.actionText}
                />
              </Pressable>
            </View>
          )}
        </>
      ) : null}

      <AppLoadingOverlay visible={isOverlayLoading} message={overlayMessage} />
      <AppModal
        visible={Boolean(message)}
        title={message?.title ?? ""}
        message={message?.text}
        onClose={() => setMessage(null)}
      />
    </View>
  );
}

function Divider() {
  const theme = useAppTheme();
  return (
    <View
      style={{ height: 1, backgroundColor: theme.border, marginVertical: 10 }}
    />
  );
}

function EvidenceSection({
  title,
  images,
  editable,
  busy,
  isNavBlocked,
  onCamera,
  onLibrary,
  onDelete,
}: {
  title: string;
  images: ServiceJobImage[];
  editable: boolean;
  busy: boolean;
  isNavBlocked: boolean;
  onCamera: () => void;
  onLibrary: () => void;
  onDelete: (img: ServiceJobImage) => void;
}) {
  const theme = useAppTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
        {title.toUpperCase()}
      </Text>

      {editable && (
        <View style={{ flexDirection: "row", gap: 10, marginVertical: 10 }}>
          <Pressable
            disabled={busy || isNavBlocked}
            onPress={onCamera}
            style={({ pressed }) => [
              styles.photoAction,
              {
                borderColor: theme.border,
                backgroundColor: theme.surfaceSecondary,
                opacity: pressed ? 0.7 : busy || isNavBlocked ? 0.5 : 1,
              },
            ]}
          >
            <Ionicons name="camera-outline" size={16} color={theme.text} />
            <Text
              style={{ fontSize: 12, fontWeight: "bold", color: theme.text }}
            >
              Camera
            </Text>
          </Pressable>

          <Pressable
            disabled={busy || isNavBlocked}
            onPress={onLibrary}
            style={({ pressed }) => [
              styles.photoAction,
              {
                borderColor: theme.border,
                backgroundColor: theme.surfaceSecondary,
                opacity: pressed ? 0.7 : busy || isNavBlocked ? 0.5 : 1,
              },
            ]}
          >
            <Ionicons name="images-outline" size={16} color={theme.text} />
            <Text
              style={{ fontSize: 12, fontWeight: "bold", color: theme.text }}
            >
              Library
            </Text>
          </Pressable>
        </View>
      )}

      <View style={styles.photoGrid}>
        {images.map((image) => (
          <View key={image.id} style={styles.photoItem}>
            <Image
              source={{ uri: image.signedUrl || undefined }}
              style={[
                styles.photo,
                { backgroundColor: theme.surfaceSecondary },
              ]}
            />
            {editable && (
              <Pressable
                disabled={isNavBlocked}
                onPress={() => onDelete(image)}
                style={[
                  styles.deletePhoto,
                  { backgroundColor: theme.dangerSoft },
                ]}
              >
                <Text
                  style={{
                    color: theme.danger,
                    fontSize: 10,
                    fontWeight: "bold",
                  }}
                >
                  Delete
                </Text>
              </Pressable>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  noPadding: { paddingHorizontal: 0 },
  content: { padding: spacing.xl },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: { paddingVertical: 8 },
  backText: { fontSize: 16, fontWeight: "bold" },
  hero: { marginVertical: 20 },
  title: { fontSize: 30, fontWeight: "bold", letterSpacing: -0.8 },
  serviceName: { fontSize: 14, marginTop: 4 },
  infoGrid: { flexDirection: "row", paddingVertical: 20, gap: 15 },
  infoBlock: { flex: 1 },
  section: { paddingVertical: 10 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 8,
  },
  infoValue: { fontSize: 15, fontWeight: "bold" },
  location: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
    marginBottom: 8,
  },
  navBtn: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  textArea: {
    minHeight: 100,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    textAlignVertical: "top",
  },
  saveNotesBtn: { alignSelf: "flex-end", marginTop: 8, padding: 8 },
  photoAction: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  photoItem: { width: "31%", aspectRatio: 0.8 },
  photo: { width: "100%", aspectRatio: 1, borderRadius: 8 },
  deletePhoto: {
    marginTop: 4,
    alignItems: "center",
    paddingVertical: 4,
    borderRadius: 6,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    padding: 20,
    borderTopWidth: 1,
  },
  primaryButton: {
    height: 54,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  primaryButtonText: { fontSize: 16, fontWeight: "bold" },
});
