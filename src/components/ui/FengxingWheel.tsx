import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

import Svg, { Circle, Polygon } from "react-native-svg";

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

  // Light mode -> navy
  // Dark mode  -> near white
  const wheelColor = theme.text;

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
        <Svg viewBox="0 0 30 30" width={size} height={size}>
          {/* OUTER MAIN RING */}

          <Circle
            cx={15}
            cy={15}
            r={14.5}
            fill="none"
            stroke={wheelColor}
            strokeWidth={0.825}
            strokeLinecap="round"
          />

          {/* BRAND RED RING */}

          <Circle
            cx={15}
            cy={15}
            r={13.35}
            fill="none"
            stroke={theme.primary}
            strokeWidth={0.375}
            opacity={0.9}
          />

          {/* INNER RING */}

          <Circle
            cx={15}
            cy={15}
            r={12.6}
            fill="none"
            stroke={wheelColor}
            strokeWidth={0.45}
            opacity={0.45}
          />

          {/* SPOKES */}

          <Polygon
            points="13.845,18.300 16.155,18.300 15.412,27.000 14.588,27.000"
            fill={wheelColor}
            opacity={0.95}
          />

          <Polygon
            points="11.505,14.921 12.218,17.118 3.715,19.101 3.460,18.316"
            fill={wheelColor}
            opacity={0.95}
          />

          <Polygon
            points="13.995,11.651 12.126,13.009 7.613,5.534 8.280,5.049"
            fill={wheelColor}
            opacity={0.95}
          />

          <Polygon
            points="17.874,13.009 16.005,11.651 21.720,5.049 22.387,5.534"
            fill={wheelColor}
            opacity={0.95}
          />

          <Polygon
            points="17.782,17.118 18.495,14.921 26.540,18.316 26.285,19.101"
            fill={wheelColor}
            opacity={0.95}
          />

          {/* CENTER */}

          <Circle cx={15} cy={15} r={3} fill={wheelColor} opacity={0.95} />

          {/* SMALL DETAILS */}

          <Circle
            cx={15}
            cy={17.175}
            r={0.6}
            fill="none"
            stroke={wheelColor}
            strokeWidth={0.375}
            opacity={0.5}
          />

          <Circle
            cx={12.931452077058042}
            cy={15.672111962765511}
            r={0.6}
            fill="none"
            stroke={wheelColor}
            strokeWidth={0.375}
            opacity={0.5}
          />

          <Circle
            cx={13.72156707626387}
            cy={13.24038803723449}
            r={0.6}
            fill="none"
            stroke={wheelColor}
            strokeWidth={0.375}
            opacity={0.5}
          />

          <Circle
            cx={16.27843292373613}
            cy={13.240388037234489}
            r={0.6}
            fill="none"
            stroke={wheelColor}
            strokeWidth={0.375}
            opacity={0.5}
          />

          <Circle
            cx={17.06854792294196}
            cy={15.672111962765511}
            r={0.6}
            fill="none"
            stroke={wheelColor}
            strokeWidth={0.375}
            opacity={0.5}
          />

          <Circle
            cx={15}
            cy={15}
            r={1.5}
            fill="none"
            stroke={wheelColor}
            strokeWidth={0.375}
            opacity={0.5}
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
