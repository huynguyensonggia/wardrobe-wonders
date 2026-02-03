export enum RentalStatus {
  PENDING = "pending",
  SHIPPING = "shipping",     // gộp chuẩn bị + đang giao
  ACTIVE = "active",         // khách đã nhận (đang thuê)
  COMPLETED = "completed",
  REJECTED = "rejected",     // admin từ chối
  CANCELLED = "cancelled",   // user hủy
}

// Nếu bạn vẫn cần options chung để filter/hiển thị (không dùng để render nút admin)
export const RENTAL_STATUS_OPTIONS: RentalStatus[] = [
  RentalStatus.PENDING,
  RentalStatus.SHIPPING,
  RentalStatus.ACTIVE,
  RentalStatus.COMPLETED,
  RentalStatus.REJECTED,
  RentalStatus.CANCELLED,
];

// label đẹp (UI user/admin đều dùng được)
export function formatRentalStatus(s: RentalStatus) {
  switch (s) {
    case RentalStatus.PENDING:
      return "PENDING";
    case RentalStatus.SHIPPING:
      return "SHIPPING";
    case RentalStatus.ACTIVE:
      return "ACTIVE";
    case RentalStatus.COMPLETED:
      return "COMPLETED";
    case RentalStatus.REJECTED:
      return "REJECTED";
    case RentalStatus.CANCELLED:
      return "CANCELLED";
    default:
      return String(s).toUpperCase();
  }
}
