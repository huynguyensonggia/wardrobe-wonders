export enum RentalStatus {
  PENDING = "pending",        // user tạo đơn, chờ admin
  SHIPPING = "shipping",      // admin đã nhận đơn & đang chuẩn bị/giao
  ACTIVE = "active",          // khách đã nhận hàng (đang thuê)
  COMPLETED = "completed",    // trả xong
  REJECTED = "rejected",      // admin từ chối
  CANCELLED = "cancelled",    // user hủy
}
