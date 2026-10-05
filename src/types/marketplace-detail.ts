// File: src/types/marketplace-detail.ts

export type MarketplaceCarDetail = {
  id: string;
  sellerId: string;

  make: string;
  model: string;
  variant: string | null;
  year: number;

  price: number;
  mileage: number;
  fuelType: string;
  transmission: string;

  bodyType: string | null;
  engineSize: number | null;
  colour: string | null;
  registration: string | null;

  city: string;
  postcode: string;
  description: string;

  motExpiry: string | null;
  serviceHistory: string | null;
  ulezCompliant: boolean | null;

  status: string; // <-- YE ADD KIYA HAI

  isVerified: boolean;
  verifiedAt: string | null;
  verifiedVerificationRequestId: string | null;

  images: string[];
};
