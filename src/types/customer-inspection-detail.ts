export type CustomerInspectionVehicle = {
  id: string;
  make: string;
  model: string;
  variant: string | null;
  year: number;
  registration: string | null;

  price: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  status: string;

  imageUrl: string | null;
};

export type CustomerInspectionDetail = {
  id: string;
  requestedBy: string;
  carId: string | null;
  inspectionType: string;

  registration: string;
  make: string | null;
  model: string | null;
  year: number | null;

  inspectionAddress: string;
  city: string;
  postcode: string;

  preferredDate: string | null;
  preferredTime: string | null;
  scheduledFor: string | null;

  status: string;
  notes: string | null;

  confirmedAt: string | null;
  inspectionStartedAt: string | null;
  reportSubmittedAt: string | null;
  completedAt: string | null;

  vehicle: CustomerInspectionVehicle | null;
};

export type CustomerInspectionReportImage = {
  id: string;
  url: string;
  caption: string | null;
};

export type CustomerInspectionReport = {
  inspection: CustomerInspectionDetail;
  evidenceExpiresAt: string | null;

  id: string;
  overallResult: string | null;
  summary: string | null;

  bodyCondition: string;
  tyreCondition: string;
  interiorCondition: string;
  engineCondition: string;
  brakesCondition: string;

  mileageChecked: boolean;
  registrationChecked: boolean;

  submittedAt: string | null;
  images: CustomerInspectionReportImage[];
};
