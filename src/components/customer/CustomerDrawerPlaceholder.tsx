import { ScrollView, StyleSheet } from "react-native";

import CustomerTopBar from "@/components/customer/CustomerTopBar";
import EmptyState from "@/components/ui/EmptyState";
import ScreenContainer from "@/components/ui/ScreenContainer";
import ScreenHeading from "@/components/ui/ScreenHeading";
import { spacing } from "@/constants/theme";

type CustomerDrawerPlaceholderProps = {
  eyebrow: string;
  title: string;
  message: string;
};

export default function CustomerDrawerPlaceholder({
  eyebrow,
  title,
  message,
}: CustomerDrawerPlaceholderProps) {
  return (
    <ScreenContainer contentStyle={styles.screen}>
      <CustomerTopBar title={title} showBack />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <ScreenHeading eyebrow={eyebrow} title={title} subtitle={message} />

        <EmptyState
          title={title + " screen"}
          message="Navigation is ready. The exact mobile UI and functionality will be added from the website screenshots you provide."
        />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
    gap: spacing.xxl,
  },
});
