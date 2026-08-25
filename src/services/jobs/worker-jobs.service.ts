import { supabase } from "@/services/supabase/client";
import type {
  AssignmentStatus,
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
  if (!value) {
    return null;
  }

  return value.slice(0, 5);
}

function localPartsFromTimestamp(value: string | null) {
  if (!value) {
    return {
      date: null,
      time: null,
    };
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return {
      date: null,
      time: null,
    };
  }

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

function mapServiceJob(
  assignment: AssignmentRow,
  booking: ServiceBookingRow,
  serviceType: ServiceTypeRow | undefined,
): WorkerJob {
  return {
    assignmentId: assignment.id,
    jobId: booking.id,

    kind: "service",

    assignmentStatus: assignment.status,
    status: booking.status,

    title: serviceType?.name ?? "Mobile Service",

    vehicleLabel: buildVehicleLabel([booking.car_make, booking.car_model]),

    registration: booking.car_registration,

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

  return {
    assignmentId: assignment.id,
    jobId: request.id,

    kind: "inspection",

    assignmentStatus: assignment.status,
    status: request.status,

    title: "Vehicle Inspection",

    vehicleLabel: buildVehicleLabel([
      request.external_make ?? car?.make,
      request.external_model ?? car?.model,
    ]),

    registration: request.vehicle_registration ?? car?.registration ?? null,

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
    .order("assigned_at", {
      ascending: false,
    })
    .limit(200);

  if (error) {
    throw error;
  }

  return (data as unknown as AssignmentRow[] | null) ?? [];
}

async function fetchServiceBookings(ids: string[]) {
  if (ids.length === 0) {
    return [] as ServiceBookingRow[];
  }

  const { data, error } = await supabase
    .from("service_bookings")
    .select(
      [
        "id",
        "service_type_id",
        "car_make",
        "car_model",
        "car_registration",
        "address_line_1",
        "address_line_2",
        "city",
        "postcode",
        "preferred_date",
        "preferred_time",
        "notes",
        "status",
        "completed_at",
      ].join(","),
    )
    .in("id", ids);

  if (error) {
    throw error;
  }

  return (data as unknown as ServiceBookingRow[] | null) ?? [];
}

async function fetchVerificationRequests(ids: string[]) {
  if (ids.length === 0) {
    return [] as VerificationRequestRow[];
  }

  const { data, error } = await supabase
    .from("verification_requests")
    .select(
      [
        "id",
        "car_id",
        "seller_name",
        "seller_phone",
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
      ].join(","),
    )
    .in("id", ids);

  if (error) {
    throw error;
  }

  return (data as unknown as VerificationRequestRow[] | null) ?? [];
}

async function fetchServiceTypes(ids: string[]) {
  if (ids.length === 0) {
    return [] as ServiceTypeRow[];
  }

  const { data, error } = await supabase
    .from("service_types")
    .select("id,name")
    .in("id", ids);

  if (error) {
    throw error;
  }

  return (data as unknown as ServiceTypeRow[] | null) ?? [];
}

async function fetchCars(ids: string[]) {
  if (ids.length === 0) {
    return [] as CarRow[];
  }

  const { data, error } = await supabase
    .from("cars")
    .select(
      [
        "id",
        "make",
        "model",
        "year",
        "mileage",
        "registration",
        "postcode",
      ].join(","),
    )
    .in("id", ids);

  if (error) {
    throw error;
  }

  return (data as unknown as CarRow[] | null) ?? [];
}

export async function fetchWorkerJobs(
  employeeId: string,
): Promise<WorkerJob[]> {
  const assignments = await fetchAssignments(employeeId);

  if (assignments.length === 0) {
    return [];
  }

  const serviceBookingIds = assignments
    .map((item) => item.service_booking_id)
    .filter((value): value is string => Boolean(value));

  const verificationIds = assignments
    .map((item) => item.verification_request_id)
    .filter((value): value is string => Boolean(value));

  const [serviceBookings, verificationRequests] = await Promise.all([
    fetchServiceBookings(serviceBookingIds),
    fetchVerificationRequests(verificationIds),
  ]);

  const serviceTypeIds = serviceBookings
    .map((item) => item.service_type_id)
    .filter((value): value is string => Boolean(value));

  const carIds = verificationRequests
    .map((item) => item.car_id)
    .filter((value): value is string => Boolean(value));

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

      if (!booking) {
        continue;
      }

      jobs.push(
        mapServiceJob(
          assignment,
          booking,
          booking.service_type_id
            ? serviceTypeMap.get(booking.service_type_id)
            : undefined,
        ),
      );

      continue;
    }

    if (assignment.verification_request_id) {
      const request = requestMap.get(assignment.verification_request_id);

      if (!request) {
        continue;
      }

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
    .eq("id", assignmentId)
    .eq("employee_id", employeeId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const assignment = data as unknown as AssignmentRow | null;

  if (!assignment) {
    throw new Error("Job assignment was not found.");
  }

  if (assignment.service_booking_id) {
    const { data: bookingData, error: bookingError } = await supabase
      .from("service_bookings")
      .select(
        [
          "id",
          "service_type_id",
          "car_make",
          "car_model",
          "car_registration",
          "address_line_1",
          "address_line_2",
          "city",
          "postcode",
          "preferred_date",
          "preferred_time",
          "notes",
          "status",
          "completed_at",
        ].join(","),
      )
      .eq("id", assignment.service_booking_id)
      .single();

    if (bookingError) {
      throw bookingError;
    }

    const booking = bookingData as unknown as ServiceBookingRow;

    let serviceType: ServiceTypeRow | undefined;

    if (booking.service_type_id) {
      const { data: serviceTypeData, error: serviceTypeError } = await supabase
        .from("service_types")
        .select("id,name")
        .eq("id", booking.service_type_id)
        .maybeSingle();

      if (serviceTypeError) {
        throw serviceTypeError;
      }

      serviceType =
        (serviceTypeData as unknown as ServiceTypeRow | null) ?? undefined;
    }

    let customerName: string | null = null;

    let customerPhone: string | null = null;

    const { data: contactData, error: contactError } = await supabase.rpc(
      "get_assigned_service_customer_contact",
      {
        p_booking_id: booking.id,
      },
    );

    if (contactError) {
      /**
       * Contact is useful but should not make the
       * whole job detail screen fail if an older
       * environment does not expose it.
       */
      console.warn("Customer contact RPC failed:", contactError.message);
    } else {
      const contact = Array.isArray(contactData) ? contactData[0] : contactData;

      if (contact && typeof contact === "object") {
        const value = contact as Record<string, unknown>;

        customerName =
          typeof value.full_name === "string" ? value.full_name : null;

        customerPhone = typeof value.phone === "string" ? value.phone : null;
      }
    }

    return {
      ...mapServiceJob(assignment, booking, serviceType),

      customerName,
      customerPhone,

      serviceTypeId: booking.service_type_id,

      carId: null,
      mileage: null,
      vehicleYear: null,
    };
  }

  if (assignment.verification_request_id) {
    const { data: requestData, error: requestError } = await supabase
      .from("verification_requests")
      .select(
        [
          "id",
          "car_id",
          "seller_name",
          "seller_phone",
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
        ].join(","),
      )
      .eq("id", assignment.verification_request_id)
      .single();

    if (requestError) {
      throw requestError;
    }

    const request = requestData as unknown as VerificationRequestRow;

    let car: CarRow | undefined;

    if (request.car_id) {
      const { data: carData, error: carError } = await supabase
        .from("cars")
        .select(
          [
            "id",
            "make",
            "model",
            "year",
            "mileage",
            "registration",
            "postcode",
          ].join(","),
        )
        .eq("id", request.car_id)
        .maybeSingle();

      if (carError) {
        throw carError;
      }

      car = (carData as unknown as CarRow | null) ?? undefined;
    }

    return {
      ...mapInspectionJob(assignment, request, car),

      customerName: request.seller_name,

      customerPhone: request.seller_phone,

      serviceTypeId: null,
      carId: request.car_id,

      mileage: car?.mileage ?? null,

      vehicleYear: request.external_year ?? car?.year ?? null,
    };
  }

  throw new Error("This assignment is not linked to a supported job.");
}

export async function advanceServiceBooking(
  bookingId: string,
  target: "on_the_way" | "in_progress" | "completed",
) {
  const { error } = await supabase.rpc("advance_service_booking", {
    p_booking_id: bookingId,
    p_target: target,
  });

  if (error) {
    throw error;
  }
}

export async function startVerificationInspection(
  verificationRequestId: string,
) {
  const { error } = await supabase.rpc("start_verification_inspection", {
    p_id: verificationRequestId,
  });

  if (error) {
    throw error;
  }
}
