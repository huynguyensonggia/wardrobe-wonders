export enum VtonCategory {
  UPPER_BODY = "Upper-body",
  LOWER_BODY = "Lower-body",
  DRESSES = "Dresses",
}

export const VTON_CATEGORY_OPTIONS = [
  {
    value: VtonCategory.UPPER_BODY,
    label: "Upper body (Áo / thân trên)",
  },
  {
    value: VtonCategory.LOWER_BODY,
    label: "Lower body (Quần / thân dưới)",
  },
  {
    value: VtonCategory.DRESSES,
    label: "Dresses (Váy liền / toàn thân)",
  },
];
