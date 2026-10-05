import { memo, useEffect, useMemo } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
    Easing,
    SensorType,
    cancelAnimation,
    useAnimatedSensor,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
    type SharedValue,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

import { useResolvedColorScheme } from "@/features/theme/theme-preference";
import { useAppTheme } from "@/hooks/use-app-theme";

export type DottedSurfaceProps = {
  size?: number;
  opacity?: number;
  sizeAttenuation?: boolean;
  vertexColors?: boolean;
  panX?: SharedValue<number>;
  panY?: SharedValue<number>;
};

type Dot = {
  cx: number;
  cy: number;
  r: number;
  color: string;
  opacity: number;
};

function hash(n: number) {
  const x = Math.sin(n * 127.1) * 43758.5453123;
  return x - Math.floor(x);
}

function DottedSurfaceComponent({
  size = 8,
  opacity = 0.8,
  sizeAttenuation = true,
  vertexColors = true,
  panX,
  panY,
}: DottedSurfaceProps) {
  const theme = useAppTheme();
  const colorScheme = useResolvedColorScheme();
  const isDark = colorScheme === "dark";
  const { width, height } = Dimensions.get("window");
  const float = useSharedValue(0);
  const fallbackPanX = useSharedValue(0);
  const fallbackPanY = useSharedValue(0);
  const touchX = panX ?? fallbackPanX;
  const touchY = panY ?? fallbackPanY;
  const rotation = useAnimatedSensor(SensorType.ROTATION, { interval: 32 });

  const ink = isDark ? "rgb(255, 255, 255)" : "rgb(0, 0, 0)";
  const inkOpacity = isDark ? 0.22 : 0.14;

  const field = useMemo(() => {
    const spacing = Math.max(18, size * 3.15);
    const cols = Math.ceil(width / spacing) + 5;
    const rows = Math.ceil(height / spacing) + 5;
    const dots: Dot[] = [];

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const index = row * cols + col;
        const depth = hash(index + 47);
        const accent = hash(index + 71);
        const jitterX = (hash(index + 11) - 0.5) * spacing * 0.52;
        const jitterY = (hash(index + 29) - 0.5) * spacing * 0.52;
        const attenuated = sizeAttenuation
          ? 0.55 + depth * (size * 0.16)
          : size * 0.12;
        const useAccent = vertexColors && accent > 0.93;

        dots.push({
          cx: col * spacing + jitterX,
          cy: row * spacing + jitterY,
          r: attenuated,
          color: useAccent ? theme.primary : ink,
          opacity: useAccent ? 0.45 + depth * 0.25 : inkOpacity,
        });
      }
    }

    return {
      width: cols * spacing,
      height: rows * spacing,
      dots,
    };
  }, [
    height,
    ink,
    inkOpacity,
    size,
    sizeAttenuation,
    theme.primary,
    vertexColors,
    width,
  ]);

  useEffect(() => {
    float.value = withRepeat(
      withTiming(1, {
        duration: 18000,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );

    return () => {
      cancelAnimation(float);
    };
  }, [float]);

  const animatedStyle = useAnimatedStyle(() => {
    const qx = rotation.sensor.value.qx ?? 0;
    const qy = rotation.sensor.value.qy ?? 0;
    const drift = float.value;

    return {
      opacity,
      transform: [
        { translateX: (drift - 0.5) * 28 + qy * 18 + touchX.value },
        { translateY: (drift - 0.5) * 20 + qx * 18 + touchY.value },
      ],
    };
  });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View style={[styles.field, animatedStyle]}>
        <Svg width={field.width} height={field.height}>
          {field.dots.map((dot, index) => (
            <Circle
              key={index}
              cx={dot.cx}
              cy={dot.cy}
              r={dot.r}
              fill={dot.color}
              opacity={dot.opacity}
            />
          ))}
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    position: "absolute",
    top: -36,
    left: -36,
  },
});

export default memo(DottedSurfaceComponent);
