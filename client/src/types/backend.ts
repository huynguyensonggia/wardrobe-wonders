// types/backend.ts

export type BEProductStatus = "available" | "rented" | "maintenance";
export type BEProductSize = "XXL" | "S" | "M" | "L" | "XL";

// ✅ bạn chốt dùng 3 giá trị này
export type BEProductOccasion = "party" | "wedding" | "casual";

export interface BECategory {
  id: number;
  name: string;
  nameEn: string | null;
  nameJa: string | null;
  slug: string;
  description: string | null;
  vtonCategory: string;
  isActive: boolean;
  createdAt: string;
}

export interface BEProduct {
  id: number;
  name: string;
  nameEn: string | null;
  nameJa: string | null;

  categoryId: number;
  category?: BECategory;

  // ✅ occasion theo chuẩn mới, vẫn cho fallback string nếu DB còn "dress/top" cũ
  occasion: BEProductOccasion | string;

  costPrice: number;
  rentPricePerDay: number;
  deposit: number;
  colorEn: string | null;
  colorJa: string | null;

  size: BEProductSize | string;
  color: string;
  quantity: number;

  imageUrl: string | null;
  description: string | null;

  status: BEProductStatus | string;

  createdAt: string;
  updatedAt: string;
}
