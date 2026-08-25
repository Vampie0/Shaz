import { supabase } from "@/services/supabase/client";
import type { MarketplaceCar } from "@/types/marketplace";

type MarketplaceCarRow = {
  id: string;
  make: string;
  model: string;
  variant: string | null;
  year: number;
  price: number | string;
  mileage: number;
  fuel_type: string;
  transmission: string;
  body_type: string | null;
  colour: string | null;
  registration: string | null;
  registration_city: string | null;
  city: string;
  postcode: string;
  is_verified: boolean;
  published_at: string | null;
  created_at: string;
};

type CarImageRow = {
  car_id: string;
  storage_path: string;
  sort_order: number;
  is_primary: boolean;
};

function numberValue(
  value: number | string,
) {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

async function attachMarketplaceImages(
  cars: MarketplaceCar[],
): Promise<MarketplaceCar[]> {
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
      "car_id,storage_path,sort_order,is_primary",
    )
    .in("car_id", carIds)
    .order("sort_order", {
      ascending: true,
    });

  if (error) {
    console.warn(
      "Marketplace images could not be loaded:",
      error.message,
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
      const storagePath =
        pathByCar.get(car.id);

      if (!storagePath) {
        return car;
      }

      const {
        data: signedData,
        error: signedError,
      } = await supabase.storage
        .from("car-images")
        .createSignedUrl(
          storagePath,
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

export async function fetchMarketplaceCars(): Promise<
  MarketplaceCar[]
> {
  /**
   * Keep the marketplace query deliberately simple:
   * the website's public marketplace is the active rows in public.cars.
   *
   * Sorting is done in the app so the database read itself cannot be
   * accidentally narrowed by a UI sort choice.
   */
  const {
    data,
    error,
  } = await supabase
    .from("cars")
    .select(
      [
        "id",
        "make",
        "model",
        "variant",
        "year",
        "price",
        "mileage",
        "fuel_type",
        "transmission",
        "body_type",
        "colour",
        "registration",
        "registration_city",
        "city",
        "postcode",
        "is_verified",
        "published_at",
        "created_at",
      ].join(","),
    )
    .eq("status", "active");

  if (error) {
    console.error(
      "Marketplace cars query failed:",
      error,
    );

    throw error;
  }

  const rows =
    (data as unknown as MarketplaceCarRow[] | null) ??
    [];

  const cars =
    rows.map<MarketplaceCar>(
      (row) => ({
        id: row.id,
        make: row.make,
        model: row.model,
        variant: row.variant,
        year: row.year,
        price:
          numberValue(row.price),
        mileage: row.mileage,
        fuelType: row.fuel_type,
        transmission:
          row.transmission,
        bodyType: row.body_type,
        colour: row.colour,
        registration:
          row.registration,
        registrationCity:
          row.registration_city,
        city: row.city,
        postcode: row.postcode,
        isVerified:
          row.is_verified,
        publishedAt:
          row.published_at,
        createdAt:
          row.created_at,
        imageUrl: null,
      }),
    );

  return attachMarketplaceImages(cars);
}

