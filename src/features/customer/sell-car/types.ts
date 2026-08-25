export type SellCarFuelType =
  | "petrol"
  | "diesel"
  | "hybrid"
  | "electric";

export type SellCarTransmission =
  | "manual"
  | "automatic";

export type SellCarUlez =
  | "not_stated"
  | "compliant"
  | "not_compliant";

export type SellCarDraftForm = {
  make: string;
  model: string;
  variant: string;
  year: string;

  price: string;
  mileage: string;
  fuelType: SellCarFuelType | "";
  transmission: SellCarTransmission | "";
  bodyType: string;
  engineSize: string;
  colour: string;
  registration: string;

  city: string;
  postcode: string;

  motExpiry: string;
  serviceHistory: string;
  ulez: SellCarUlez;

  description: string;
};

