import type { WorkerJob, WorkerJobBucket, WorkerJobStatus } from "@/types/job";

/**
 * Senior's Web Logic Sync:
 * In Progress aur On the way jobs ko "Active" samjha jata hai.
 */
const ACTIVE_STATUSES = new Set<WorkerJobStatus>([
  "on_the_way",
  "in_progress",
  "inspection_in_progress",
]);

export function getJobBucket(job: WorkerJob): WorkerJobBucket {
  /**
   * WEB SYNC:
   * Agar status 'completed' hai YA inspection ki report submit ho chuki hai ('report_submitted'),
   * toh wo job automatically "History/Completed" bucket mein chali jayegi.
   */
  if (
    job.status === "completed" ||
    job.status === "report_submitted" ||
    job.assignmentStatus === "completed"
  ) {
    return "completed";
  }

  /**
   * Agar job cancelled nahi hai aur active status mein hai (started),
   * toh wo "Active" hai.
   */
  if (ACTIVE_STATUSES.has(job.status)) {
    return "active";
  }

  /**
   * Baqi sab "Upcoming" hain.
   */
  return "upcoming";
}

export function isJobCancelled(job: WorkerJob) {
  return (
    job.assignmentStatus === "cancelled" ||
    job.assignmentStatus === "declined" ||
    job.status === "cancelled"
  );
}

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return year + "-" + month + "-" + day;
}

export function isTodayJob(job: WorkerJob) {
  // Direct date comparison
  return job.scheduledDate === getLocalDateKey();
}

export function getJobSortTime(job: WorkerJob) {
  if (job.scheduledTimestamp) {
    const value = new Date(job.scheduledTimestamp).getTime();

    return Number.isNaN(value) ? Number.MAX_SAFE_INTEGER : value;
  }

  if (!job.scheduledDate) {
    return Number.MAX_SAFE_INTEGER;
  }

  const [year, month, day] = job.scheduledDate.split("-").map(Number);

  const [hour = 0, minute = 0] = (job.scheduledTime ?? "00:00")
    .split(":")
    .map(Number);

  const value = new Date(year, month - 1, day, hour, minute).getTime();

  return Number.isNaN(value) ? Number.MAX_SAFE_INTEGER : value;
}

export function sortJobsAscending(jobs: WorkerJob[]) {
  return [...jobs].sort((a, b) => getJobSortTime(a) - getJobSortTime(b));
}

export function sortJobsDescending(jobs: WorkerJob[]) {
  return [...jobs].sort((a, b) => getJobSortTime(b) - getJobSortTime(a));
}

export function formatJobDate(date: string | null) {
  if (!date) {
    return "Date not set";
  }

  const [year, month, day] = date.split("-").map(Number);

  const value = new Date(year, month - 1, day);

  if (Number.isNaN(value.getTime())) {
    return date;
  }

  return value.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatJobTime(time: string | null) {
  if (!time) {
    return "Time not set";
  }

  const [hour, minute] = time.split(":").map(Number);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return time;
  }

  const value = new Date();
  value.setHours(hour, minute, 0, 0);

  return value.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatStatus(status: string) {
  const labels: Record<string, string> = {
    pending: "Pending",
    confirmed: "Confirmed",
    assigned: "Assigned",
    accepted: "Accepted",
    on_the_way: "On the way",
    in_progress: "In progress",
    completed: "Completed",
    cancelled: "Cancelled",
    declined: "Declined",
    inspection_scheduled: "Inspection scheduled",
    inspection_in_progress: "Inspection in progress",
    report_submitted: "Report submitted",
  };

  return (
    labels[status] ??
    status.replace(/_/g, " ").replace(/\b\w/g, (value) => value.toUpperCase())
  );
}

export function getTodayHeading() {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
