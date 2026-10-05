import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import CustomerStatusBadge from "@/components/customer/CustomerStatusBadge";
import CustomerTopBar from "@/components/customer/CustomerTopBar";
import AppButton from "@/components/ui/AppButton";
import AppInput from "@/components/ui/AppInput";
import AppLoadingOverlay from "@/components/ui/AppLoadingOverlay";
import AppModal from "@/components/ui/AppModal";
import ScreenContainer from "@/components/ui/ScreenContainer";
import { fontSize, fontWeight, radius, spacing } from "@/constants/theme";
import { useAuth } from "@/features/auth/use-auth";
import { useCustomerBookingDetail } from "@/features/customer/use-customer-booking-detail";
import { toastError, toastSuccess } from "@/features/toast/toast-store";
import { useAppTheme } from "@/hooks/use-app-theme";
import { cancelCustomerServiceBooking } from "@/services/customer/customer-booking-detail.service";

type StatusTone = "neutral" | "success" | "warning" | "info" | "danger";

function getStatusMeta(status: string): { label: string; tone: StatusTone } {
  switch (status) {
    case "cancelled":
      return { label: "Cancelled", tone: "danger" };
    case "completed":
      return { label: "Completed", tone: "success" };
    case "in_progress":
      return { label: "In progress", tone: "info" };
    case "on_the_way":
      return { label: "On the way", tone: "info" };
    case "assigned":
      return { label: "Assigned", tone: "warning" };
    case "confirmed":
      return { label: "Confirmed", tone: "success" };
    case "pending":
      return { label: "Pending", tone: "neutral" };
    default:
      return {
        label: status
          .replaceAll("_", " ")
          .replace(/\b\w/g, (l) => l.toUpperCase()),
        tone: "neutral",
      };
  }
}

function formatDate(value: string) {
  const date = new Date(value + "T00:00:00");
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value: string) {
  const match = value.match(/^(\d{2}):(\d{2})/);
  if (!match) return value;
  return `${match[1]}:${match[2]}`;
}

function formatPrice(value: number) {
  return "£" + value.toLocaleString("en-GB", { maximumFractionDigits: 0 });
}

export default function CustomerBookingDetailScreen() {
  const theme = useAppTheme();
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const params = useLocalSearchParams<{ bookingId?: string }>();
  const bookingId =
    typeof params.bookingId === "string" ? params.bookingId : "";

  const query = useCustomerBookingDetail(session?.user.id, bookingId);
  const booking = query.data;

  // CANCELLATION STATE
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  if (query.isLoading) {
    return (
      <ScreenContainer contentStyle={styles.screen}>
        <CustomerTopBar title="Booking Details" showBack />
        <AppLoadingOverlay visible message="Loading booking..." />
      </ScreenContainer>
    );
  }

  if (query.isError || !booking) {
    return (
      <ScreenContainer contentStyle={styles.screen}>
        <CustomerTopBar title="Booking Details" showBack />
        <View style={styles.state}>
          <Ionicons
            name="alert-circle-outline"
            size={30}
            color={theme.primary}
          />
          <Text style={[styles.stateTitle, { color: theme.text }]}>
            Couldn't load booking
          </Text>
          <Text style={[styles.stateText, { color: theme.textSecondary }]}>
            Go back and try again.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  const status = getStatusMeta(booking.status);
  const vehicle = [booking.carMake, booking.carModel, booking.registration]
    .filter(Boolean)
    .join(" · ");
  const address = [
    booking.addressLine1,
    booking.addressLine2,
    booking.city,
    booking.postcode,
  ]
    .filter(Boolean)
    .join(", ");
  const displayPrice = booking.quotedPrice ?? booking.serviceBasePrice;

  // SENIOR WEB LOGIC: Only pending or confirmed bookings can be cancelled
  const canCancel =
    booking.status === "pending" || booking.status === "confirmed";
  const showNoCancelNotice = !canCancel && booking.status !== "cancelled";

  const handleCancelBooking = async () => {
    if (!bookingId) return;
    setIsCancelling(true);

    try {
      await cancelCustomerServiceBooking(bookingId, cancelReason);

      await queryClient.invalidateQueries({
        queryKey: ["customer-dashboard", session?.user.id],
      });
      await query.refetch();

      setCancelModalVisible(false);
      setCancelReason("");
      toastSuccess("Your booking has been cancelled.", "Booking Cancelled");
    } catch (error: any) {
      toastError(
        error.message || "Unable to cancel this booking.",
        "Cancellation Failed",
      );
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <ScreenContainer contentStyle={styles.screen}>
      <CustomerTopBar title="Booking Details" showBack />

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
          <Text style={[styles.eyebrow, { color: theme.primary }]}>
            MOBILE SERVICE BOOKING
          </Text>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: theme.text }]}>
              {booking.serviceName}
            </Text>
            <CustomerStatusBadge label={status.label} tone={status.tone} />
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <View
              style={[styles.iconBox, { backgroundColor: theme.primarySoft }]}
            >
              <Ionicons name="car-outline" size={20} color={theme.primary} />
            </View>
            <View style={styles.detailCopy}>
              <Text style={[styles.detailLabel, { color: theme.textMuted }]}>
                VEHICLE
              </Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>
                {vehicle}
              </Text>
            </View>
          </View>

          <View
            style={[styles.rowDivider, { backgroundColor: theme.border }]}
          />

          <View style={styles.detailRow}>
            <View
              style={[
                styles.iconBox,
                { backgroundColor: theme.surfaceSecondary },
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color={theme.textSecondary}
              />
            </View>
            <View style={styles.detailCopy}>
              <Text style={[styles.detailLabel, { color: theme.textMuted }]}>
                PREFERRED VISIT
              </Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>
                {formatDate(booking.preferredDate)} ·{" "}
                {formatTime(booking.preferredTime)}
              </Text>
            </View>
          </View>

          <View
            style={[styles.rowDivider, { backgroundColor: theme.border }]}
          />

          <View style={styles.detailRow}>
            <View
              style={[
                styles.iconBox,
                { backgroundColor: theme.surfaceSecondary },
              ]}
            >
              <Ionicons
                name="location-outline"
                size={20}
                color={theme.textSecondary}
              />
            </View>
            <View style={styles.detailCopy}>
              <Text style={[styles.detailLabel, { color: theme.textMuted }]}>
                LOCATION
              </Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>
                {address}
              </Text>
            </View>
          </View>
        </View>

        {displayPrice !== null ? (
          <View style={[styles.priceBlock, { backgroundColor: theme.nav }]}>
            <View>
              <Text style={[styles.priceLabel, { color: theme.primary }]}>
                PRICE SNAPSHOT
              </Text>
              <Text style={[styles.priceValue, { color: theme.navText }]}>
                From {formatPrice(displayPrice)}
              </Text>
            </View>
            <Ionicons name="receipt-outline" size={25} color={theme.navMuted} />
          </View>
        ) : null}

        {booking.notes ? (
          <>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={styles.notes}>
              <View style={styles.notesTitleRow}>
                <Ionicons
                  name="chatbox-ellipses-outline"
                  size={20}
                  color={theme.primary}
                />
                <Text style={[styles.notesTitle, { color: theme.text }]}>
                  Notes
                </Text>
              </View>
              <Text style={[styles.notesText, { color: theme.textSecondary }]}>
                {booking.notes}
              </Text>
            </View>
          </>
        ) : null}

        {/* CANCEL BUTTON & NOTICES */}
        {canCancel ? (
          <View style={styles.cancelSection}>
            <AppButton
              title="Cancel Booking"
              variant="danger"
              onPress={() => setCancelModalVisible(true)}
            />
          </View>
        ) : null}

        {booking.status === "cancelled" ? (
          <View
            style={[
              styles.notice,
              {
                backgroundColor: theme.dangerSoft,
                borderLeftColor: theme.danger,
              },
            ]}
          >
            <Ionicons
              name="close-circle-outline"
              size={21}
              color={theme.danger}
            />
            <Text style={[styles.noticeText, { color: theme.textSecondary }]}>
              This booking has been cancelled.
              {booking.cancellationReason
                ? ` Reason: ${booking.cancellationReason}`
                : ""}
            </Text>
          </View>
        ) : null}

        {showNoCancelNotice ? (
          <View
            style={[
              styles.notice,
              {
                backgroundColor: theme.warningSoft,
                borderLeftColor: theme.warning,
              },
            ]}
          >
            <Ionicons
              name="information-circle-outline"
              size={21}
              color={theme.warning}
            />
            <Text style={[styles.noticeText, { color: theme.textSecondary }]}>
              This booking can no longer be cancelled online. Please contact us
              if you need help.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {/* CANCELLATION MODAL */}
      <AppModal
        visible={cancelModalVisible}
        title="Cancel Booking"
        message="Are you sure you want to cancel this booking? This action cannot be undone."
        confirmText="Cancel Booking"
        cancelText="Keep Booking"
        destructive
        onConfirm={handleCancelBooking}
        onClose={() => !isCancelling && setCancelModalVisible(false)}
      >
        <View style={{ paddingTop: spacing.md }}>
          <AppInput
            label="Cancellation reason (optional)"
            value={cancelReason}
            onChangeText={setCancelReason}
            placeholder="Tell us why you're cancelling..."
            multiline
            numberOfLines={3}
          />
        </View>
      </AppModal>

      <AppLoadingOverlay
        visible={isCancelling}
        message="Cancelling booking..."
      />
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
  stateTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    textAlign: "center",
  },
  stateText: { fontSize: fontSize.sm, lineHeight: 21, textAlign: "center" },
  hero: { gap: spacing.md },
  eyebrow: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 1.4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  title: {
    flex: 1,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.7,
  },
  divider: { height: StyleSheet.hairlineWidth },
  details: { gap: 0 },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  detailCopy: { flex: 1, gap: 4, paddingTop: 2 },
  detailLabel: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.8,
  },
  detailValue: {
    fontSize: fontSize.md,
    lineHeight: 23,
    fontWeight: fontWeight.semibold,
  },
  rowDivider: { height: StyleSheet.hairlineWidth, marginLeft: 58 },
  priceBlock: {
    minHeight: 98,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: 16,
  },
  priceLabel: { fontSize: 10, fontWeight: fontWeight.bold, letterSpacing: 0.9 },
  priceValue: {
    marginTop: 4,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  notes: { gap: spacing.md },
  notesTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  notesTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  notesText: { fontSize: fontSize.md, lineHeight: 24 },
  cancelSection: { marginTop: spacing.md },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    borderLeftWidth: 4,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  noticeText: { flex: 1, fontSize: fontSize.sm, lineHeight: 21 },
});
