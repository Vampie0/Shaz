import { router } from "expo-router";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";

import CustomerInspectionCard from "@/components/customer/CustomerInspectionCard";
import CustomerListState from "@/components/customer/CustomerListState";
import CustomerPageHeader from "@/components/customer/CustomerPageHeader";
import CustomerTopBar from "@/components/customer/CustomerTopBar";
import ScreenContainer from "@/components/ui/ScreenContainer";
import { spacing } from "@/constants/theme";
import { useAuth } from "@/features/auth/use-auth";
import { useCustomerDashboard } from "@/features/customer/use-customer-dashboard";
import { useAppTheme } from "@/hooks/use-app-theme";

export default function CustomerInspectionsScreen() {
  const theme =
    useAppTheme();

  const { session } =
    useAuth();

  const query =
    useCustomerDashboard(
      session?.user.id,
    );

  const inspections =
    query.data
      ?.inspections ??
    [];

  return (
    <ScreenContainer
      contentStyle={
        styles.screen
      }
    >
      <CustomerTopBar
        title="Inspections"
      />

      <FlatList
        data={inspections}
        keyExtractor={(item) =>
          item.id
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.content
        }
        refreshControl={
          <RefreshControl
            refreshing={
              query.isRefetching
            }
            onRefresh={() =>
              void query.refetch()
            }
            tintColor={
              theme.primary
            }
            colors={[
              theme.primary,
            ]}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <CustomerPageHeader
              title="My inspections"
              subtitle="Your vehicle inspection requests, progress and reports."
              actionLabel="Request Vehicle Inspection"
              actionVariant="secondary"
              onAction={() =>
                router.push(
                  "/(customer)/vehicle-inspection",
                )
              }
            />
          </View>
        }
        ItemSeparatorComponent={() => (
          <View
            style={
              styles.separator
            }
          />
        )}
        renderItem={({ item }) => (
          <CustomerInspectionCard
            inspection={item}
            onViewRequest={() =>
              router.push({
                pathname:
                  "/(customer)/inspection/[inspectionId]",
                params: {
                  inspectionId:
                    item.id,
                },
              })
            }
          />
        )}
        ListEmptyComponent={
          <CustomerListState
            loading={
              query.isLoading
            }
            error={
              query.isError
            }
            empty={
              !query.isLoading &&
              !query.isError &&
              inspections.length ===
                0
            }
            emptyTitle="No inspections yet"
            emptyMessage="Your Fengxing vehicle inspection requests will appear here."
            onRetry={() =>
              void query.refetch()
            }
          />
        }
      />
    </ScreenContainer>
  );
}

const styles =
  StyleSheet.create({
    screen: {
      paddingHorizontal: 0,
    },

    content: {
      flexGrow: 1,
      paddingHorizontal:
        spacing.xl,
      paddingTop:
        spacing.xxl,
      paddingBottom:
        spacing.xxxl,
    },

    header: {
      marginBottom:
        spacing.xxl,
    },

    separator: {
      height: spacing.md,
    },
  });

