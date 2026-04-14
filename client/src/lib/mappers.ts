import type { Product, Category, ProductImage, ProductStatus, ProductVariant } from "@/types";
import type { BEProduct, BECategory } from "@/types/backend";

const toSlug = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

const mapStatus = (s: string): ProductStatus => {
  const x = (s || "").toLowerCase();
  if (x === "available") return "AVAILABLE";
  if (x === "rented") return "RENTED";
  return "MAINTENANCE";
};

export const mapBECategoryToMock = (c: BECategory): Category => ({
  id: String(c.id),
  name: c.name,
  slug: c.slug,
  description: c.description ?? undefined,
  image: undefined,
  vtonCategory: (c as any).vtonCategory,
  isActive: (c as any).isActive,
});

const SIZE_ORDER: Record<string, number> = { XS: 0, S: 1, M: 2, L: 3, XL: 4 };

export const mapBEProductToMock = (p: BEProduct): Product => {
  const cat: Category = p.category
    ? mapBECategoryToMock(p.category)
    : {
        id: String(p.categoryId),
        name: "Unknown",
        slug: "unknown",
      };

  const primaryImage: ProductImage = {
    id: `img-${p.id}-main`,
    url: p.imageUrl ?? "",
    alt: p.name,
    isPrimary: true,
  };

  // ✅ variants: ưu tiên p.variants, fallback any
  const rawVariants: any[] =
    Array.isArray((p as any).variants) ? (p as any).variants : [];

  const variants: ProductVariant[] = rawVariants.map((v) => ({
    id: Number(v.id),
    productId: Number(v.productId ?? p.id),
    size: String(v.size ?? "M"),
    stock: Number(v.stock ?? 0),
    isActive: v.isActive !== undefined ? Number(v.isActive) : undefined,
    createdAt: v.createdAt ? String(v.createdAt) : undefined,
    updatedAt: v.updatedAt ? String(v.updatedAt) : undefined,
  }));

  // ✅ sizes unique từ variants (fallback p.size)
  const sizes = variants.length
    ? Array.from(new Set(variants.map((v) => v.size)))
        .sort((a, b) => (SIZE_ORDER[a] ?? 999) - (SIZE_ORDER[b] ?? 999))
    : (p as any).size
      ? [String((p as any).size)]
      : [];

  const colors = p.color ? [p.color] : [];

  // ✅ quantity: tổng stock, fallback p.quantity, fallback 0
  const quantity =
    variants.length > 0
      ? variants.reduce((sum, v) => sum + (Number.isFinite(v.stock) ? v.stock : 0), 0)
      : Number((p as any).quantity ?? 0);

  return {
    id: String(p.id),
    name: p.name,
    slug: toSlug(p.name),
    description: p.description ?? "",
    category: cat,
    images: p.imageUrl ? [primaryImage] : [],
    sizes,
    colors,
    color: p.color ?? "unknown",
    variants,
    occasion: String((p as any).occasion ?? ""),
    pricePerDay: Number(p.rentPricePerDay ?? 0),
    deposit: Number(p.deposit ?? 0),
    quantity,
    status: mapStatus(String(p.status)),
    featured: false,
    createdAt: String((p as any).createdAt ?? ""),
  };
};
