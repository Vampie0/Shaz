export type CustomerCar = {
  id: string;
  make: string;
  model: string;
  variant: string | null;
  year: number;
  price: number | null;
  mileage: number | null;
  fuelType: string | null;
  colour: string | null;
  registration: string | null;
  city: string | null;
  postcode: string | null;
  status: string;
  isVerified: boolean;
  createdAt: string;
  publishedAt: string | null;
  imageUrl: string | null;
};

export type CustomerGarageVehicle = {
  id: string;
  customerId: string;
  registration: string;
  make: string;
  model: string;
  variant: string | null;
  year: number;
  fuelType: string | null;
  colour: string | null;
  motExpiry: string | null;
  engineCapacityCc: number | null;
  createdAt: string;
  updatedAt: string;
};

export type CustomerBooking = {
  id: string;
  serviceTypeId: string | null;
  serviceName: string;
  carMake: string | null;
  carModel: string | null;
  registration: string | null;
  address: string;
  preferredDate: string | null;
  preferredTime: string | null;
  status: string;
  quotedPrice: number | null;
  createdAt: string;
};

export type CustomerInspection = {
  id: string;
  inspectionType: string;
  carId: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  registration: string | null;
  preferredDate: string | null;
  scheduledFor: string | null;
  status: string;
  createdAt: string;
};

export type CustomerDashboardData = {
  garageVehicles: CustomerGarageVehicle[];
  listings: CustomerCar[];
  bookings: CustomerBooking[];
  inspections: CustomerInspection[];
};

