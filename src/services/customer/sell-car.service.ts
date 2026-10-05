// File: src/services/customer/sell-car.service.ts

import type { SellCarDraftForm } from "@/features/customer/sell-car/types";
import { supabase } from "@/services/supabase/client";

type CreatedCarRow = {
  id: string;
};

export type CarListingPhoto = {
  id: string;
  carId: string;
  storagePath: string;
  sortOrder: number;
  isPrimary: boolean;
  signedUrl: string | null;
};

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function parseDateInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) throw new Error("MOT expiry must use DD/MM/YYYY.");

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error("Enter a valid MOT expiry date.");
  }

  return [
    String(year).padStart(4, "0"),
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

function formatDateOutput(dateStr: string | null) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function requiredNumber(value: string, label: string) {
  const number = Number(value.trim().replace(/,/g, ""));
  if (!Number.isFinite(number)) {
    throw new Error(`${label} must be a valid number.`);
  }
  return number;
}

// 1. CREATE DRAFT (SENIOR'S createListingAction)
export async function createSellCarDraft(
  customerId: string,
  form: SellCarDraftForm,
) {
  if (!form.fuelType) throw new Error("Choose a fuel type.");
  if (!form.transmission) throw new Error("Choose a transmission.");

  const year = requiredNumber(form.year, "Year");
  const price = requiredNumber(form.price, "Price");
  const mileage = requiredNumber(form.mileage, "Mileage");

  const engineSize = form.engineSize.trim()
    ? requiredNumber(form.engineSize, "Engine size")
    : null;

  const motExpiry = parseDateInput(form.motExpiry);

  const ulezCompliant =
    form.ulez === "not_stated" || !form.ulez ? null : form.ulez === "compliant";

  const serviceHistory = optionalText(form.serviceHistory);

  const { data, error } = await supabase
    .from("cars")
    .insert({
      seller_id: customerId,
      make: form.make.trim(),
      model: form.model.trim(),
      variant: optionalText(form.variant),
      year,
      price,
      mileage,
      fuel_type: form.fuelType,
      transmission: form.transmission,
      body_type: optionalText(form.bodyType),
      engine_size: engineSize,
      colour: optionalText(form.colour),
      registration: optionalText(form.registration)?.toUpperCase() ?? null,
      city: form.city.trim(),
      postcode: form.postcode.trim().toUpperCase(),
      description: form.description.trim(),
      status: "draft",
      is_featured: false,
      is_verified: false,
      published_at: null,
      mot_expiry: motExpiry,
      service_history: serviceHistory === "Not stated" ? null : serviceHistory,
      ulez_compliant: ulezCompliant,
    })
    .select("id")
    .single();

  if (error) throw error;

  const created = data as unknown as CreatedCarRow | null;
  if (!created?.id) {
    throw new Error("The draft was saved but its ID was not returned.");
  }

  return created.id;
}

// 2. UPDATE DRAFT / REJECTED CAR (SENIOR'S updateListingAction)
export async function updateCarDraft(
  carId: string,
  customerId: string,
  form: SellCarDraftForm,
) {
  if (!form.fuelType) throw new Error("Choose a fuel type.");
  if (!form.transmission) throw new Error("Choose a transmission.");

  const year = requiredNumber(form.year, "Year");
  const price = requiredNumber(form.price, "Price");
  const mileage = requiredNumber(form.mileage, "Mileage");

  const engineSize = form.engineSize.trim()
    ? requiredNumber(form.engineSize, "Engine size")
    : null;

  const motExpiry = parseDateInput(form.motExpiry);

  const ulezCompliant =
    form.ulez === "not_stated" || !form.ulez ? null : form.ulez === "compliant";

  const serviceHistory = optionalText(form.serviceHistory);

  const { error } = await supabase
    .from("cars")
    .update({
      make: form.make.trim(),
      model: form.model.trim(),
      variant: optionalText(form.variant),
      year,
      price,
      mileage,
      fuel_type: form.fuelType,
      transmission: form.transmission,
      body_type: optionalText(form.bodyType),
      engine_size: engineSize,
      colour: optionalText(form.colour),
      registration: optionalText(form.registration)?.toUpperCase() ?? null,
      city: form.city.trim(),
      postcode: form.postcode.trim().toUpperCase(),
      description: form.description.trim(),
      mot_expiry: motExpiry,
      service_history: serviceHistory === "Not stated" ? null : serviceHistory,
      ulez_compliant: ulezCompliant,
      updated_at: new Date().toISOString(),
    })
    .eq("id", carId)
    .eq("seller_id", customerId);

  if (error) throw error;
}

// 3. UPDATE ACTIVE CAR (SENIOR'S updateActiveListingAction USING EXACT RPC)
export async function updateActiveCarListing(
  carId: string,
  form: SellCarDraftForm,
) {
  const price = requiredNumber(form.price, "Price");
  const mileage = requiredNumber(form.mileage, "Mileage");
  const motExpiry = parseDateInput(form.motExpiry);

  const ulezCompliant =
    form.ulez === "not_stated" || !form.ulez ? null : form.ulez === "compliant";

  const serviceHistory = optionalText(form.serviceHistory);

  const { error } = await supabase.rpc("update_active_car_listing", {
    p_car_id: carId,
    p_price: price,
    p_mileage: mileage,
    p_city: form.city.trim(),
    p_postcode: form.postcode.trim().toUpperCase(),
    p_description: form.description.trim(),
    p_mot_expiry: motExpiry,
    p_service_history: serviceHistory === "Not stated" ? null : serviceHistory,
    p_ulez_compliant: ulezCompliant,
  });

  if (error) {
    console.error("update_active_car_listing error:", error);
    throw new Error(error.message || "Could not update this active listing.");
  }
}

// 4. FETCH CAR DRAFT DETAILS (MAPPING EXACT SENIOR VALUES)
export async function fetchCarDraftDetail(carId: string, customerId: string) {
  const { data, error } = await supabase
    .from("cars")
    .select("*")
    .eq("id", carId)
    .eq("seller_id", customerId)
    .single();

  if (error) throw error;
  if (!data) throw new Error("Car draft not found.");

  // Map service history to senior's exact values ('full', 'part', 'none', '')
  let mappedServiceHistory = "";
  if (data.service_history) {
    const sh = data.service_history.toLowerCase();
    if (sh.includes("full")) mappedServiceHistory = "full";
    else if (sh.includes("part")) mappedServiceHistory = "part";
    else if (sh.includes("none") || sh.includes("no"))
      mappedServiceHistory = "none";
    else mappedServiceHistory = data.service_history;
  }

  const form: SellCarDraftForm = {
    make: data.make || "",
    model: data.model || "",
    variant: data.variant || "",
    year: data.year ? String(data.year) : "",
    price: data.price ? String(data.price) : "",
    mileage: data.mileage ? String(data.mileage) : "",
    fuelType: data.fuel_type || "",
    transmission: data.transmission || "",
    bodyType: data.body_type || "",
    engineSize: data.engine_size ? String(data.engine_size) : "",
    colour: data.colour || "",
    registration: data.registration || "",
    city: data.city || "",
    postcode: data.postcode || "",
    motExpiry: formatDateOutput(data.mot_expiry),
    serviceHistory: mappedServiceHistory,
    ulez:
      data.ulez_compliant === null
        ? "not_stated"
        : data.ulez_compliant
          ? "compliant"
          : "not_compliant",
    description: data.description || "",
  };

  return {
    raw: data,
    form,
  };
}

// 5. SUBMIT FOR REVIEW (SENIOR'S submitListingAction)
export async function submitCarForReview(carId: string, _customerId: string) {
  const { error } = await supabase.rpc("submit_car_for_review", {
    p_car_id: carId,
  });

  if (error) throw error;
}

// 6. PHOTO UPLOADS & MANAGING
export async function uploadCarListingPhoto({
  userId,
  carId,
  uri,
  fileName,
  mimeType,
  sortOrder,
  isPrimary,
}: {
  userId: string;
  carId: string;
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  sortOrder: number;
  isPrimary: boolean;
}) {
  const ext = fileName?.split(".").pop()?.toLowerCase() || "jpg";
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const storagePath = `${userId}/${carId}/${safeName}`;

  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error("Could not read selected photo.");
  }
  const bytes = await response.arrayBuffer();

  const { error: uploadErr } = await supabase.storage
    .from("car-images")
    .upload(storagePath, bytes, {
      contentType: mimeType || "image/jpeg",
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadErr) throw uploadErr;

  const { error: dbErr } = await supabase.from("car_images").insert({
    car_id: carId,
    storage_path: storagePath,
    sort_order: sortOrder,
    is_primary: isPrimary,
  });

  if (dbErr) {
    await supabase.storage.from("car-images").remove([storagePath]);
    throw dbErr;
  }

  return storagePath;
}

export async function fetchCarListingPhotos(
  carId: string,
): Promise<CarListingPhoto[]> {
  const { data, error } = await supabase
    .from("car_images")
    .select("id, car_id, storage_path, sort_order, is_primary")
    .eq("car_id", carId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  if (!data || data.length === 0) return [];

  return Promise.all(
    data.map(async (row) => {
      const { data: signed } = await supabase.storage
        .from("car-images")
        .createSignedUrl(row.storage_path, 3600);

      return {
        id: row.id,
        carId: row.car_id,
        storagePath: row.storage_path,
        sortOrder: row.sort_order,
        isPrimary: row.is_primary,
        signedUrl: signed?.signedUrl || null,
      };
    }),
  );
}

export async function deleteCarListingPhoto(id: string, storagePath: string) {
  const { error: dbErr } = await supabase
    .from("car_images")
    .delete()
    .eq("id", id);

  if (dbErr) throw dbErr;

  await supabase.storage.from("car-images").remove([storagePath]);
}

// 7. MARK AS SOLD (SENIOR'S markSoldAction)
export async function markCarAsSold(carId: string, _sellerId: string) {
  const { error } = await supabase.rpc("mark_car_sold", { p_car_id: carId });
  if (error) throw error;
}
