import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";

import CustomerBookingCard from "@/components/customer/CustomerBookingCard";
import CustomerListState from "@/components/customer/CustomerListState";
import CustomerPageHeader from "@/components/customer/CustomerPageHeader";
import CustomerTopBar from "@/components/customer/CustomerTopBar";
import ScreenContainer from "@/components/ui/ScreenContainer";
import { spacing } from "@/constants/theme";
import { useAuth } from "@/features/auth/use-auth";
import { useCustomerDashboard } from "@/features/customer/use-customer-dashboard";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useSingleNavigation } from "@/hooks/use-single-navigation";

export default function CustomerBookingsScreen() {
  const theme = useAppTheme();
  const { session } = useAuth();
  const { navigate } = useSingleNavigation();

  const query = useCustomerDashboard(session?.user.id);
  const bookings = query.data?.bookings ?? [];

  // AUTO REFRESH JAB USER IS TAB PAR AAYE (TAAKE NEW BOOKINGS FORAN DIKHEIN)
  useFocusEffect(
    useCallback(() => {
      void query.refetch();
    }, []),
  );

  return (
    <ScreenContainer contentStyle={styles.screen}>
      <CustomerTopBar title="Bookings" showMenu />

      <FlatList
        data={bookings}
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
              title="My bookings"
              subtitle="Your mobile service bookings and appointment status."
              actionLabel="Browse Mobile Services"
              actionVariant="secondary"
              onAction={() => navigate("/(customer)/mobile-services")}
            />
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <CustomerBookingCard
            booking={item}
            onViewDetails={() =>
              navigate("/(customer)/booking/[bookingId]", {
                bookingId: item.id,
              })
            }
          />
        )}
        ListEmptyComponent={
          <CustomerListState
            loading={query.isLoading}
            error={query.isError}
            empty={!query.isLoading && !query.isError && bookings.length === 0}
            emptyTitle="No mobile service bookings yet"
            emptyMessage="Book practical car care where your car is parked."
            onRetry={() => void query.refetch()}
          />
        }
      />
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
  },
  header: {
    marginBottom: spacing.xxl,
  },
  separator: {
    height: spacing.md,
  },
});
