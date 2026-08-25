import { supabase } from "@/services/supabase/client";

export type ServiceEvidenceStage = "before" | "after";

export type ServiceJobReport = {
  id: string;
  serviceBookingId: string;
  inspectorId: string;
  workerNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ServiceJobImage = {
  id: string;
  serviceJobReportId: string;
  storagePath: string;
  stage: ServiceEvidenceStage;
  caption: string | null;
  sortOrder: number;
  createdAt: string;
  signedUrl: string | null;
};

export type ServiceJobReportBundle = {
  report: ServiceJobReport | null;
  images: ServiceJobImage[];
};

type ReportRow = {
  id: string;
  service_booking_id: string;
  inspector_id: string;
  worker_notes: string | null;
  created_at: string;
  updated_at: string;
};

type ImageRow = {
  id: string;
  service_job_report_id: string;
  storage_path: string;
  stage: ServiceEvidenceStage;
  caption: string | null;
  sort_order: number;
  created_at: string;
};

function mapReport(row: ReportRow): ServiceJobReport {
  return {
    id: row.id,
    serviceBookingId: row.service_booking_id,
    inspectorId: row.inspector_id,
    workerNotes: row.worker_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function mapImage(row: ImageRow): Promise<ServiceJobImage> {
  const { data, error } = await supabase.storage
    .from("service-images")
    .createSignedUrl(row.storage_path, 60 * 60);

  return {
    id: row.id,
    serviceJobReportId: row.service_job_report_id,
    storagePath: row.storage_path,
    stage: row.stage,
    caption: row.caption,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    signedUrl: error ? null : (data?.signedUrl ?? null),
  };
}

export async function fetchServiceJobReport(
  serviceBookingId: string,
): Promise<ServiceJobReportBundle> {
  const { data: reportData, error: reportError } = await supabase
    .from("service_job_reports")
    .select(
      [
        "id",
        "service_booking_id",
        "inspector_id",
        "worker_notes",
        "created_at",
        "updated_at",
      ].join(","),
    )
    .eq("service_booking_id", serviceBookingId)
    .maybeSingle();

  if (reportError) {
    throw reportError;
  }

  const report = reportData as ReportRow | null;

  if (!report) {
    return {
      report: null,
      images: [],
    };
  }

  const { data: imageData, error: imageError } = await supabase
    .from("service_job_images")
    .select(
      [
        "id",
        "service_job_report_id",
        "storage_path",
        "stage",
        "caption",
        "sort_order",
        "created_at",
      ].join(","),
    )
    .eq("service_job_report_id", report.id)
    .order("sort_order", {
      ascending: true,
    })
    .order("created_at", {
      ascending: true,
    });

  if (imageError) {
    throw imageError;
  }

  const rows = (imageData as unknown as ImageRow[] | null) ?? [];

  return {
    report: mapReport(report),
    images: await Promise.all(rows.map(mapImage)),
  };
}

export async function saveServiceJobReport(
  serviceBookingId: string,
  workerNotes: string,
): Promise<string> {
  const { data, error } = await supabase.rpc("save_service_job_report", {
    p_booking_id: serviceBookingId,

    p_notes: workerNotes.trim() || null,
  });

  if (error) {
    throw error;
  }

  if (typeof data !== "string" || !data) {
    throw new Error("Service report ID was not returned.");
  }

  return data;
}

function getExtension(
  fileName: string | null | undefined,
  mimeType: string | null | undefined,
) {
  const extension = fileName
    ?.split(".")
    .pop()
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  if (extension) {
    return extension;
  }

  if (mimeType === "image/png") {
    return "png";
  }

  if (mimeType === "image/webp") {
    return "webp";
  }

  return "jpg";
}

export async function uploadServiceImage({
  serviceBookingId,
  serviceJobReportId,
  uri,
  fileName,
  mimeType,
  stage,
  sortOrder,
}: {
  serviceBookingId: string;
  serviceJobReportId: string;

  uri: string;

  fileName?: string | null;

  mimeType?: string | null;

  stage: ServiceEvidenceStage;
  sortOrder: number;
}) {
  const extension = getExtension(fileName, mimeType);

  const safeFileName =
    stage +
    "-" +
    Date.now().toString() +
    "-" +
    Math.random().toString(36).slice(2, 10) +
    "." +
    extension;

  const storagePath =
    serviceBookingId + "/" + serviceJobReportId + "/" + safeFileName;

  const response = await fetch(uri);

  if (!response.ok) {
    throw new Error("Selected photo could not be read.");
  }

  const bytes = await response.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("service-images")
    .upload(storagePath, bytes, {
      contentType: mimeType ?? "image/jpeg",

      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { error: metadataError } = await supabase
    .from("service_job_images")
    .insert({
      service_job_report_id: serviceJobReportId,

      storage_path: storagePath,

      stage,
      caption: null,
      sort_order: sortOrder,
    });

  if (metadataError) {
    await supabase.storage.from("service-images").remove([storagePath]);

    throw metadataError;
  }

  return storagePath;
}

export async function deleteServiceImage(image: ServiceJobImage) {
  const { error: metadataError } = await supabase
    .from("service_job_images")
    .delete()
    .eq("id", image.id);

  if (metadataError) {
    throw metadataError;
  }

  const { error: storageError } = await supabase.storage
    .from("service-images")
    .remove([image.storagePath]);

  if (storageError) {
    console.warn("Service image object cleanup failed:", storageError.message);
  }
}
