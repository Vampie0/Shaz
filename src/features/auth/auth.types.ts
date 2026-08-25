export type ProfileRole =
  | "customer"
  | "inspector"
  | "admin";

export type StaffStatus =
  | "active"
  | "inactive"
  | null;

/**
 * Kept as WorkerProfile for compatibility with existing imports.
 * It now represents the authenticated mobile app profile.
 */
export type WorkerProfile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: ProfileRole;
  employee_id: string | null;
  staff_status: StaffStatus;
};

