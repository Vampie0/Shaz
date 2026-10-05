// File: src/services/customer/parts.service.ts

import { supabase } from "@/services/supabase/client";

export type PartItem = {
  id: string;
  name: string;
  brand: string;
  price: number;
  category: string;
  inStock: boolean;
  imageUrl: string | null;
  description: string | null;
  partNumber: string | null;
  createdAt: string | null;
};

const BUCKET_PUBLIC_BASE =
  "https://rjhsgtpkifmfunemvezw.supabase.co/storage/v1/object/public/part-images";

// 1. FETCH ALL PARTS
export async function fetchCustomerParts(): Promise<PartItem[]> {
  try {
    const [categoriesRes, partsRes] = await Promise.all([
      supabase.from("part_categories").select("id, name").eq("is_active", true),
      supabase
        .from("parts")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false }),
    ]);

    if (partsRes.error || !partsRes.data) {
      return [];
    }

    return mapPartsWithImages(partsRes.data, categoriesRes.data || []);
  } catch (err) {
    console.error("fetchCustomerParts error:", err);
    return [];
  }
}

// 2. FETCH COMPATIBLE PARTS (SENIOR'S getCompatiblePartsForVehicle RPC)
export async function fetchCompatibleParts(
  garageVehicleId: string,
): Promise<PartItem[]> {
  try {
    const [categoriesRes, rpcRes] = await Promise.all([
      supabase.from("part_categories").select("id, name").eq("is_active", true),
      supabase.rpc("get_compatible_parts_for_garage_vehicle", {
        p_garage_vehicle_id: garageVehicleId,
      }),
    ]);

    if (rpcRes.error || !rpcRes.data) {
      console.error("fetchCompatibleParts RPC error:", rpcRes.error);
      return [];
    }

    return mapPartsWithImages(rpcRes.data, categoriesRes.data || []);
  } catch (err) {
    console.error("fetchCompatibleParts error:", err);
    return [];
  }
}

// HELPER TO ATTACH IMAGES AND MAP PART ITEM
async function mapPartsWithImages(
  partsData: any[],
  categoriesData: Array<{ id: string; name: string }>,
): Promise<PartItem[]> {
  const categoryMap = new Map<string, string>();
  categoriesData.forEach((cat) => {
    categoryMap.set(cat.id, cat.name);
  });

  const partIds = partsData.map((p) => p.id);
  const imageMap = new Map<string, string>();

  if (partIds.length > 0) {
    const { data: imagesData } = await supabase
      .from("part_images")
      .select("part_id, storage_path")
      .in("part_id", partIds)
      .order("sort_order", { ascending: true });

    if (imagesData && imagesData.length > 0) {
      for (const img of imagesData) {
        if (!imageMap.has(img.part_id) && img.storage_path) {
          const cleanPath = img.storage_path.trim().replace(/^\/+/, "");
          const fastUrl = `${BUCKET_PUBLIC_BASE}/${cleanPath}`;
          imageMap.set(img.part_id, fastUrl);
        }
      }
    }
  }

  return partsData.map((row) => {
    const categoryName = categoryMap.get(row.category_id) || "General";
    const price =
      typeof row.price_pence === "number" ? row.price_pence / 100 : 0;
    const inStock = (row.stock_quantity ?? 0) > 0;
    const imageUrl = imageMap.get(row.id) || null;

    return {
      id: row.id,
      name: row.name || "Part Item",
      brand: row.brand || "Shaz Parts",
      price,
      category: categoryName,
      inStock,
      imageUrl,
      description: row.description || null,
      partNumber: row.sku || null,
      createdAt: row.created_at || null,
    };
  });
}

// 3. FETCH CATEGORIES
export async function fetchPartCategories(): Promise<string[]> {
  try {
    const { data } = await supabase
      .from("part_categories")
      .select("name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (!data || data.length === 0) {
      return ["All Parts"];
    }

    const uniqueNames = Array.from(new Set(data.map((c) => c.name)));
    return ["All Parts", ...uniqueNames];
  } catch {
    return ["All Parts"];
  }
}
