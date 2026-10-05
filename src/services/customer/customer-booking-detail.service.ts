import { supabase } from "@/services/supabase/client";
import type { CustomerBookingDetail } from "@/types/customer-booking-detail";

type BookingRow = {
  id: string;
  customer_id: string;
  service_type_id: string;
  car_make: string;
  car_model: string;
  car_registration: string | null;
  vehicle_year: number | null;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  postcode: string;
  preferred_date: string;
  preferred_time: string;
  notes: string | null;
  status: string;
  quoted_price: number | string | null;
  oil_product_name: string | null;
  oil_viscosity_grade: string | null;
  oil_fitment_status: string | null;
  cancellation_reason: string | null;
  created_at: string;
};

type ServiceTypeRow = {
  id: string;
  name: string;
  base_price: number | string;
};

function toNumberOrNull(value: number | string | null) {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function fetchCustomerBookingDetail(
  customerId: string,
  bookingId: string,
): Promise<CustomerBookingDetail> {
  const { data: bookingData, error: bookingError } = await supabase
    .from("service_bookings")
    .select(
      [
        "id",
        "customer_id",
        "service_type_id",
        "car_make",
        "car_model",
        "car_registration",
        "vehicle_year",
        "address_line_1",
        "address_line_2",
        "city",
        "postcode",
        "preferred_date",
        "preferred_time",
        "notes",
        "status",
        "quoted_price",
        "oil_product_name",
        "oil_viscosity_grade",
        "oil_fitment_status",
        "cancellation_reason",
        "created_at",
      ].join(","),
    )
    .eq("id", bookingId)
    .eq("customer_id", customerId)
    .maybeSingle();

  if (bookingError) throw bookingError;

  const booking = bookingData as unknown as BookingRow | null;
  if (!booking) throw new Error("This booking could not be found.");

  const { data: serviceData, error: serviceError } = await supabase
    .from("service_types")
    .select("id,name,base_price")
    .eq("id", booking.service_type_id)
    .maybeSingle();

  if (serviceError) throw serviceError;

  const service = serviceData as unknown as ServiceTypeRow | null;

  return {
    id: booking.id,
    customerId: booking.customer_id,
    serviceTypeId: booking.service_type_id,
    serviceName: service?.name ?? "Mobile Service",
    serviceBasePrice: toNumberOrNull(service?.base_price ?? null),
    carMake: booking.car_make,
    carModel: booking.car_model,
    registration: booking.car_registration,
    vehicleYear: booking.vehicle_year,
    addressLine1: booking.address_line_1,
    addressLine2: booking.address_line_2,
    city: booking.city,
    postcode: booking.postcode,
    preferredDate: booking.preferred_date,
    preferredTime: booking.preferred_time,
    notes: booking.notes,
    status: booking.status,
    quotedPrice: toNumberOrNull(booking.quoted_price),
    oilProductName: booking.oil_product_name,
    oilViscosityGrade: booking.oil_viscosity_grade,
    oilFitmentStatus: booking.oil_fitment_status,
    cancellationReason: booking.cancellation_reason,
    createdAt: booking.created_at,
  };
}

export async function cancelCustomerServiceBooking(
  bookingId: string,
  reason?: string,
) {
  const { error } = await supabase.rpc("cancel_own_service_booking", {
    p_booking_id: bookingId,
    p_reason: reason || undefined,
  });

  if (error) {
    throw new Error(
      error.message || "This booking can no longer be cancelled online.",
    );
  }
}
