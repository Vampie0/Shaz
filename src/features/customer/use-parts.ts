// File: src/features/customer/use-parts.ts

import {
  fetchCompatibleParts,
  fetchCustomerParts,
  fetchPartCategories,
} from "@/services/customer/parts.service";
import { useQuery } from "@tanstack/react-query";

export const customerPartsKeys = {
  list: ["customer-parts"] as const,
  categories: ["customer-part-categories"] as const,
};

export function useCustomerParts(vehicleId?: string) {
  return useQuery({
    queryKey: [...customerPartsKeys.list, vehicleId || "all"],
    queryFn: () =>
      vehicleId ? fetchCompatibleParts(vehicleId) : fetchCustomerParts(),
    staleTime: 30_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  });
}

export function usePartCategories() {
  return useQuery({
    queryKey: customerPartsKeys.categories,
    queryFn: fetchPartCategories,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  });
}
