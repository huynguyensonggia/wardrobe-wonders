/**
 * Utility functions for internationalization
 */

export interface MultilingualText {
  name?: string;
  nameEn?: string | null;
  nameJa?: string | null;
  description?: string;
  descriptionEn?: string | null;
  descriptionJa?: string | null;
}

/**
 * Get localized text based on current language
 * @param item - Object containing multilingual text fields
 * @param field - Field name ('name' or 'description')
 * @param language - Current language ('vi', 'en', 'ja')
 * @param fallback - Fallback text if no translation found
 * @returns Localized text
 */
export function getLocalizedText(
  item: MultilingualText,
  field: "name" | "description",
  language: string,
  fallback: string = ""
): string {
  const baseField = item[field];
  const enField = item[`${field}En` as keyof MultilingualText] as string | null;
  const jaField = item[`${field}Ja` as keyof MultilingualText] as string | null;

  // Debug log
  console.log("getLocalizedText debug:", {
    field,
    language,
    baseField,
    enField,
    jaField,
    item,
  });

  switch (language) {
    case "en":
      return enField || baseField || fallback;
    case "ja":
      return jaField || baseField || fallback;
    case "vi":
    default:
      return baseField || fallback;
  }
}

/**
 * Get localized product name
 * @param product - Product object
 * @param language - Current language
 * @param fallback - Fallback text
 * @returns Localized product name
 */
export function getLocalizedProductName(
  product: any,
  language: string,
  fallback: string = "Unnamed Product"
): string {
  return getLocalizedText(product, "name", language, fallback);
}

/**
 * Get localized product description
 * @param product - Product object
 * @param language - Current language
 * @param fallback - Fallback text
 * @returns Localized product description
 */
export function getLocalizedProductDescription(
  product: any,
  language: string,
  fallback: string = ""
): string {
  return getLocalizedText(product, "description", language, fallback);
}
