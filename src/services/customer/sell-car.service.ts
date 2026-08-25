import { supabase } from "@/services/supabase/client";
import type { SellCarDraftForm } from "@/features/customer/sell-car/types";

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
    form.ulez === "not_stated"
      ? null
      : form.ulez === "compliant";

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
      service_history: optionalText(form.serviceHistory),
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
    form.ulez === "not_stated"
      ? null
      : form.ulez === "compliant";

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
      service_history: optionalText(form.serviceHistory),
      ulez_compliant: ulezCompliant,
      updated_at: new Date().toISOString(),
    })
    .eq("id", carId)
    .eq("seller_id", customerId);

  if (error) throw error;
}

export async function fetchCarDraftDetail(carId: string, customerId: string) {
  const { data, error } = await supabase
    .from("cars")
    .select("*")
    .eq("id", carId)
    .eq("seller_id", customerId)
    .single();

  if (error) throw error;
  if (!data) throw new Error("Car draft not found.");

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
    serviceHistory: data.service_history || "Not stated",
    ulez: data.ulez_compliant === null ? "not_stated" : data.ulez_compliant ? "compliant" : "not_compliant",
    description: data.description || "",
  };

  return {
    raw: data,
    form,
  };
}

export async function submitCarForReview(carId: string, customerId: string) {
  // Call Supabase RPC submit_car_for_review
  const { error } = await supabase.rpc("submit_car_for_review", {
    p_car_id: carId,
  });

  if (error) {
    const { error: err2 } = await supabase.rpc("submit_car_for_review", {
      p_id: carId,
    });
    if (err2) {
      const { error: err3 } = await supabase.rpc("submit_car_for_review", {
        car_id: carId,
      });
      if (err3) throw error;
    }
  }
}

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

  const { error: dbErr } = await supabase
    .from("car_images")
    .insert({
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

export async function fetchCarListingPhotos(carId: string): Promise<CarListingPhoto[]> {
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
    })
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

export async function markCarAsSold(carId: string, sellerId: string) {
  // Update status = 'sold' via RPC mark_car_sold (ALL IMAGES & DB DATA ARE PRESERVED)
  const { error: err1 } = await supabase.rpc("mark_car_sold", { p_car_id: carId });

  if (err1) {
    const { error: err2 } = await supabase.rpc("mark_car_sold", { p_id: carId });
    if (err2) {
      const { error: err3 } = await supabase.rpc("mark_car_sold", { car_id: carId });
      if (err3) {
        // Fallback update status = 'sold'
        const { error: updateErr } = await supabase
          .from("cars")
          .update({
            status: "sold",
            updated_at: new Date().toISOString(),
          })
          .eq("id", carId)
          .eq("seller_id", sellerId);

        if (updateErr) throw err1;
      }
    }
  }
}
