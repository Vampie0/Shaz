import { useQuery } from "@tanstack/react-query";

import { fetchCustomerDashboard } from "@/services/customer/customer-dashboard.service";

export const customerDashboardKeys = {
  root: (customerId: string) =>
    [
      "customer-dashboard",
      customerId,
    ] as const,
};

export function useCustomerDashboard(
  customerId: string | undefined,
) {
  return useQuery({
    queryKey:
      customerDashboardKeys.root(
        customerId ?? "none",
      ),

    queryFn: () =>
      fetchCustomerDashboard(
        customerId as string,
      ),

    enabled: Boolean(customerId),

    staleTime: 30_000,
    gcTime: 10 * 60_000,

    refetchOnWindowFocus: false,
  });
}

