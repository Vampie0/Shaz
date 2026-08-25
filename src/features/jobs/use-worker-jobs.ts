import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  advanceServiceBooking,
  fetchWorkerJobDetail,
  fetchWorkerJobs,
  startVerificationInspection,
} from "@/services/jobs/worker-jobs.service";
import type {
  WorkerJob,
} from "@/types/job";

import { toastWorkerJobActionSuccess } from "@/features/toast/toast-store";
export const workerJobKeys = {
  root: (
    employeeId: string,
  ) =>
    [
      "worker-jobs",
      employeeId,
    ] as const,

  list: (
    employeeId: string,
  ) =>
    [
      ...workerJobKeys.root(
        employeeId,
      ),
      "list",
    ] as const,

  detail: (
    employeeId: string,
    assignmentId: string,
  ) =>
    [
      ...workerJobKeys.root(
        employeeId,
      ),
      "detail",
      assignmentId,
    ] as const,
};

export function useWorkerJobs(
  employeeId:
    | string
    | undefined,
) {
  return useQuery({
    queryKey: workerJobKeys.list(
      employeeId ?? "none",
    ),

    queryFn: () =>
      fetchWorkerJobs(
        employeeId as string,
      ),

    enabled:
      Boolean(employeeId),

    staleTime: 60_000,
    gcTime: 10 * 60_000,

    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useWorkerJobDetail(
  employeeId:
    | string
    | undefined,
  assignmentId:
    | string
    | undefined,
) {
  return useQuery({
    queryKey:
      workerJobKeys.detail(
        employeeId ?? "none",
        assignmentId ?? "none",
      ),

    queryFn: () =>
      fetchWorkerJobDetail(
        employeeId as string,
        assignmentId as string,
      ),

    enabled:
      Boolean(
        employeeId &&
          assignmentId,
      ),

    staleTime: 30_000,
    gcTime: 10 * 60_000,

    refetchOnWindowFocus: false,
  });
}

export function useAdvanceServiceBooking(
  employeeId:
    | string
    | undefined,
  assignmentId:
    | string
    | undefined,
) {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      bookingId,
      target,
    }: {
      bookingId: string;
      target:
        | "on_the_way"
        | "in_progress"
        | "completed";
    }) =>
      advanceServiceBooking(
        bookingId,
        target,
      ),

    onSuccess: async () => {
      if (!employeeId) {
        return;
      }

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey:
            workerJobKeys.root(
              employeeId,
            ),
        }),

        assignmentId
          ? queryClient.invalidateQueries({
              queryKey:
                workerJobKeys.detail(
                  employeeId,
                  assignmentId,
                ),
            })
          : Promise.resolve(),
      ]);
    },
  });
}

export function useStartVerificationInspection(
  employeeId:
    | string
    | undefined,
  assignmentId:
    | string
    | undefined,
) {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      verificationRequestId: string,
    ) =>
      startVerificationInspection(
        verificationRequestId,
      ),

    onSuccess: async () => {
      if (!employeeId) {
        return;
      }

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey:
            workerJobKeys.root(
              employeeId,
            ),
        }),

        assignmentId
          ? queryClient.invalidateQueries({
              queryKey:
                workerJobKeys.detail(
                  employeeId,
                  assignmentId,
                ),
            })
          : Promise.resolve(),
      ]);
    },
  });
}



export function useRunWorkerJobAction(
  employeeId:
    | string
    | undefined,
) {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: async ({
      job,
    }: {
      job: WorkerJob;
    }) => {
      if (
        job.kind === "service"
      ) {
        if (
          job.status ===
          "assigned"
        ) {
          await advanceServiceBooking(
            job.jobId,
            "on_the_way",
          );

          return;
        }

        if (
          job.status ===
          "on_the_way"
        ) {
          await advanceServiceBooking(
            job.jobId,
            "in_progress",
          );

          return;
        }

        if (
          job.status ===
          "in_progress"
        ) {
          await advanceServiceBooking(
            job.jobId,
            "completed",
          );

          return;
        }
      }

      if (
        job.kind === "inspection" &&
        job.status ===
          "inspection_scheduled"
      ) {
        await startVerificationInspection(
          job.jobId,
        );

        return;
      }

      throw new Error(
        "No worker action is available for this job status.",
      );
    },

    onMutate: async ({
      job,
    }) => {
      if (!employeeId) {
        return {
          previous: undefined,
        };
      }

      const key =
        workerJobKeys.list(
          employeeId,
        );

      await queryClient.cancelQueries({
        queryKey: key,
      });

      const previous =
        queryClient.getQueryData<
          WorkerJob[]
        >(key);

      queryClient.setQueryData<
        WorkerJob[]
      >(
        key,
        (current) =>
          current?.map((item) => {
            if (
              item.assignmentId !==
              job.assignmentId
            ) {
              return item;
            }

            if (
              job.kind === "service"
            ) {
              if (
                job.status ===
                "assigned"
              ) {
                return {
                  ...item,
                  status:
                    "on_the_way",
                };
              }

              if (
                job.status ===
                "on_the_way"
              ) {
                return {
                  ...item,
                  status:
                    "in_progress",
                  assignmentStatus:
                    "in_progress",
                };
              }

              if (
                job.status ===
                "in_progress"
              ) {
                return {
                  ...item,
                  status:
                    "completed",
                  assignmentStatus:
                    "completed",
                  completedAt:
                    new Date().toISOString(),
                };
              }
            }

            if (
              job.kind ===
                "inspection" &&
              job.status ===
                "inspection_scheduled"
            ) {
              return {
                ...item,
                status:
                  "inspection_in_progress",
                assignmentStatus:
                  "in_progress",
              };
            }

            return item;
          }) ?? current,
      );

      return {
        previous,
      };
    },

    onSuccess: (
      _data,
      { job },
    ) => {
      toastWorkerJobActionSuccess(
        job.kind,
        job.status,
      );
    },

    onError: (
      _error,
      _variables,
      context,
    ) => {
      if (
        !employeeId ||
        !context?.previous
      ) {
        return;
      }

      queryClient.setQueryData(
        workerJobKeys.list(
          employeeId,
        ),
        context.previous,
      );
    },

    onSettled: async () => {
      if (!employeeId) {
        return;
      }

      await queryClient.invalidateQueries({
        queryKey:
          workerJobKeys.root(
            employeeId,
          ),
      });
    },
  });
}
