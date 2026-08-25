import { supabase } from "@/services/supabase/client";
import type {
  CustomerBooking,
  CustomerCar,
  CustomerDashboardData,
  CustomerGarageVehicle,
  CustomerInspection,
} from "@/types/customer";

type CarRow = {
  id: string;
  seller_id: string;
  make: string;
  model: string;
  variant: string | null;
  year: number;
  price: number | string | null;
  mileage: number | null;
  fuel_type: string | null;
  colour: string | null;
  registration: string | null;
  city: string | null;
  postcode: string | null;
  status: string;
  is_verified: boolean;
  created_at: string;
  published_at: string | null;
};

type GarageVehicleRow = {
  id: string;
  customer_id: string;
  registration: string;
  make: string;
  model: string;
  year: number;
  fuel_type: string | null;
  colour: string | null;
  mot_expiry: string | null;
  engine_capacity_cc: number | null;
  created_at: string;
  updated_at: string;
};

type CarImageRow = {
  car_id: string;
  storage_path: string;
  sort_order: number;
  is_primary: boolean;
};

type ServiceBookingRow = {
  id: string;
  customer_id: string;
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
  status: string;
  quoted_price: number | string | null;
  created_at: string;
};

type ServiceTypeRow = {
  id: string;
  name: string;
  base_price: number | string | null;
};

type VerificationRequestRow = {
  id: string;
  requested_by: string;
  car_id: string | null;
  inspection_type: string;
  vehicle_registration: string | null;
  preferred_date: string | null;
  scheduled_for: string | null;
  status: string;
  external_make: string | null;
  external_model: string | null;
  external_year: number | null;
  created_at: string;
};

type InspectionCarRow = {
  id: string;
  make: string;
  model: string;
  year: number;
  registration: string | null;
};

function nullableNumber(
  value: number | string | null | undefined,
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function joinAddress(
  parts: Array<string | null | undefined>,
) {
  return parts
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(", ");
}

function mapCar(row: CarRow): CustomerCar {
  return {
    id: row.id,
    make: row.make,
    model: row.model,
    variant: row.variant,
    year: row.year,
    price: nullableNumber(row.price),
    mileage: row.mileage,
    fuelType: row.fuel_type,
    colour: row.colour,
    registration: row.registration,
    city: row.city,
    postcode: row.postcode,
    status: row.status,
    isVerified: row.is_verified,
    createdAt: row.created_at,
    publishedAt: row.published_at,
    imageUrl: null,
  };
}

async function attachCarImages(
  cars: CustomerCar[],
): Promise<CustomerCar[]> {
  if (cars.length === 0) {
    return cars;
  }

  const carIds =
    cars.map((car) => car.id);

  const {
    data,
    error,
  } = await supabase
    .from("car_images")
    .select(
      [
        "car_id",
        "storage_path",
        "sort_order",
        "is_primary",
      ].join(","),
    )
    .in("car_id", carIds)
    .order("sort_order", {
      ascending: true,
    });

  if (error) {
    console.warn(
      "Could not load customer car images:",
      error,
    );

    return cars;
  }

  const rows =
    (data as unknown as CarImageRow[] | null) ??
    [];

  const pathByCar =
    new Map<string, string>();

  for (const carId of carIds) {
    const candidates =
      rows.filter(
        (row) =>
          row.car_id === carId,
      );

    const selected =
      candidates.find(
        (row) =>
          row.is_primary,
      ) ??
      candidates[0];

    if (selected) {
      pathByCar.set(
        carId,
        selected.storage_path,
      );
    }
  }

  return Promise.all(
    cars.map(async (car) => {
      const path =
        pathByCar.get(car.id);

      if (!path) {
        return car;
      }

      const {
        data: signedData,
        error: signedError,
      } = await supabase.storage
        .from("car-images")
        .createSignedUrl(
          path,
          60 * 60,
        );

      if (
        signedError ||
        !signedData?.signedUrl
      ) {
        return car;
      }

      return {
        ...car,
        imageUrl:
          signedData.signedUrl,
      };
    }),
  );
}

function mapGarageVehicle(
  row: GarageVehicleRow,
): CustomerGarageVehicle {
  return {
    id: row.id,
    customerId: row.customer_id,
    registration: row.registration,
    make: row.make,
    model: row.model,
    variant: null,
    year: row.year,
    fuelType: row.fuel_type,
    colour: row.colour,
    motExpiry: row.mot_expiry,
    engineCapacityCc: row.engine_capacity_cc,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function fetchGarageVehicles(
  customerId: string,
) {
  const {
    data,
    error,
  } = await supabase
    .from("garage_vehicles")
    .select(
      [
        "id",
        "customer_id",
        "registration",
        "make",
        "model",
        "year",
        "fuel_type",
        "colour",
        "mot_expiry",
        "engine_capacity_cc",
        "created_at",
        "updated_at",
      ].join(","),
    )
    .eq(
      "customer_id",
      customerId,
    )
    .order(
      "created_at",
      {
        ascending: false,
      },
    );

  if (error) {
    throw error;
  }

  return (
    (data as unknown as GarageVehicleRow[] | null) ??
    []
  ).map(mapGarageVehicle);
}

async function fetchOwnedCars(
  customerId: string,
) {
  const {
    data,
    error,
  } = await supabase
    .from("cars")
    .select(
      [
        "id",
        "seller_id",
        "make",
        "model",
        "variant",
        "year",
        "price",
        "mileage",
        "fuel_type",
        "colour",
        "registration",
        "city",
        "postcode",
        "status",
        "is_verified",
        "created_at",
        "published_at",
      ].join(","),
    )
    .eq(
      "seller_id",
      customerId,
    )
    .order(
      "created_at",
      {
        ascending: false,
      },
    );

  if (error) {
    throw error;
  }

  const cars =
    (
      (data as unknown as CarRow[] | null) ??
      []
    ).map(mapCar);

  return attachCarImages(cars);
}

async function fetchBookings(
  customerId: string,
) {
  const {
    data,
    error,
  } = await supabase
    .from("service_bookings")
    .select(
      [
        "id",
        "customer_id",
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
        "status",
        "quoted_price",
        "created_at",
      ].join(","),
    )
    .eq(
      "customer_id",
      customerId,
    )
    .order(
      "created_at",
      {
        ascending: false,
      },
    );

  if (error) {
    throw error;
  }

  const rows =
    (data as unknown as ServiceBookingRow[] | null) ??
    [];

  const serviceTypeIds =
    Array.from(
      new Set(
        rows
          .map(
            (row) =>
              row.service_type_id,
          )
          .filter(
            (
              value,
            ): value is string =>
              Boolean(value),
          ),
      ),
    );

  let serviceTypeMap =
    new Map<
      string,
      ServiceTypeRow
    >();

  if (
    serviceTypeIds.length >
    0
  ) {
    const {
      data: typeData,
      error: typeError,
    } = await supabase
      .from("service_types")
      .select(
        "id,name,base_price",
      )
      .in(
        "id",
        serviceTypeIds,
      );

    if (typeError) {
      throw typeError;
    }

    const typeRows =
      (typeData as unknown as ServiceTypeRow[] | null) ??
      [];

    serviceTypeMap =
      new Map(
        typeRows.map(
          (row) => [
            row.id,
            row,
          ],
        ),
      );
  }

  return rows.map<CustomerBooking>(
    (row) => {
      const serviceType =
        row.service_type_id
          ? serviceTypeMap.get(
              row.service_type_id,
            )
          : undefined;

      return {
        id: row.id,
        serviceTypeId:
          row.service_type_id,
        serviceName:
          serviceType?.name ??
          "Mobile service",
        carMake:
          row.car_make,
        carModel:
          row.car_model,
        registration:
          row.car_registration,
        address:
          joinAddress([
            row.address_line_1,
            row.address_line_2,
            row.city,
            row.postcode,
          ]),
        preferredDate:
          row.preferred_date,
        preferredTime:
          row.preferred_time,
        status:
          row.status,
        quotedPrice:
          nullableNumber(
            row.quoted_price,
          ) ??
          nullableNumber(
            serviceType
              ?.base_price,
          ),
        createdAt:
          row.created_at,
      };
    },
  );
}

async function fetchInspections(
  customerId: string,
) {
  const {
    data,
    error,
  } = await supabase
    .from(
      "verification_requests",
    )
    .select(
      [
        "id",
        "requested_by",
        "car_id",
        "inspection_type",
        "vehicle_registration",
        "preferred_date",
        "scheduled_for",
        "status",
        "external_make",
        "external_model",
        "external_year",
        "created_at",
      ].join(","),
    )
    .eq(
      "requested_by",
      customerId,
    )
    .order(
      "created_at",
      {
        ascending: false,
      },
    );

  if (error) {
    throw error;
  }

  const rows =
    (data as unknown as VerificationRequestRow[] | null) ??
    [];

  const linkedCarIds =
    Array.from(
      new Set(
        rows
          .map(
            (row) =>
              row.car_id,
          )
          .filter(
            (
              value,
            ): value is string =>
              Boolean(value),
          ),
      ),
    );

  let carMap =
    new Map<
      string,
      InspectionCarRow
    >();

  if (
    linkedCarIds.length >
    0
  ) {
    const {
      data: carData,
      error: carError,
    } = await supabase
      .from("cars")
      .select(
        "id,make,model,year,registration",
      )
      .in(
        "id",
        linkedCarIds,
      );

    if (carError) {
      throw carError;
    }

    const carRows =
      (carData as unknown as InspectionCarRow[] | null) ??
      [];

    carMap =
      new Map(
        carRows.map(
          (row) => [
            row.id,
            row,
          ],
        ),
      );
  }

  return rows.map<CustomerInspection>(
    (row) => {
      const car =
        row.car_id
          ? carMap.get(
              row.car_id,
            )
          : undefined;

      return {
        id: row.id,
        inspectionType:
          row.inspection_type,
        carId:
          row.car_id,
        make:
          row.external_make ??
          car?.make ??
          null,
        model:
          row.external_model ??
          car?.model ??
          null,
        year:
          row.external_year ??
          car?.year ??
          null,
        registration:
          row.vehicle_registration ??
          car?.registration ??
          null,
        preferredDate:
          row.preferred_date,
        scheduledFor:
          row.scheduled_for,
        status:
          row.status,
        createdAt:
          row.created_at,
      };
    },
  );
}

export async function fetchCustomerDashboard(
  customerId: string,
): Promise<CustomerDashboardData> {
  const [
    cars,
    garageVehicles,
    bookings,
    inspections,
  ] = await Promise.all([
    fetchOwnedCars(
      customerId,
    ),
    fetchGarageVehicles(
      customerId,
    ),
    fetchBookings(
      customerId,
    ),
    fetchInspections(
      customerId,
    ),
  ]);

  return {
    garageVehicles,
    listings: cars,
    bookings,
    inspections,
  };
}

