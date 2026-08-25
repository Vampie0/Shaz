export type WorkerJobKind =
  | "service"
  | "inspection";

export type AssignmentStatus =
  | "assigned"
  | "accepted"
  | "declined"
  | "in_progress"
  | "completed"
  | "cancelled";

export type ServiceBookingStatus =
  | "pending"
  | "confirmed"
  | "assigned"
  | "on_the_way"
  | "in_progress"
  | "completed"
  | "cancelled";

export type VerificationRequestStatus =
  | "pending"
  | "confirmed"
  | "assigned"
  | "inspection_scheduled"
  | "inspection_in_progress"
  | "report_submitted"
  | "completed"
  | "cancelled";

export type WorkerJobStatus =
  | ServiceBookingStatus
  | VerificationRequestStatus;

export type WorkerJobBucket =
  | "upcoming"
  | "active"
  | "completed";

export type WorkerJob = {
  assignmentId: string;
  jobId: string;

  kind: WorkerJobKind;

  assignmentStatus: AssignmentStatus;
  status: WorkerJobStatus;

  title: string;
  vehicleLabel: string;
  registration: string | null;

  address: string;
  city: string | null;
  postcode: string | null;

  scheduledDate: string | null;
  scheduledTime: string | null;
  scheduledTimestamp: string | null;

  notes: string | null;

  completedAt: string | null;
};

export type WorkerJobDetail = WorkerJob & {
  customerName: string | null;
  customerPhone: string | null;

  serviceTypeId: string | null;
  carId: string | null;

  mileage: number | null;
  vehicleYear: number | null;
};

