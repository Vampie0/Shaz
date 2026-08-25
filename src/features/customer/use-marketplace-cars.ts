import { useQuery } from "@tanstack/react-query";

import { fetchMarketplaceCars } from "@/services/customer/marketplace.service";

export const marketplaceKeys = {
  cars:
    [
      "marketplace-cars",
      "v2",
    ] as const,
};

export function useMarketplaceCars() {
  return useQuery({
    queryKey:
      marketplaceKeys.cars,
    queryFn:
      fetchMarketplaceCars,
    staleTime: 30_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  });
}

