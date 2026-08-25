import { useQuery } from "@tanstack/react-query";

import {
  fetchCustomerInspectionDetail,
  fetchCustomerInspectionReport,
} from "@/services/customer/customer-inspection-detail.service";

export const customerInspectionDetailKeys = {
  detail: (
    customerId: string,
    inspectionId: string,
  ) =>
    [
      "customer-inspection-detail",
      customerId,
      inspectionId,
    ] as const,

  report: (
    customerId: string,
    inspectionId: string,
  ) =>
    [
      "customer-inspection-report",
      customerId,
      inspectionId,
    ] as const,
};

export function useCustomerInspectionDetail(
  customerId: string | undefined,
  inspectionId: string,
) {
  return useQuery({
    queryKey:
      customerInspectionDetailKeys.detail(
        customerId ?? "",
        inspectionId,
      ),
    queryFn: () =>
      fetchCustomerInspectionDetail(
        customerId!,
        inspectionId,
      ),
    enabled:
      Boolean(
        customerId &&
          inspectionId,
      ),
    staleTime:
      30_000,
  });
}

export function useCustomerInspectionReport(
  customerId: string | undefined,
  inspectionId: string,
) {
  return useQuery({
    queryKey:
      customerInspectionDetailKeys.report(
        customerId ?? "",
        inspectionId,
      ),
    queryFn: () =>
      fetchCustomerInspectionReport(
        customerId!,
        inspectionId,
      ),
    enabled:
      Boolean(
        customerId &&
          inspectionId,
      ),
    staleTime:
      30_000,
  });
}

