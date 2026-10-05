import { supabase } from "@/services/supabase/client";
import type {
  CustomerInspectionDetail,
  CustomerInspectionReport,
  CustomerInspectionReportImage,
  CustomerInspectionVehicle,
} from "@/types/customer-inspection-detail";

type VerificationRequestRow = {
  id: string;
  requested_by: string;
  car_id: string | null;
  inspection_type: string;

  vehicle_registration: string;
  inspection_address: string;
  city: string;
  postcode: string;

  preferred_date: string | null;
  preferred_time: string | null;
  scheduled_for: string | null;

  status: string;
  external_make: string | null;
  external_model: string | null;
  external_year: number | null;
  notes: string | null;

  confirmed_at: string | null;
  inspection_started_at: string | null;
  report_submitted_at: string | null;
  completed_at: string | null;
};

type CarRow = {
  id: string;
  make: string;
  model: string;
  variant: string | null;
  year: number;
  registration: string | null;

  price: number | string;
  mileage: number;
  fuel_type: string;
  transmission: string;
  status: string;
};

type CarImageRow = {
  storage_path: string;
  sort_order: number;
  is_primary: boolean;
};

type InspectionReportRow = {
  id: string;
  verification_request_id: string;
  overall_result: string | null;
  summary: string | null;

  body_condition: string;
  tyre_condition: string;
  interior_condition: string;
  engine_condition: string;
  brakes_condition: string;

  mileage_checked: boolean;
  registration_checked: boolean;
  submitted_at: string | null;
};

type InspectionReportImageRow = {
  id: string;
  storage_path: string;
  caption: string | null;
  sort_order: number;
  evidence_expires_at: string | null;
};

async function signedStorageUrl(
  bucket: "car-images" | "inspection-images",
  storagePath: string,
) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(storagePath, 60 * 60);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}

async function fetchInspectionVehicle(
  carId: string | null,
): Promise<CustomerInspectionVehicle | null> {
  if (!carId) {
    return null;
  }

  const { data, error } = await supabase
    .from("cars")
    .select(
      [
        "id",
        "make",
        "model",
        "variant",
        "year",
        "registration",
        "price",
        "mileage",
        "fuel_type",
        "transmission",
        "status",
      ].join(","),
    )
    .eq("id", carId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const car = data as unknown as CarRow | null;

  if (!car) {
    return null;
  }

  const { data: imageData, error: imageError } = await supabase
    .from("car_images")
    .select("storage_path,sort_order,is_primary")
    .eq("car_id", carId)
    .order("sort_order", { ascending: true });

  if (imageError) {
    console.warn(
      "Inspection vehicle image could not be loaded:",
      imageError.message,
    );
  }

  const images = (imageData as unknown as CarImageRow[] | null) ?? [];
  const primary = images.find((image) => image.is_primary) ?? images[0];

  const imageUrl = primary
    ? await signedStorageUrl("car-images", primary.storage_path)
    : null;

  return {
    id: car.id,
    make: car.make,
    model: car.model,
    variant: car.variant,
    year: car.year,
    registration: car.registration,
    price: Number(car.price),
    mileage: car.mileage,
    fuelType: car.fuel_type,
    transmission: car.transmission,
    status: car.status,
    imageUrl,
  };
}

export async function fetchCustomerInspectionDetail(
  customerId: string,
  inspectionId: string,
): Promise<CustomerInspectionDetail> {
  const { data, error } = await supabase
    .from("verification_requests")
    .select(
      [
        "id",
        "requested_by",
        "car_id",
        "inspection_type",
        "vehicle_registration",
        "inspection_address",
        "city",
        "postcode",
        "preferred_date",
        "preferred_time",
        "scheduled_for",
        "status",
        "external_make",
        "external_model",
        "external_year",
        "notes",
        "confirmed_at",
        "inspection_started_at",
        "report_submitted_at",
        "completed_at",
      ].join(","),
    )
    .eq("id", inspectionId)
    .eq("requested_by", customerId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const request = data as unknown as VerificationRequestRow | null;

  if (!request) {
    throw new Error("This inspection could not be found.");
  }

  const vehicle = await fetchInspectionVehicle(request.car_id);

  return {
    id: request.id,
    requestedBy: request.requested_by,
    carId: request.car_id,
    inspectionType: request.inspection_type,
    registration: request.vehicle_registration,
    make: request.external_make ?? vehicle?.make ?? null,
    model: request.external_model ?? vehicle?.model ?? null,
    year: request.external_year ?? vehicle?.year ?? null,
    inspectionAddress: request.inspection_address,
    city: request.city,
    postcode: request.postcode,
    preferredDate: request.preferred_date,
    preferredTime: request.preferred_time,
    scheduledFor: request.scheduled_for,
    status: request.status,
    notes: request.notes,
    confirmedAt: request.confirmed_at,
    inspectionStartedAt: request.inspection_started_at,
    reportSubmittedAt: request.report_submitted_at,
    completedAt: request.completed_at,
    vehicle,
  };
}

export async function fetchCustomerInspectionReport(
  customerId: string,
  inspectionId: string,
): Promise<CustomerInspectionReport> {
  const inspection = await fetchCustomerInspectionDetail(
    customerId,
    inspectionId,
  );

  if (
    inspection.status !== "completed" &&
    inspection.status !== "report_submitted"
  ) {
    throw new Error("The inspection report is not ready to view yet.");
  }

  const { data, error } = await supabase
    .from("inspection_reports")
    .select(
      [
        "id",
        "verification_request_id",
        "overall_result",
        "summary",
        "body_condition",
        "tyre_condition",
        "interior_condition",
        "engine_condition",
        "brakes_condition",
        "mileage_checked",
        "registration_checked",
        "submitted_at",
      ].join(","),
    )
    .eq("verification_request_id", inspectionId)
    .not("submitted_at", "is", null)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const report = data as unknown as InspectionReportRow | null;

  if (!report) {
    throw new Error("The submitted inspection report could not be found.");
  }

  const { data: imageData, error: imageError } = await supabase
    .from("inspection_report_images")
    .select("id,storage_path,caption,sort_order,evidence_expires_at")
    .eq("inspection_report_id", report.id)
    .order("sort_order", { ascending: true });

  if (imageError) {
    throw imageError;
  }

  const imageRows =
    (imageData as unknown as InspectionReportImageRow[] | null) ?? [];

  const signedImages = await Promise.all(
    imageRows.map(
      async (image): Promise<CustomerInspectionReportImage | null> => {
        const url = await signedStorageUrl(
          "inspection-images",
          image.storage_path,
        );
        if (!url) return null;
        return { id: image.id, url, caption: image.caption };
      },
    ),
  );

  return {
    inspection,
    id: report.id,
    overallResult: report.overall_result,
    summary: report.summary,
    bodyCondition: report.body_condition,
    tyreCondition: report.tyre_condition,
    interiorCondition: report.interior_condition,
    engineCondition: report.engine_condition,
    brakesCondition: report.brakes_condition,
    mileageChecked: report.mileage_checked,
    registrationChecked: report.registration_checked,
    submittedAt: report.submitted_at,
    evidenceExpiresAt: imageRows[0]?.evidence_expires_at ?? null,
    images: signedImages.filter(
      (img): img is CustomerInspectionReportImage => img !== null,
    ),
  };
}

export type CreateInspectionRequestInput = {
  customerId: string;
  carId?: string | null;
  registration: string;
  make: string;
  model: string;
  year?: string | number | null;
  contactName?: string;
  contactPhone?: string;
  address: string;
  city: string;
  postcode: string;
  preferredDate: string;
  preferredTime: string;
  notes?: string;
};

const activeStatuses = [
  "pending",
  "confirmed",
  "assigned",
  "inspection_scheduled",
  "inspection_in_progress",
  "report_submitted",
] as const;

function parsePreferredDate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.includes("-")) return trimmed;
  const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) throw new Error("Preferred date must use DD/MM/YYYY.");
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parsePreferredTime(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!match) throw new Error("Preferred time must use HH:MM.");
  const hour = String(Number(match[1])).padStart(2, "0");
  const minute = match[2];
  return `${hour}:${minute}:00`;
}

function parseYear(value: string | number | null | undefined) {
  if (!value) return null;
  const parsed = Number(value);
  const currentYear = new Date().getFullYear();
  if (Number.isInteger(parsed) && parsed >= 1900 && parsed <= currentYear + 1) {
    return parsed;
  }
  return null;
}

export async function createCustomerInspectionRequest(
  input: CreateInspectionRequestInput,
) {
  const preferredDate = parsePreferredDate(input.preferredDate);
  const preferredTime = parsePreferredTime(input.preferredTime);
  const externalYear = parseYear(input.year);

  let inspectionType: "seller_pre_inspection" | "buyer_inspection" =
    "buyer_inspection";

  if (input.carId) {
    const { data: car } = await supabase
      .from("cars")
      .select("id,seller_id")
      .eq("id", input.carId)
      .eq("status", "active")
      .maybeSingle();

    if (!car) {
      throw new Error(
        "This marketplace listing is no longer available for inspection.",
      );
    }

    inspectionType =
      car.seller_id === input.customerId
        ? "seller_pre_inspection"
        : "buyer_inspection";

    const { data: existing } = await supabase
      .from("verification_requests")
      .select("id,inspection_type,status,requested_by")
      .eq("car_id", input.carId)
      .in("status", [...activeStatuses, "completed"]);

    if (
      existing?.some((request) =>
        activeStatuses.includes(request.status as any),
      )
    ) {
      throw new Error("An inspection is already in progress for this vehicle.");
    }

    if (
      inspectionType === "seller_pre_inspection" &&
      existing?.some(
        (request) => request.inspection_type === "seller_pre_inspection",
      )
    ) {
      throw new Error(
        "This listing already has an inspection request. Open it from your listings to check its progress.",
      );
    }

    if (
      inspectionType === "buyer_inspection" &&
      existing?.some(
        (request) => request.inspection_type === "seller_pre_inspection",
      )
    ) {
      throw new Error(
        "This listing already has a seller inspection in progress or completed. Use the inspection information on the listing.",
      );
    }
  }

  const { data, error } = await supabase.rpc("create_verification_request", {
    p_car_id: input.carId || null,
    p_registration: input.registration.trim().toUpperCase(),
    p_make: input.make.trim(),
    p_model: input.model.trim(),
    p_year: externalYear,
    p_seller_name: input.contactName?.trim() || "Customer",
    p_seller_phone: input.contactPhone?.trim() || "Not provided",
    p_address: input.address.trim(),
    p_city: input.city.trim(),
    p_postcode: input.postcode.trim().toUpperCase(),
    p_preferred_date: preferredDate,
    p_preferred_time: preferredTime,
    p_inspection_type: inspectionType,
    p_notes: input.notes?.trim() || undefined,
  });

  if (error || !data) {
    throw new Error(
      error?.message ||
        "We could not submit this inspection request. Check the details and try again.",
    );
  }

  return data;
}

export async function cancelCustomerInspectionRequest(inspectionId: string) {
  const { error } = await supabase.rpc("cancel_own_verification_request", {
    p_id: inspectionId,
  });

  if (error) {
    throw new Error(
      error.message || "This inspection request can no longer be cancelled.",
    );
  }
}
