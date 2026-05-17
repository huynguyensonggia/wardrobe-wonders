const ACCESSORY_SLUGS = ["bags", "jewelry", "hats", "accessories"];

export function isAccessorySlug(slug?: string): boolean {
  return ACCESSORY_SLUGS.includes(slug ?? "");
}

/** Tính tiền thuê: phụ kiện = flat fee, quần áo = ngày đầu + (ngày thêm × 10.000đ) */
export function calcItemRentalPrice(
  rentPricePerDay: number,
  days: number,
  categorySlug?: string
): number {
  if (days <= 0) return 0;
  if (isAccessorySlug(categorySlug)) return rentPricePerDay;
  return rentPricePerDay + (days - 1) * 10_000;
}
