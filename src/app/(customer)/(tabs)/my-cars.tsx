import { router } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";

import CustomerListingCard from "@/components/customer/CustomerListingCard";
import CustomerListState from "@/components/customer/CustomerListState";
import CustomerPageHeader from "@/components/customer/CustomerPageHeader";
import CustomerTopBar from "@/components/customer/CustomerTopBar";
import AppModal from "@/components/ui/AppModal";
import ScreenContainer from "@/components/ui/ScreenContainer";
import { spacing } from "@/constants/theme";
import { useAuth } from "@/features/auth/use-auth";
import { useCustomerDashboard } from "@/features/customer/use-customer-dashboard";
import {
  toastError,
  toastSuccess,
} from "@/features/toast/toast-store";
import { useAppTheme } from "@/hooks/use-app-theme";
import { markCarAsSold } from "@/services/customer/sell-car.service";

export default function CustomerMyCarsScreen() {
  const theme = useAppTheme();
  const { session } = useAuth();

  const query = useCustomerDashboard(session?.user.id);
  const listings = query.data?.listings ?? [];

  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [isMarkingSold, setIsMarkingSold] = useState(false);

  const handleMarkSold = async () => {
    if (!selectedCarId || !session?.user.id) {
      return;
    }

    setIsMarkingSold(true);

    try {
      await markCarAsSold(selectedCarId, session.user.id);

      setSelectedCarId(null);
      await query.refetch();

      toastSuccess(
        "The car has been marked as sold.",
        "Car Marked as Sold"
      );
    } catch (error) {
      console.error("Failed to mark car as sold:", error);
      toastError(
        "We couldn't mark this car as sold. Please try again.",
        "Mark Sold Failed"
      );
    } finally {
      setIsMarkingSold(false);
    }
  };

  return (
    <ScreenContainer contentStyle={styles.screen}>
      <CustomerTopBar title="My Cars" />

      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => void query.refetch()}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <CustomerPageHeader
              title="My Cars"
              subtitle="Manage the vehicles you have listed on Fengxing."
              actionLabel="Sell another car"
              onAction={() => router.push("/(customer)/sell-my-car")}
            />
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => {
          const isSold = item.status === "sold";
          return (
            <CustomerListingCard
              car={item}
              onView={() =>
                router.push({
                  pathname: "/(customer)/car/[carId]",
                  params: { carId: item.id },
                })
              }
              onEdit={
                isSold
                  ? undefined
                  : () =>
                      router.push({
                        pathname: "/(customer)/sell-my-car",
                        params: { editCarId: item.id },
                      })
              }
              onMore={isSold ? undefined : () => setSelectedCarId(item.id)}
            />
          );
        }}
        ListEmptyComponent={
          <CustomerListState
            loading={query.isLoading}
            error={query.isError}
            empty={!query.isLoading && !query.isError && listings.length === 0}
            emptyTitle="No listed cars yet"
            emptyMessage="Cars you list on Fengxing will appear here."
            onRetry={() => void query.refetch()}
          />
        }
      />

      <AppModal
        visible={Boolean(selectedCarId)}
        title="Mark car as sold?"
        message="Are you sure you want to mark this car as sold? It will no longer appear as an active marketplace listing."
        confirmText="Mark Sold"
        onConfirm={handleMarkSold}
        onClose={() => {
          if (!isMarkingSold) {
            setSelectedCarId(null);
          }
        }}
        loading={isMarkingSold}
        destructive
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 0 },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
  header: { marginBottom: spacing.xxl },
  separator: { height: spacing.md },
});
