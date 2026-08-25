import { useQuery } from "@tanstack/react-query";
import { fetchCustomerParts, fetchPartCategories } from "@/services/customer/parts.service";

export const customerPartsKeys = {
  list: ["customer-parts"] as const,
  categories: ["customer-part-categories"] as const,
};

export function useCustomerParts() {
  return useQuery({
    queryKey: customerPartsKeys.list,
    queryFn: fetchCustomerParts,
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
