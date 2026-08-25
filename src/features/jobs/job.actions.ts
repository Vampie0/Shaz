import type {
  WorkerJob,
} from "@/types/job";

export type WorkerJobAction =
  | {
      type: "service";
      label: "Start journey";
      target: "on_the_way";
    }
  | {
      type: "service";
      label: "Start job";
      target: "in_progress";
    }
  | {
      type: "service";
      label: "Complete";
      target: "completed";
    }
  | {
      type: "inspection";
      label: "Start inspection";
    };

export function getWorkerJobAction(
  job: WorkerJob,
): WorkerJobAction | null {
  if (job.kind === "service") {
    if (job.status === "assigned") {
      return {
        type: "service",
        label: "Start journey",
        target: "on_the_way",
      };
    }

    if (job.status === "on_the_way") {
      return {
        type: "service",
        label: "Start job",
        target: "in_progress",
      };
    }

    if (job.status === "in_progress") {
      return {
        type: "service",
        label: "Complete",
        target: "completed",
      };
    }

    return null;
  }

  if (
    job.kind === "inspection" &&
    job.status === "inspection_scheduled"
  ) {
    return {
      type: "inspection",
      label: "Start inspection",
    };
  }

  return null;
}

