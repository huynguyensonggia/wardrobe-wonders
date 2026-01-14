import type { Product, Category, ProductImage, ProductStatus } from "@/types";
import type { BEProduct, BECategory } from "@/types/backend";

const toSlug = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

const mapStatus = (s: string): ProductStatus => {
  // mock type: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE'
  // BE: 'available' | 'rented' | 'maintenance'
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
});

export const mapBEProductToMock = (p: BEProduct): Product => {
  const cat = p.category
    ? mapBECategoryToMock(p.category)
    : ({
        id: String(p.categoryId),
        name: "Unknown",
        slug: "unknown",
      } as Category);

  const primaryImage: ProductImage = {
    id: `img-${p.id}-main`,
    url: p.imageUrl ?? "",
    alt: p.name,
    isPrimary: true,
  };

  // mock UI expects arrays
  const sizes = p.size ? [String(p.size)] : [];
  const colors = p.color ? [p.color] : [];

  return {
    id: String(p.id),
    name: p.name,
    slug: toSlug(p.name), // hoặc dùng slug thật nếu BE có
    description: p.description ?? "",
    category: cat,
    images: p.imageUrl ? [primaryImage] : [],
    sizes,
    colors,
    pricePerDay: p.rentPricePerDay,
    deposit: p.deposit,
    quantity: p.quantity,
    status: mapStatus(String(p.status)),
    featured: false, // BE chưa có thì default false
    createdAt: p.createdAt,
  };
};
