import React, { PropsWithChildren } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import AppButton from "@/components/ui/AppButton";
import { fontSize, fontWeight, radius, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

type AppModalProps = PropsWithChildren<{
  visible: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onClose: () => void;
  loading?: boolean;
  destructive?: boolean;
}>;

export default function AppModal({
  visible,
  title,
  message,
  children,
  confirmText,
  cancelText = "Cancel",
  onConfirm,
  onClose,
  loading = false,
  destructive = false,
}: AppModalProps) {
  const theme = useAppTheme();

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={loading ? undefined : onClose}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalAvoidingView}
        >
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={[styles.accent, { backgroundColor: theme.primary }]} />

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
              automaticallyAdjustKeyboardInsets={true}
            >
              <View style={styles.content}>
                <Text style={[styles.title, { color: theme.text }]}>
                  {title}
                </Text>

                {message ? (
                  <Text style={[styles.message, { color: theme.textSecondary }]}>
                    {message}
                  </Text>
                ) : null}

                {children}
              </View>

              {/* COMPACT SIDE-BY-SIDE MODAL BUTTONS */}
              {onConfirm && confirmText ? (
                <View style={styles.actionsRow}>
                  <AppButton
                    title={cancelText}
                    variant="secondary"
                    onPress={onClose}
                    disabled={loading}
                    fullWidth={false}
                    style={styles.modalButton}
                  />
                  <AppButton
                    title={confirmText}
                    variant={destructive ? "danger" : "primary"}
                    onPress={onConfirm}
                    loading={loading}
                    fullWidth={false}
                    style={styles.modalButton}
                  />
                </View>
              ) : (
                <View style={styles.actionsSingle}>
                  <AppButton
                    title="Close"
                    variant="secondary"
                    onPress={onClose}
                    fullWidth={false}
                    style={styles.modalButton}
                  />
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  modalAvoidingView: {
    width: "100%",
    maxWidth: 380,
    alignSelf: "center",
  },
  card: {
    width: "100%",
    maxHeight: 580,
    borderWidth: 1,
    borderRadius: radius.xl,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: 48,
    gap: spacing.lg,
  },
  accent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    zIndex: 10,
  },
  content: {
    gap: spacing.xs,
    paddingTop: 4,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  message: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actionsSingle: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: spacing.xs,
  },
  modalButton: {
    minHeight: 40,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
});
