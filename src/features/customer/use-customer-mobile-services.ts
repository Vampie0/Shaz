import { useQuery } from "@tanstack/react-query";

import { fetchCustomerMobileServices } from "@/services/customer/customer-mobile-services.service";

export const customerMobileServiceKeys = {
  list:
    [
      "customer-mobile-services",
    ] as const,
};

export function useCustomerMobileServices() {
  return useQuery({
    queryKey:
      customerMobileServiceKeys.list,
    queryFn:
      fetchCustomerMobileServices,
    staleTime:
      60_000,
    gcTime:
      10 * 60_000,
    refetchOnWindowFocus:
      false,
  });
}

