export enum RentalStatus {
  PENDING = "pending",
  SHIPPING = "shipping",     // gộp chuẩn bị + đang giao
  ACTIVE = "active",         // khách đã nhận (đang thuê)
  COMPLETED = "completed",
  REJECTED = "rejected",     // admin từ chối
  CANCELLED = "cancelled",   // user hủy
  RETURNED = "returned",     // khách từ chối nhận khi giao, hàng trả về kho
}

// Nếu bạn vẫn cần options chung để filter/hiển thị (không dùng để render nút admin)
export const RENTAL_STATUS_OPTIONS: RentalStatus[] = [
  RentalStatus.PENDING,
  RentalStatus.SHIPPING,
  RentalStatus.ACTIVE,
  RentalStatus.COMPLETED,
  RentalStatus.REJECTED,
  RentalStatus.CANCELLED,
  RentalStatus.RETURNED,
];

export function getRentalStatusKey(s: RentalStatus | string): string {
  return `rentalStatus.${String(s).toLowerCase()}`;
}

// Fallback không có i18n (giữ cho backward compat)
export function formatRentalStatus(s: RentalStatus) {
  switch (s) {
    case RentalStatus.PENDING:   return "PENDING";
    case RentalStatus.SHIPPING:  return "SHIPPING";
    case RentalStatus.ACTIVE:    return "ACTIVE";
    case RentalStatus.COMPLETED: return "COMPLETED";
    case RentalStatus.REJECTED:  return "REJECTED";
    case RentalStatus.CANCELLED: return "CANCELLED";
    case RentalStatus.RETURNED:  return "RETURNED";
    default: return String(s).toUpperCase();
  }
}
