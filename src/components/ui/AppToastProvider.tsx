import { Ionicons } from "@expo/vector-icons";
import {
  type PropsWithChildren,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  getToastSnapshot,
  hideToast,
  subscribeToast,
} from "@/features/toast/toast-store";
import { useAppTheme } from "@/hooks/use-app-theme";

const meta = {
  success: { icon: "checkmark-circle" as const },
  error: { icon: "alert-circle" as const },
  warning: { icon: "warning" as const },
  info: { icon: "information-circle" as const },
};

export default function AppToastProvider({ children }: PropsWithChildren) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  const toast = useSyncExternalStore(
    subscribeToast,
    getToastSnapshot,
    getToastSnapshot,
  );

  const translateY = useRef(new Animated.Value(-12)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!toast) return;

    translateY.setValue(-12);
    opacity.setValue(0);

    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 220,
        mass: 0.7,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -10,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start(hideToast);
    }, toast.duration);

    return () => clearTimeout(timer);
  }, [opacity, toast, translateY]);

  return (
    <View style={styles.root}>
      {children}

      {/* RENDER TOAST INSIDE A TRANSPARENT MODAL SO IT IS ALWAYS ON TOP OF DIALOG MODALS */}
      {toast ? (
        <Modal
          transparent
          visible={Boolean(toast)}
          statusBarTranslucent
          animationType="none"
          onRequestClose={hideToast}
        >
          <View pointerEvents="box-none" style={styles.modalOverlay}>
            <Animated.View
              accessibilityLiveRegion="polite"
              style={[
                styles.toast,
                {
                  opacity,
                  transform: [{ translateY }],
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  marginTop: Math.max(insets.top, 8) + 6,
                },
              ]}
            >
              <Ionicons
                name={meta[toast.type].icon}
                size={19}
                color={
                  toast.type === "success"
                    ? theme.success
                    : toast.type === "error"
                      ? theme.danger
                      : toast.type === "warning"
                        ? theme.warning
                        : theme.info
                }
              />

              <View style={styles.copy}>
                {toast.title ? (
                  <Text numberOfLines={1} style={[styles.title, { color: theme.text }]}>
                    {toast.title}
                  </Text>
                ) : null}

                <Text
                  numberOfLines={2}
                  style={[
                    styles.message,
                    { color: toast.title ? theme.textSecondary : theme.text },
                  ]}
                >
                  {toast.message}
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Dismiss notification"
                hitSlop={9}
                onPress={hideToast}
                style={({ pressed }) => [styles.close, pressed && { opacity: 0.45 }]}
              >
                <Ionicons name="close" size={17} color={theme.textMuted} />
              </Pressable>
            </Animated.View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  modalOverlay: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 12,
  },
  toast: {
    width: "100%",
    maxWidth: 560,
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 9,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    elevation: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },
  copy: { flex: 1 },
  title: { fontSize: 12, lineHeight: 15, fontWeight: "700" },
  message: { marginTop: 1, fontSize: 12, lineHeight: 16, fontWeight: "500" },
  close: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
});
