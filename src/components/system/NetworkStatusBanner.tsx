import { Ionicons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTheme } from "@/hooks/use-app-theme";

export default function NetworkStatusBanner() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [isOffline, setIsOffline] = useState(false);
  const slideAnim = useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = state.isConnected === false || state.isInternetReachable === false;
      if (offline) {
        setIsOffline(true);
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.timing(slideAnim, {
          toValue: -60,
          duration: 250,
          useNativeDriver: true,
        }).start(() => {
          setIsOffline(false);
        });
      }
    });

    return () => unsubscribe();
  }, [slideAnim]);

  if (!isOffline) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          backgroundColor: theme.danger,
          top: Math.max(insets.top, 8) + 6,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Ionicons name="cloud-offline-outline" size={18} color="#FFFFFF" />
      <Text style={styles.text}>
        No internet connection. Check your network.
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 9999999,
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    elevation: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
});
