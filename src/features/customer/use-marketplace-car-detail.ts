import { useQuery } from "@tanstack/react-query";

import { fetchMarketplaceCarDetail } from "@/services/customer/marketplace-detail.service";

export const marketplaceCarDetailKeys = {
  detail: (
    carId: string,
  ) =>
    [
      "marketplace-car-detail",
      carId,
    ] as const,
};

export function useMarketplaceCarDetail(
  carId: string,
) {
  return useQuery({
    queryKey:
      marketplaceCarDetailKeys.detail(
        carId,
      ),
    queryFn: () =>
      fetchMarketplaceCarDetail(
        carId,
      ),
    enabled:
      Boolean(carId),
    staleTime:
      30_000,
  });
}

