import { supabase } from "@/services/supabase/client";

export type ConditionRating =
  | "excellent"
  | "good"
  | "fair"
  | "poor"
  | "not_checked";

export type InspectionResult =
  | "passed"
  | "passed_with_advisories"
  | "attention_required"
  | "not_suitable";

export type InspectionReport = {
  id: string;
  verificationRequestId: string;
  inspectorId: string | null;

  overallResult: InspectionResult | null;

  summary: string | null;
  inspectorNotes: string | null;

  bodyCondition: ConditionRating;
  tyreCondition: ConditionRating;
  interiorCondition: ConditionRating;
  engineCondition: ConditionRating;
  brakesCondition: ConditionRating;

  mileageChecked: boolean;
  registrationChecked: boolean;

  additionalChecks: Record<string, unknown> | null;

  submittedAt: string | null;
};

export type InspectionImage = {
  id: string;
  inspectionReportId: string;
  storagePath: string;
  caption: string | null;
  sortOrder: number;
  signedUrl: string | null;
};

export type InspectionReportBundle = {
  report: InspectionReport | null;
  images: InspectionImage[];
};

export type SaveInspectionReportInput = {
  verificationRequestId: string;

  overallResult: InspectionResult | null;

  summary: string;
  notes: string;

  body: ConditionRating;
  tyres: ConditionRating;
  interior: ConditionRating;
  engine: ConditionRating;
  brakes: ConditionRating;

  mileageChecked: boolean;
  registrationChecked: boolean;
};

type ReportRow = {
  id: string;
  verification_request_id: string;
  inspector_id: string | null;
  overall_result: InspectionResult | null;
  summary: string | null;
  inspector_notes: string | null;
  body_condition: ConditionRating;
  tyre_condition: ConditionRating;
  interior_condition: ConditionRating;
  engine_condition: ConditionRating;
  brakes_condition: ConditionRating;
  mileage_checked: boolean;
  registration_checked: boolean;
  additional_checks: Record<string, unknown> | null;
  submitted_at: string | null;
};

type ImageRow = {
  id: string;
  inspection_report_id: string;
  storage_path: string;
  caption: string | null;
  sort_order: number;
};

function mapReport(row: ReportRow): InspectionReport {
  return {
    id: row.id,
    verificationRequestId: row.verification_request_id,
    inspectorId: row.inspector_id,

    overallResult: row.overall_result,

    summary: row.summary,

    inspectorNotes: row.inspector_notes,

    bodyCondition: row.body_condition,

    tyreCondition: row.tyre_condition,

    interiorCondition: row.interior_condition,

    engineCondition: row.engine_condition,

    brakesCondition: row.brakes_condition,

    mileageChecked: row.mileage_checked,

    registrationChecked: row.registration_checked,

    additionalChecks: row.additional_checks,

    submittedAt: row.submitted_at,
  };
}

async function mapImage(row: ImageRow): Promise<InspectionImage> {
  const { data, error } = await supabase.storage
    .from("inspection-images")
    .createSignedUrl(row.storage_path, 60 * 60);

  return {
    id: row.id,
    inspectionReportId: row.inspection_report_id,
    storagePath: row.storage_path,
    caption: row.caption,
    sortOrder: row.sort_order,
    signedUrl: error ? null : (data?.signedUrl ?? null),
  };
}

export async function fetchInspectionReport(
  verificationRequestId: string,
): Promise<InspectionReportBundle> {
  const { data: reportData, error: reportError } = await supabase
    .from("inspection_reports")
    .select(
      [
        "id",
        "verification_request_id",
        "inspector_id",
        "overall_result",
        "summary",
        "inspector_notes",
        "body_condition",
        "tyre_condition",
        "interior_condition",
        "engine_condition",
        "brakes_condition",
        "mileage_checked",
        "registration_checked",
        "additional_checks",
        "submitted_at",
      ].join(","),
    )
    .eq("verification_request_id", verificationRequestId)
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
    .from("inspection_report_images")
    .select(
      [
        "id",
        "inspection_report_id",
        "storage_path",
        "caption",
        "sort_order",
      ].join(","),
    )
    .eq("inspection_report_id", report.id)
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

  const images = await Promise.all(rows.map(mapImage));

  return {
    report: mapReport(report),
    images,
  };
}

export async function saveInspectionReport(
  input: SaveInspectionReportInput,
): Promise<string> {
  const { data, error } = await supabase.rpc("save_inspection_report", {
    p_request_id: input.verificationRequestId,

    p_result: input.overallResult,

    p_summary: input.summary.trim() || null,

    p_notes: input.notes.trim() || null,

    p_body: input.body,

    p_tyres: input.tyres,

    p_interior: input.interior,

    p_engine: input.engine,

    p_brakes: input.brakes,

    p_mileage_checked: input.mileageChecked,

    p_registration_checked: input.registrationChecked,
  });

  if (error) {
    throw error;
  }

  if (typeof data !== "string" || !data) {
    throw new Error("Inspection report ID was not returned.");
  }

  return data;
}

function getExtension(
  fileName: string | null | undefined,
  mimeType: string | null | undefined,
) {
  const fromName = fileName
    ?.split(".")
    .pop()
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  if (fromName) {
    return fromName;
  }

  if (mimeType === "image/png") {
    return "png";
  }

  if (mimeType === "image/webp") {
    return "webp";
  }

  return "jpg";
}

export async function uploadInspectionImage({
  verificationRequestId,
  inspectionReportId,
  uri,
  fileName,
  mimeType,
  sortOrder,
}: {
  verificationRequestId: string;
  inspectionReportId: string;

  uri: string;

  fileName?: string | null;

  mimeType?: string | null;

  sortOrder: number;
}) {
  const extension = getExtension(fileName, mimeType);

  const safeName =
    Date.now().toString() +
    "-" +
    Math.random().toString(36).slice(2, 10) +
    "." +
    extension;

  /**
   * Storage policies require exactly:
   * requestId/reportId/file
   */
  const storagePath =
    verificationRequestId + "/" + inspectionReportId + "/" + safeName;

  const response = await fetch(uri);

  if (!response.ok) {
    throw new Error("Selected photo could not be read.");
  }

  const bytes = await response.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("inspection-images")
    .upload(storagePath, bytes, {
      contentType: mimeType ?? "image/jpeg",

      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { error: metadataError } = await supabase
    .from("inspection_report_images")
    .insert({
      inspection_report_id: inspectionReportId,

      storage_path: storagePath,

      caption: null,
      sort_order: sortOrder,
    });

  if (metadataError) {
    /**
     * Avoid leaving an object behind when metadata
     * insertion fails.
     */
    await supabase.storage.from("inspection-images").remove([storagePath]);

    throw metadataError;
  }

  return storagePath;
}

export async function deleteInspectionImage(image: InspectionImage) {
  const { error: metadataError } = await supabase
    .from("inspection_report_images")
    .delete()
    .eq("id", image.id);

  if (metadataError) {
    throw metadataError;
  }

  const { error: storageError } = await supabase.storage
    .from("inspection-images")
    .remove([image.storagePath]);

  if (storageError) {
    console.warn(
      "Inspection image object cleanup failed:",
      storageError.message,
    );
  }
}

export async function submitInspectionReport(verificationRequestId: string) {
  const { error } = await supabase.rpc("submit_inspection_report", {
    p_request_id: verificationRequestId,
  });

  if (error) {
    throw error;
  }
}

export async function updateInspectionPhotoCaption(
  imageId: string,
  caption: string | null,
) {
  const { error } = await supabase
    .from("inspection_report_images")
    .update({ caption })
    .eq("id", imageId);

  if (error) {
    throw error;
  }
}
