// File: src/services/customer/uk-vehicle-lookup.service.ts

export type UkVehicleLookupResult = {
  make: string;
  model: string;
  year: number;
  fuelType: "petrol" | "diesel" | "hybrid" | "electric";
  colour: string;
  registration: string;
  engineSize?: string;
  engineCapacityCc?: number | null;
  motExpiry?: string | null;
};

export async function fetchUkVehicleDetails(
  registration: string,
): Promise<UkVehicleLookupResult> {
  const cleanReg = registration.replace(/[\s\-]/g, "").toUpperCase();

  if (!cleanReg) {
    throw new Error("Please enter a valid UK registration number.");
  }

  const apiKey =
    process.env.EXPO_PUBLIC_RAPIDAPI_KEY ||
    process.env.EXPO_PUBLIC_VEHICLE_DATA_API_KEY ||
    "";

  const apiHost =
    process.env.EXPO_PUBLIC_RAPIDAPI_HOST || "uk-vehicle-data1.p.rapidapi.com";

  if (!apiKey) {
    throw new Error("Vehicle lookup service is temporarily unavailable.");
  }

  const endpoint = `https://${apiHost.trim()}/cartax.api.v1.Public/GetInitialReport`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "x-rapidapi-key": apiKey.trim(),
        "x-rapidapi-host": apiHost.trim(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        vrm: cleanReg,
      }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => null);
      const message =
        errJson?.message ||
        `No vehicle found for registration ${cleanReg}. Please check and try again.`;

      throw new Error(message);
    }

    const data = await response.json();
    const vData = data?.vehicle || data?.initialReport || data?.data || data;

    const rawMake = vData?.make || vData?.Make || vData?.manufacturer;
    const rawModel = vData?.model || vData?.Model;

    if (!rawMake || !rawModel) {
      throw new Error(`No vehicle details found for registration ${cleanReg}.`);
    }

    const rawYear =
      Number(
        vData?.year || vData?.yearOfManufacture || vData?.registered?.slice(-4),
      ) || new Date().getFullYear();

    const rawFuel = String(
      vData?.fuel || vData?.fuelType || "petrol",
    ).toLowerCase();

    const fuelType: "petrol" | "diesel" | "hybrid" | "electric" =
      rawFuel.includes("diesel")
        ? "diesel"
        : rawFuel.includes("hybrid")
          ? "hybrid"
          : rawFuel.includes("electric") || rawFuel.includes("ev")
            ? "electric"
            : "petrol";

    const rawColour = vData?.colour || vData?.color || "White";

    // Senior's Web Logic: Extract engine capacity & MOT expiry
    const rawEngine =
      vData?.engineCapacity ||
      vData?.engineCapacityCc ||
      vData?.EngineCapacityCc ||
      vData?.cylinderCapacity ||
      vData?.engine_size ||
      null;
    const engineCapacityCc = rawEngine ? Number(rawEngine) : null;

    const rawMot =
      vData?.motExpiryDate ||
      vData?.motExpiry ||
      vData?.MotExpiryDate ||
      vData?.mot_expiry ||
      null;
    const motExpiry = rawMot ? String(rawMot) : null;

    return {
      make: String(rawMake).trim(),
      model: String(rawModel).trim(),
      year: rawYear,
      fuelType,
      colour: String(rawColour).trim(),
      registration: cleanReg,
      engineSize: vData?.engine_size || undefined,
      engineCapacityCc: Number.isFinite(engineCapacityCc)
        ? engineCapacityCc
        : null,
      motExpiry,
    };
  } catch (err: any) {
    throw new Error(
      err?.message ||
        "Could not verify vehicle. Check your connection and try again.",
    );
  }
}
