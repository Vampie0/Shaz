import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Svg, { Circle, G, Path } from "react-native-svg";

import { useAppTheme } from "@/hooks/use-app-theme";

type FengxingWheelProps = {
  size?: number;
  duration?: number;
};

export default function FengxingWheel({
  size = 48,
  duration = 9000,
}: FengxingWheelProps) {
  const theme = useAppTheme();

  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    rotation.setValue(0);

    const animation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
        isInteraction: false,
      }),
    );

    animation.start();

    return () => {
      animation.stop();
      rotation.setValue(0);
    };
  }, [duration, rotation]);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  /*
   * WEB LOGO COLORS
   *
   * Web:
   * accent = #E94A3F
   * dark   = #082A30
   * light  = #F7F4EF / #FFFFFF
   *
   * Keep the app size/theme behavior unchanged.
   */
  const accent = theme.primary || "#E94A3F";
  const dark = "#082A30";
  const light = "#F7F4EF";

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
        },
      ]}
    >
      <Animated.View
        style={{
          width: size,
          height: size,
          transform: [{ rotate }],
        }}
      >
        <Svg viewBox="0 0 48 48" width={size} height={size}>
          {/* =========================================================
              WEB LOGO - OUTER RED CIRCLE
             ========================================================= */}

          <Circle cx="24" cy="24" r="23" fill={accent} />

          {/* =========================================================
              WEB LOGO - DARK INNER CIRCLE
             ========================================================= */}

          <Circle
            cx="24"
            cy="24"
            r="20.5"
            fill={dark}
            stroke="#FFFFFF"
            strokeWidth="1.25"
            opacity={0.98}
          />

          {/* =========================================================
              WEB LOGO - ROTATING WHEEL / TURBINE
             ========================================================= */}

          <G>
            {/* Inner wheel ring */}

            <Circle
              cx="24"
              cy="24"
              r="17"
              fill="none"
              stroke={light}
              strokeWidth="1.15"
              opacity={0.75}
            />

            {/* =====================================================
                SIX TURBINE BLADES
               ===================================================== */}

            <G>
              <Path
                d="M22.4 20.5 18 9.2c3.8-1.4 8.2-1.4 12 0l-4.4 11.3Z"
                fill={light}
                opacity={0.92}
              />

              <Path
                d="M22.4 20.5 18 9.2c3.8-1.4 8.2-1.4 12 0l-4.4 11.3Z"
                fill={light}
                opacity={0.92}
                rotation="60"
                origin="24, 24"
              />

              <Path
                d="M22.4 20.5 18 9.2c3.8-1.4 8.2-1.4 12 0l-4.4 11.3Z"
                fill={light}
                opacity={0.92}
                rotation="120"
                origin="24, 24"
              />

              <Path
                d="M22.4 20.5 18 9.2c3.8-1.4 8.2-1.4 12 0l-4.4 11.3Z"
                fill={light}
                opacity={0.92}
                rotation="180"
                origin="24, 24"
              />

              <Path
                d="M22.4 20.5 18 9.2c3.8-1.4 8.2-1.4 12 0l-4.4 11.3Z"
                fill={light}
                opacity={0.92}
                rotation="240"
                origin="24, 24"
              />

              <Path
                d="M22.4 20.5 18 9.2c3.8-1.4 8.2-1.4 12 0l-4.4 11.3Z"
                fill={light}
                opacity={0.92}
                rotation="300"
                origin="24, 24"
              />
            </G>

            {/* =====================================================
                WEB LOGO - INNER DASHED RING
               ===================================================== */}

            <Circle
              cx="24"
              cy="24"
              r="7.3"
              fill="none"
              stroke={accent}
              strokeWidth="1.4"
              strokeDasharray="2.2 2.7"
            />
          </G>

          {/* =========================================================
              WEB LOGO - CENTER RED HUB
             ========================================================= */}

          <Circle
            cx="24"
            cy="24"
            r="7"
            fill={accent}
            stroke={light}
            strokeWidth="1.25"
          />

          {/* =========================================================
              WEB LOGO - WHITE S
             ========================================================= */}

          <Path
            d="M28.1 19.8h-6.5c-2.2 0-3.5 1.2-3.5 2.8 0 1.6 1.1 2.5 3.2 2.8l3.6.5c1 .2 1.4.5 1.4 1.1 0 .7-.6 1.1-1.7 1.1h-6.3"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});
