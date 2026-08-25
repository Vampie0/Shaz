import { useQuery } from "@tanstack/react-query";

import { fetchCustomerBookingDetail } from "@/services/customer/customer-booking-detail.service";

export const customerBookingDetailKeys = {
  detail: (
    customerId: string,
    bookingId: string,
  ) =>
    [
      "customer-booking-detail",
      customerId,
      bookingId,
    ] as const,
};

export function useCustomerBookingDetail(
  customerId: string | undefined,
  bookingId: string,
) {
  return useQuery({
    queryKey:
      customerBookingDetailKeys.detail(
        customerId ?? "",
        bookingId,
      ),
    queryFn: () =>
      fetchCustomerBookingDetail(
        customerId!,
        bookingId,
      ),
    enabled:
      Boolean(
        customerId &&
          bookingId,
      ),
    staleTime:
      30_000,
  });
}

