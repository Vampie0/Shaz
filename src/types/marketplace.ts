export type MarketplaceCar = {
  id: string;
  make: string;
  model: string;
  variant: string | null;
  year: number;
  price: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  bodyType: string | null;
  colour: string | null;
  registration: string | null;
  registrationCity: string | null;
  city: string;
  postcode: string;
  isVerified: boolean;
  publishedAt: string | null;
  createdAt: string;
  imageUrl: string | null;
};

