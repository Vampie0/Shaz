import { supabase } from "@/services/supabase/client";
import type { MarketplaceCarDetail } from "@/types/marketplace-detail";

type CarDetailRow = {
  id: string;
  seller_id: string;

  make: string;
  model: string;
  variant: string | null;
  year: number;

  price: number | string;
  mileage: number;
  fuel_type: string;
  transmission: string;

  body_type: string | null;
  engine_size: number | string | null;
  colour: string | null;
  registration: string | null;

  city: string;
  postcode: string;
  description: string;

  mot_expiry: string | null;
  service_history: string | null;
  ulez_compliant: boolean | null;

  is_verified: boolean;
  verified_at: string | null;
  verified_verification_request_id: string | null;
};

type CarImageRow = {
  storage_path: string;
  sort_order: number;
  is_primary: boolean;
};

function requiredNumber(
  value: number | string,
) {
  const parsed =
    Number(value);

  if (
    !Number.isFinite(
      parsed,
    )
  ) {
    return 0;
  }

  return parsed;
}

function nullableNumber(
  value: number | string | null,
) {
  if (
    value === null
  ) {
    return null;
  }

  const parsed =
    Number(value);

  return Number.isFinite(
    parsed,
  )
    ? parsed
    : null;
}

export async function fetchMarketplaceCarDetail(
  carId: string,
): Promise<MarketplaceCarDetail> {
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
        "transmission",
        "body_type",
        "engine_size",
        "colour",
        "registration",
        "city",
        "postcode",
        "description",
        "mot_expiry",
        "service_history",
        "ulez_compliant",
        "is_verified",
        "verified_at",
        "verified_verification_request_id",
      ].join(","),
    )
    .eq(
      "id",
      carId,
    )
    .eq(
      "status",
      "active",
    )
    .maybeSingle();

  if (error) {
    throw error;
  }

  const car =
    data as unknown as
      | CarDetailRow
      | null;

  if (!car) {
    throw new Error(
      "This listing is no longer available.",
    );
  }

  const {
    data: imageData,
    error: imageError,
  } = await supabase
    .from("car_images")
    .select(
      "storage_path,sort_order,is_primary",
    )
    .eq(
      "car_id",
      carId,
    )
    .order(
      "sort_order",
      {
        ascending: true,
      },
    );

  if (imageError) {
    throw imageError;
  }

  const imageRows =
    (imageData as unknown as CarImageRow[] | null) ??
    [];

  const orderedRows = [
    ...imageRows.filter(
      (row) =>
        row.is_primary,
    ),
    ...imageRows.filter(
      (row) =>
        !row.is_primary,
    ),
  ];

  const signed =
    await Promise.all(
      orderedRows.map(
        async (row) => {
          const {
            data: signedData,
            error: signedError,
          } = await supabase.storage
            .from(
              "car-images",
            )
            .createSignedUrl(
              row.storage_path,
              60 * 60,
            );

          if (
            signedError ||
            !signedData?.signedUrl
          ) {
            return null;
          }

          return signedData.signedUrl;
        },
      ),
    );

  return {
    id: car.id,
    sellerId:
      car.seller_id,

    make: car.make,
    model: car.model,
    variant:
      car.variant,
    year: car.year,

    price:
      requiredNumber(
        car.price,
      ),
    mileage:
      car.mileage,
    fuelType:
      car.fuel_type,
    transmission:
      car.transmission,

    bodyType:
      car.body_type,
    engineSize:
      nullableNumber(
        car.engine_size,
      ),
    colour:
      car.colour,
    registration:
      car.registration,

    city: car.city,
    postcode:
      car.postcode,
    description:
      car.description,

    motExpiry:
      car.mot_expiry,
    serviceHistory:
      car.service_history,
    ulezCompliant:
      car.ulez_compliant,

    isVerified:
      car.is_verified,
    verifiedAt:
      car.verified_at,
    verifiedVerificationRequestId:
      car.verified_verification_request_id,

    images:
      signed.filter(
        (
          url,
        ): url is string =>
          Boolean(url),
      ),
  };
}



export type MarketplaceSellerContact = {
  fullName: string;
  phone: string;
};

type MarketplaceSellerContactRow = {
  full_name?: unknown;
  phone?: unknown;
};

type RpcErrorLike = {
  message?: string;
};

type RpcResponseLike = {
  data: unknown;
  error: RpcErrorLike | null;
};

export async function revealMarketplaceSellerContact(
  carId: string,
): Promise<MarketplaceSellerContact> {
  if (!carId) {
    throw new Error(
      "A car id is required to reveal seller contact.",
    );
  }

  /*
   * Existing website/server-side backend flow confirmed in DevTools:
   * reveal_seller_contact
   * payload: { p_car_id: <opened car id> }
   */
  const rpcClient =
    supabase as unknown as {
      rpc: (
        functionName: string,
        args: Record<string, unknown>,
      ) => Promise<RpcResponseLike>;
    };

  const {
    data,
    error,
  } = await rpcClient.rpc(
    "reveal_seller_contact",
    {
      p_car_id:
        carId,
    },
  );

  if (error) {
    throw new Error(
      error.message ||
        "Seller contact could not be revealed.",
    );
  }

  const raw =
    Array.isArray(data)
      ? data[0]
      : data;

  if (
    !raw ||
    typeof raw !==
      "object"
  ) {
    throw new Error(
      "Seller contact is unavailable for this listing.",
    );
  }

  const row =
    raw as MarketplaceSellerContactRow;

  const fullName =
    typeof row.full_name ===
      "string"
      ? row.full_name.trim()
      : "";

  const phone =
    typeof row.phone ===
      "string"
      ? row.phone.trim()
      : "";

  if (!phone) {
    throw new Error(
      "Seller phone number is unavailable.",
    );
  }

  return {
    fullName:
      fullName ||
      "Seller",
    phone,
  };
}
