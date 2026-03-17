import { ProductType } from "../../modules/products/enums/product-type.enum";
import { VtonCategory } from "../../modules/categories/enums/vton-category.enum";

/**
 * Map ProductType (DB) → VtonCategory (FitDiT)
 */
export const PRODUCT_VTON_MAP: Record<ProductType, VtonCategory> = {
  [ProductType.TOP]: VtonCategory.UPPER_BODY,
  [ProductType.BOTTOM]: VtonCategory.LOWER_BODY,
  [ProductType.DRESS]: VtonCategory.DRESSES,
};

/**
 * Label tiếng Việt (FE / Admin / Filter)
 */
export const PRODUCT_LABEL: Record<ProductType, string> = {
  [ProductType.TOP]: "Áo",
  [ProductType.BOTTOM]: "Quần",
  [ProductType.DRESS]: "Váy / Đầm",
};

/**
 * Helper an toàn (khuyên dùng)
 */
export function mapProductToVton(type: ProductType): VtonCategory {
  const mapped = PRODUCT_VTON_MAP[type];
  if (!mapped) {
    throw new Error(`Unsupported product type: ${type}`);
  }
  return mapped;
}
