export type CustomerBookingDetail = {
  id: string;
  customerId: string;
  serviceTypeId: string;
  serviceName: string;
  serviceBasePrice: number | null;

  carMake: string;
  carModel: string;
  registration: string | null;
  vehicleYear: number | null;

  addressLine1: string;
  addressLine2: string | null;
  city: string;
  postcode: string;

  preferredDate: string;
  preferredTime: string;

  notes: string | null;
  status: string;

  quotedPrice: number | null;
  oilProductName: string | null;
  oilViscosityGrade: string | null;
  oilFitmentStatus: string | null;
  cancellationReason: string | null;
  createdAt: string;
};
