import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  fontWeight,
} from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

type InspectorScreenHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
};

export default function InspectorScreenHeader({
  eyebrow,
  title,
  subtitle,
}: InspectorScreenHeaderProps) {
  const theme = useAppTheme();

  return (
    <View style={styles.container}>
      {eyebrow ? (
        <Text
          style={[
            styles.eyebrow,
            {
              color: theme.primary,
            },
          ]}
        >
          {eyebrow}
        </Text>
      ) : null}

      <Text
        style={[
          styles.title,
          {
            color: theme.text,
          },
        ]}
      >
        {title}
      </Text>

      {subtitle ? (
        <Text
          style={[
            styles.subtitle,
            {
              color:
                theme.textSecondary,
            },
          ]}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      paddingTop: 12,
      paddingBottom: 18,
    },

    eyebrow: {
      marginBottom: 7,

      fontSize: 11,
      lineHeight: 15,

      fontWeight:
        fontWeight.bold,

      letterSpacing: 1.35,
    },

    title: {
      fontSize: 30,
      lineHeight: 35,

      fontWeight:
        fontWeight.bold,

      letterSpacing: -0.8,
    },

    subtitle: {
      marginTop: 7,

      fontSize: 14,
      lineHeight: 21,
    },
  });

