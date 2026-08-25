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

const BUCKET_PUBLIC_BASE = "https://rjhsgtpkifmfunemvezw.supabase.co/storage/v1/object/public/part-images";

export async function fetchCustomerParts(): Promise<PartItem[]> {
  try {
    // 1. Parallel fetch for categories & active parts
    const [categoriesRes, partsRes] = await Promise.all([
      supabase.from("part_categories").select("id, name").eq("is_active", true),
      supabase.from("parts").select("*").eq("is_active", true).order("created_at", { ascending: false }),
    ]);

    if (partsRes.error || !partsRes.data) {
      return [];
    }

    const categoryMap = new Map<string, string>();
    (categoriesRes.data || []).forEach((cat) => {
      categoryMap.set(cat.id, cat.name);
    });

    const partsData = partsRes.data;
    const partIds = partsData.map((p) => p.id);
    const imageMap = new Map<string, string>();

    if (partIds.length > 0) {
      const { data: imagesData } = await supabase
        .from("part_images")
        .select("part_id, storage_path")
        .in("part_id", partIds)
        .order("sort_order", { ascending: true });

      if (imagesData && imagesData.length > 0) {
        // Fast URL assignment
        for (const img of imagesData) {
          if (!imageMap.has(img.part_id) && img.storage_path) {
            const cleanPath = img.storage_path.trim().replace(/^\/+/, '');
            const fastUrl = `${BUCKET_PUBLIC_BASE}/${cleanPath}`;
            imageMap.set(img.part_id, fastUrl);
          }
        }
      }
    }

    return partsData.map((row) => {
      const categoryName = categoryMap.get(row.category_id) || "General";
      const price = typeof row.price_pence === "number" ? row.price_pence / 100 : 0;
      const inStock = (row.stock_quantity ?? 0) > 0;
      const imageUrl = imageMap.get(row.id) || null;

      return {
        id: row.id,
        name: row.name || "Part Item",
        brand: row.brand || "Fengxing Test",
        price,
        category: categoryName,
        inStock,
        imageUrl,
        description: row.description || null,
        partNumber: row.sku || null,
        createdAt: row.created_at || null,
      };
    });
  } catch (err) {
    console.error("fetchCustomerParts error:", err);
    return [];
  }
}

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
