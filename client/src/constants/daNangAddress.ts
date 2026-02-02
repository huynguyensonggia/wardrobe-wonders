export const DA_NANG_DISTRICTS = [
  "Hải Châu",
  "Thanh Khê",
  "Sơn Trà",
  "Ngũ Hành Sơn",
  "Liên Chiểu",
  "Cẩm Lệ",
  "Hòa Vang",
] as const;

export type DaNangDistrict = (typeof DA_NANG_DISTRICTS)[number];

// (Optional) phường/xã mẫu — bạn có thể bổ sung dần
export const DA_NANG_WARDS: Record<DaNangDistrict, string[]> = {
  "Hải Châu": [
    "Hải Châu I",
    "Hải Châu II",
    "Thạch Thang",
    "Phước Ninh",
    "Bình Hiên",
    "Bình Thuận",
    "Hòa Thuận Tây",
    "Hòa Thuận Đông",
    "Nam Dương",
    "Hòa Cường Bắc",
    "Hòa Cường Nam",
  ],
  "Thanh Khê": [
    "Thanh Khê Tây",
    "Thanh Khê Đông",
    "Xuân Hà",
    "Tân Chính",
    "Chính Gián",
    "Thạc Gián",
    "An Khê",
    "Hòa Khê",
  ],
  "Sơn Trà": [
    "An Hải Bắc",
    "An Hải Đông",
    "An Hải Tây",
    "Mân Thái",
    "Nại Hiên Đông",
    "Phước Mỹ",
    "Thọ Quang",
  ],
  "Ngũ Hành Sơn": [
    "Mỹ An",
    "Khuê Mỹ",
    "Hòa Hải",
    "Hòa Quý",
  ],
  "Liên Chiểu": [
    "Hòa Khánh Bắc",
    "Hòa Khánh Nam",
    "Hòa Minh",
    "Hòa Hiệp Bắc",
    "Hòa Hiệp Nam",
  ],
  "Cẩm Lệ": [
    "Hòa An",
    "Hòa Phát",
    "Hòa Thọ Đông",
    "Hòa Thọ Tây",
    "Hòa Xuân",
    "Khuê Trung",
  ],
  "Hòa Vang": [
    "Hòa Phong",
    "Hòa Phú",
    "Hòa Khương",
    "Hòa Liên",
    "Hòa Ninh",
    "Hòa Nhơn",
    "Hòa Phước",
    "Hòa Sơn",
    "Hòa Tiến",
  ],
};
