import { supabase } from "@/services/supabase/client";
import type {
  AssignmentStatus,
  InspectionType,
  ServiceBookingStatus,
  VerificationRequestStatus,
  WorkerJob,
  WorkerJobDetail,
} from "@/types/job";

type AssignmentRow = {
  id: string;
  service_booking_id: string | null;
  verification_request_id: string | null;
  employee_id: string;
  status: AssignmentStatus;
  assigned_at: string;
  accepted_at: string | null;
  completed_at: string | null;
  notes: string | null;
};

type ProfileJoin =
  | { full_name: string | null; phone: string | null }
  | { full_name: string | null; phone: string | null }[]
  | null;

type ServiceBookingRow = {
  id: string;
  service_type_id: string | null;
  car_make: string | null;
  car_model: string | null;
  car_registration: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  postcode: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  notes: string | null;
  status: ServiceBookingStatus;
  completed_at: string | null;
  profiles?: ProfileJoin;
};

type ServiceTypeRow = {
  id: string;
  name: string;
};

type VerificationRequestRow = {
  id: string;
  car_id: string | null;
  seller_name: string | null;
  seller_phone: string | null;
  vehicle_registration: string | null;
  inspection_address: string | null;
  city: string | null;
  postcode: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  scheduled_for: string | null;
  status: VerificationRequestStatus;
  inspection_type: InspectionType | null;
  external_make: string | null;
  external_model: string | null;
  external_year: number | null;
  notes: string | null;
};

type CarRow = {
  id: string;
  make: string | null;
  model: string | null;
  year: number | null;
  mileage: number | null;
  registration: string | null;
  postcode: string | null;
};

function unwrapProfile(profiles: ProfileJoin) {
  const profile = Array.isArray(profiles) ? profiles[0] : profiles;
  return {
    full_name: profile?.full_name ?? null,
    phone: profile?.phone ?? null,
  };
}

function joinAddress(parts: Array<string | null | undefined>) {
  return parts
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(", ");
}

function buildVehicleLabel(parts: Array<string | number | null | undefined>) {
  const value = parts
    .map((item) =>
      item === null || item === undefined ? "" : String(item).trim(),
    )
    .filter(Boolean)
    .join(" ");

  return value || "Vehicle";
}

function normaliseTime(value: string | null) {
  if (!value) return null;
  return value.slice(0, 5);
}

function localPartsFromTimestamp(value: string | null) {
  if (!value) return { date: null, time: null };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: null, time: null };

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return {
    date: year + "-" + month + "-" + day,
    time: hour + ":" + minute,
  };
}

function inspectionLabels(inspectionType: InspectionType | null) {
  if (inspectionType === "seller_pre_inspection") {
    return {
      jobTypeLabel: "Seller Pre-Inspection",
      title: "Seller Pre-Inspection",
    };
  }

  return {
    jobTypeLabel: "Vehicle Inspection",
    title: "Buyer Pre-purchase Inspection",
  };
}

function mapServiceJob(
  assignment: AssignmentRow,
  booking: ServiceBookingRow,
  serviceType: ServiceTypeRow | undefined,
): WorkerJob {
  const profile = unwrapProfile(booking.profiles ?? null);

  return {
    assignmentId: assignment.id,
    jobId: booking.id,
    kind: "service",
    jobTypeLabel: "Mobile Service",
    inspectionType: null,
    assignmentStatus: assignment.status,
    status: booking.status,
    title: serviceType?.name ?? "Mobile Car Service",
    vehicleLabel: buildVehicleLabel([booking.car_make, booking.car_model]),
    registration: booking.car_registration,
    customerName: profile.full_name ?? "Customer",
    customerPhone: profile.phone,
    address: joinAddress([
      booking.address_line_1,
      booking.address_line_2,
      booking.city,
      booking.postcode,
    ]),
    city: booking.city,
    postcode: booking.postcode,
    scheduledDate: booking.preferred_date,
    scheduledTime: normaliseTime(booking.preferred_time),
    scheduledTimestamp: null,
    notes: booking.notes ?? assignment.notes,
    completedAt: booking.completed_at ?? assignment.completed_at,
  };
}

function mapInspectionJob(
  assignment: AssignmentRow,
  request: VerificationRequestRow,
  car: CarRow | undefined,
): WorkerJob {
  const scheduled = localPartsFromTimestamp(request.scheduled_for);
  const labels = inspectionLabels(request.inspection_type);

  return {
    assignmentId: assignment.id,
    jobId: request.id,
    kind: "inspection",
    jobTypeLabel: labels.jobTypeLabel,
    inspectionType: request.inspection_type,
    assignmentStatus: assignment.status,
    status: request.status,
    title: labels.title,
    vehicleLabel: buildVehicleLabel([
      request.external_make ?? car?.make,
      request.external_model ?? car?.model,
    ]),
    registration: request.vehicle_registration ?? car?.registration ?? null,
    customerName: request.seller_name ?? "Seller/Customer",
    customerPhone: request.seller_phone,
    address: joinAddress([
      request.inspection_address,
      request.city,
      request.postcode,
    ]),
    city: request.city,
    postcode: request.postcode ?? car?.postcode ?? null,
    scheduledDate: scheduled.date ?? request.preferred_date,
    scheduledTime: scheduled.time ?? normaliseTime(request.preferred_time),
    scheduledTimestamp: request.scheduled_for,
    notes: request.notes ?? assignment.notes,
    completedAt: assignment.completed_at,
  };
}

async function fetchAssignments(employeeId: string) {
  const { data, error } = await supabase
    .from("employee_assignments")
    .select(
      [
        "id",
        "service_booking_id",
        "verification_request_id",
        "employee_id",
        "status",
        "assigned_at",
        "accepted_at",
        "completed_at",
        "notes",
      ].join(","),
    )
    .eq("employee_id", employeeId)
    .in("status", ["assigned", "accepted", "in_progress", "completed"])

    .order("assigned_at", { ascending: false })
    .limit(200);

  if (error) throw error;
  return (data as unknown as AssignmentRow[] | null) ?? [];
}

async function fetchServiceBookings(ids: string[]) {
  if (ids.length === 0) return [] as ServiceBookingRow[];

  const { data, error } = await supabase
    .from("service_bookings")
    .select(
      `
      id,
      service_type_id,
      car_make,
      car_model,
      car_registration,
      address_line_1,
      address_line_2,
      city,
      postcode,
      preferred_date,
      preferred_time,
      notes,
      status,
      completed_at,
      profiles:customer_id (full_name, phone)
    `,
    )
    .in("id", ids);

  if (error) throw error;
  return (data as unknown as ServiceBookingRow[] | null) ?? [];
}

async function fetchVerificationRequests(ids: string[]) {
  if (ids.length === 0) return [] as VerificationRequestRow[];

  const { data, error } = await supabase
    .from("verification_requests")
    .select("*")
    .in("id", ids);

  if (error) throw error;
  return (data as unknown as VerificationRequestRow[] | null) ?? [];
}

async function fetchServiceTypes(ids: string[]) {
  if (ids.length === 0) return [] as ServiceTypeRow[];
  const { data, error } = await supabase
    .from("service_types")
    .select("id,name")
    .in("id", ids);
  if (error) throw error;
  return (data as unknown as ServiceTypeRow[] | null) ?? [];
}

async function fetchCars(ids: string[]) {
  if (ids.length === 0) return [] as CarRow[];
  const { data, error } = await supabase
    .from("cars")
    .select("id,make,model,year,mileage,registration,postcode")
    .in("id", ids);
  if (error) throw error;
  return (data as unknown as CarRow[] | null) ?? [];
}

async function fetchServiceCustomerContact(bookingId: string) {
  const { data, error } = await supabase.rpc(
    "get_assigned_service_customer_contact",
    { p_booking_id: bookingId },
  );

  if (error) {
    return { full_name: null, phone: null };
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    full_name: row?.full_name ?? null,
    phone: row?.phone ?? null,
  };
}

export async function fetchWorkerJobs(
  employeeId: string,
): Promise<WorkerJob[]> {
  const assignments = await fetchAssignments(employeeId);
  if (assignments.length === 0) return [];

  const serviceBookingIds = assignments
    .map((item) => item.service_booking_id)
    .filter((v): v is string => Boolean(v));
  const verificationIds = assignments
    .map((item) => item.verification_request_id)
    .filter((v): v is string => Boolean(v));

  const [serviceBookings, verificationRequests] = await Promise.all([
    fetchServiceBookings(serviceBookingIds),
    fetchVerificationRequests(verificationIds),
  ]);

  const serviceTypeIds = serviceBookings
    .map((item) => item.service_type_id)
    .filter((v): v is string => Boolean(v));
  const carIds = verificationRequests
    .map((item) => item.car_id)
    .filter((v): v is string => Boolean(v));

  const [serviceTypes, cars] = await Promise.all([
    fetchServiceTypes(Array.from(new Set(serviceTypeIds))),
    fetchCars(Array.from(new Set(carIds))),
  ]);

  const bookingMap = new Map(serviceBookings.map((item) => [item.id, item]));
  const requestMap = new Map(
    verificationRequests.map((item) => [item.id, item]),
  );
  const serviceTypeMap = new Map(serviceTypes.map((item) => [item.id, item]));
  const carMap = new Map(cars.map((item) => [item.id, item]));

  const jobs: WorkerJob[] = [];

  for (const assignment of assignments) {
    if (assignment.service_booking_id) {
      const booking = bookingMap.get(assignment.service_booking_id);
      if (!booking) continue;
      jobs.push(
        mapServiceJob(
          assignment,
          booking,
          booking.service_type_id
            ? serviceTypeMap.get(booking.service_type_id)
            : undefined,
        ),
      );
    } else if (assignment.verification_request_id) {
      const request = requestMap.get(assignment.verification_request_id);
      if (!request) continue;
      jobs.push(
        mapInspectionJob(
          assignment,
          request,
          request.car_id ? carMap.get(request.car_id) : undefined,
        ),
      );
    }
  }

  return jobs;
}

export async function fetchWorkerJobDetail(
  employeeId: string,
  assignmentId: string,
): Promise<WorkerJobDetail> {
  const { data, error } = await supabase
    .from("employee_assignments")
    .select("*")
    .eq("id", assignmentId)
    .eq("employee_id", employeeId)
    .single();

  if (error) throw error;
  const assignment = data as unknown as AssignmentRow;

  if (assignment.service_booking_id) {
    const bookings = await fetchServiceBookings([
      assignment.service_booking_id,
    ]);
    const booking = bookings[0];
    let serviceType;
    if (booking.service_type_id) {
      const types = await fetchServiceTypes([booking.service_type_id]);
      serviceType = types[0];
    }
    const mapped = mapServiceJob(assignment, booking, serviceType);
    const contact = await fetchServiceCustomerContact(booking.id);

    return {
      ...mapped,
      customerName: contact.full_name ?? mapped.customerName,
      customerPhone: contact.phone ?? mapped.customerPhone,
      serviceTypeId: booking.service_type_id,
      carId: null,
      mileage: null,
      vehicleYear: null,
    };
  }

  const requests = await fetchVerificationRequests([
    assignment.verification_request_id!,
  ]);
  const request = requests[0];
  let car;
  if (request.car_id) {
    const cars = await fetchCars([request.car_id]);
    car = cars[0];
  }
  const mapped = mapInspectionJob(assignment, request, car);

  return {
    ...mapped,
    serviceTypeId: null,
    carId: request.car_id,
    mileage: car?.mileage ?? null,
    vehicleYear: request.external_year ?? car?.year ?? null,
  };
}

export async function advanceServiceBooking(
  bookingId: string,
  target: "on_the_way" | "in_progress" | "completed",
) {
  const { error } = await supabase.rpc("advance_service_booking", {
    p_booking_id: bookingId,
    p_target: target,
  });
  if (error) throw error;
}

export async function startVerificationInspection(
  verificationRequestId: string,
) {
  const { error } = await supabase.rpc("start_verification_inspection", {
    p_id: verificationRequestId,
  });
  if (error) throw error;
}
