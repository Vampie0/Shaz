export type UkVehicleLookupResult = {
  make: string;
  model: string;
  year: number;
  fuelType: "petrol" | "diesel" | "hybrid" | "electric";
  colour: string;
  registration: string;
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
    process.env.EXPO_PUBLIC_VEHICLE_DATA_API_KEY;

  const apiHost =
    process.env.EXPO_PUBLIC_RAPIDAPI_HOST ||
    "uk-vehicle-data1.p.rapidapi.com";

  if (!apiKey) {
    console.warn("RapidAPI key missing in .env configuration.");
  }

  const url = `https://${apiHost}/api/datapackage/VehicleData?v=2&api_nullitems=1&auth_companyflag=1&RegistrationData_Vrm=${cleanReg}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": (apiKey || "").trim(),
        "x-rapidapi-host": apiHost.trim(),
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`No vehicle found for registration ${cleanReg}. Please check and enter a valid UK registration number.`);
    }

    const data = await response.json();

    const dataItems =
      data?.Response?.DataItems ||
      data?.DataItems ||
      data;

    const vData = dataItems?.VehicleRegistration || dataItems?.VehicleData || dataItems;

    if (!vData || (!vData.Make && !vData.make)) {
      throw new Error(`No vehicle found for registration ${cleanReg}. Please check and enter a valid UK registration number.`);
    }

    const rawMake = vData.Make || vData.make;
    const rawModel = vData.Model || vData.model;

    if (!rawMake || !rawModel) {
      throw new Error(`No vehicle found for registration ${cleanReg}. Please check and enter a valid UK registration number.`);
    }

    const rawYear =
      Number(vData.YearOfManufacture || vData.yearOfManufacture || vData.year) ||
      new Date().getFullYear();

    const rawFuel = String(vData.FuelType || vData.fuelType || "petrol").toLowerCase();
    const fuelType: "petrol" | "diesel" | "hybrid" | "electric" =
      rawFuel.includes("diesel")
        ? "diesel"
        : rawFuel.includes("hybrid")
        ? "hybrid"
        : rawFuel.includes("electric") || rawFuel.includes("ev")
        ? "electric"
        : "petrol";

    const rawColour = vData.Colour || vData.colour || vData.color || "White";

    return {
      make: String(rawMake).trim(),
      model: String(rawModel).trim(),
      year: rawYear,
      fuelType,
      colour: String(rawColour).trim(),
      registration: cleanReg,
    };
  } catch (err) {
    if (err instanceof Error && err.message.includes("No vehicle found")) {
      throw err;
    }
    throw new Error(`No vehicle found for registration ${cleanReg}. Please check and enter a valid UK registration number.`);
  }
}
