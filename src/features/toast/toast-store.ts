export type AppToastType =
  | "success"
  | "error"
  | "warning"
  | "info";

export type AppToastInput = {
  type?: AppToastType;
  title?: string;
  message: string;
  duration?: number;
};

export type AppToastState =
  | {
      id: number;
      type: AppToastType;
      title?: string;
      message: string;
      duration: number;
    }
  | null;

const listeners =
  new Set<() => void>();

let current: AppToastState =
  null;

let nextId = 0;

function emit() {
  listeners.forEach(
    (listener) => listener(),
  );
}

export function subscribeToast(
  listener: () => void,
) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getToastSnapshot() {
  return current;
}

export function hideToast() {
  current = null;
  emit();
}

export function showToast(
  input: AppToastInput,
) {
  current = {
    id: ++nextId,
    type:
      input.type ?? "info",
    title: input.title,
    message: input.message,
    duration:
      input.duration ?? 3200,
  };

  emit();
}

export function toastSuccess(
  message: string,
  title?: string,
) {
  showToast({
    type: "success",
    title,
    message,
  });
}

export function toastError(
  message: string,
  title?: string,
) {
  showToast({
    type: "error",
    title,
    message,
    duration: 4200,
  });
}

export function toastWarning(
  message: string,
  title?: string,
) {
  showToast({
    type: "warning",
    title,
    message,
    duration: 3800,
  });
}

export function toastInfo(
  message: string,
  title?: string,
) {
  showToast({
    type: "info",
    title,
    message,
  });
}

function feedbackType(
  title: string,
): AppToastType {
  const value =
    title.toLowerCase();

  if (
    value.includes("failed") ||
    value.includes("error") ||
    value.includes("couldn't") ||
    value.includes("unable")
  ) {
    return "error";
  }

  if (
    value.includes("required") ||
    value.includes("incomplete") ||
    value.includes("missing") ||
    value.includes("warning")
  ) {
    return "warning";
  }

  if (
    value.includes("saved") ||
    value.includes("uploaded") ||
    value.includes("deleted") ||
    value.includes("submitted") ||
    value.includes("completed") ||
    value.includes("updated") ||
    value.includes("success")
  ) {
    return "success";
  }

  return "info";
}

export function showFeedbackToast(
  title: string,
  message: string,
) {
  showToast({
    type:
      feedbackType(title),
    title,
    message,
  });
}

export function toastWorkerJobActionSuccess(
  kind: string,
  previousStatus: string,
) {
  if (kind === "service") {
    if (
      previousStatus ===
      "assigned"
    ) {
      toastSuccess(
        "Job status updated to On the way!",
      );

      return;
    }

    if (
      previousStatus ===
      "on_the_way"
    ) {
      toastSuccess(
        "Job status updated to In progress!",
      );

      return;
    }

    if (
      previousStatus ===
      "in_progress"
    ) {
      toastSuccess(
        "Job completed successfully!",
      );

      return;
    }
  }

  if (
    kind === "inspection" &&
    previousStatus ===
      "inspection_scheduled"
  ) {
    toastSuccess(
      "Inspection started successfully!",
    );
  }
}

