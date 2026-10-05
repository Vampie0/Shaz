import { useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";

import CustomerListingCard from "@/components/customer/CustomerListingCard";
import CustomerListState from "@/components/customer/CustomerListState";
import CustomerPageHeader from "@/components/customer/CustomerPageHeader";
import CustomerTopBar from "@/components/customer/CustomerTopBar";
import AppLoadingOverlay from "@/components/ui/AppLoadingOverlay";
import AppModal from "@/components/ui/AppModal";
import ScreenContainer from "@/components/ui/ScreenContainer";
import { spacing } from "@/constants/theme";
import { useAuth } from "@/features/auth/use-auth";
import { useCustomerDashboard } from "@/features/customer/use-customer-dashboard";
import { toastError, toastSuccess } from "@/features/toast/toast-store";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useSingleNavigation } from "@/hooks/use-single-navigation";
import { markCarAsSold } from "@/services/customer/sell-car.service";

export default function CustomerMyCarsScreen() {
  const theme = useAppTheme();
  const { session } = useAuth();
  const { navigate } = useSingleNavigation();

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

      toastSuccess("The car has been marked as sold.", "Car Marked as Sold");
    } catch (error) {
      console.error("Failed to mark car as sold:", error);
      toastError(
        "We couldn't mark this car as sold. Please try again.",
        "Mark Sold Failed",
      );
    } finally {
      setIsMarkingSold(false);
    }
  };

  return (
    <ScreenContainer contentStyle={styles.screen}>
      <CustomerTopBar title="My Cars" showMenu />

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
              subtitle="Manage the vehicles you have listed on Shaz."
              actionLabel="Sell another car"
              onAction={() => navigate("/(customer)/sell-my-car")}
            />
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => {
          const isSold = item.status === "sold";
          const isActive = item.status === "active";
          const isVerified = item.isVerified;

          // SENIOR WEB RULE: Sirf draft, rejected aur active car edit ho sakti hai (pending locked hai)
          const canEdit =
            item.status === "draft" ||
            item.status === "rejected" ||
            item.status === "active";

          return (
            <CustomerListingCard
              car={item}
              onView={
                isActive
                  ? () =>
                      navigate("/(customer)/car/[carId]", {
                        carId: item.id,
                      })
                  : undefined
              }
              onEdit={
                canEdit
                  ? () =>
                      navigate("/(customer)/sell-my-car", {
                        editCarId: item.id,
                      })
                  : undefined
              }
              onRequestInspection={
                isActive && !isVerified
                  ? () =>
                      navigate("/(customer)/vehicle-inspection", {
                        carId: item.id,
                        registration: item.registration || "",
                        make: item.make || "",
                        model: item.model || "",
                        year: item.year ? String(item.year) : "",
                      })
                  : undefined
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
            emptyMessage="Cars you list on Shaz will appear here."
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
        destructive
      />

      <AppLoadingOverlay
        visible={isMarkingSold}
        message="Marking car as sold..."
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
