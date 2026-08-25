import { StyleSheet, View } from "react-native";

import FengxingWheel from "@/components/ui/FengxingWheel";
import ScreenContainer from "@/components/ui/ScreenContainer";

export default function FullScreenLoader() {
  return (
    <ScreenContainer>
      <View style={styles.container}>
        <FengxingWheel size={68} duration={6000} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
