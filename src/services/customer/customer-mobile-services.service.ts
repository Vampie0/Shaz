import { supabase } from "@/services/supabase/client";
import type { CustomerServiceType } from "@/types/customer-service";

type ServiceTypeRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  base_price: number | string;
  short_description: string | null;
  estimated_duration_minutes: number | null;
};

function numberValue(value: number | string) {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

export async function fetchCustomerMobileServices(): Promise<
  CustomerServiceType[]
> {
  const { data, error } = await supabase
    .from("service_types")
    .select(
      "id,name,slug,description,base_price,short_description,estimated_duration_minutes",
    )
    .eq("is_active", true)
    .order("name");

  if (error) {
    throw error;
  }

  const rows = (data as unknown as ServiceTypeRow[] | null) ?? [];

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    shortDescription: row.short_description,
    basePrice: numberValue(row.base_price),
    estimatedDurationMinutes: row.estimated_duration_minutes,
  }));
}
