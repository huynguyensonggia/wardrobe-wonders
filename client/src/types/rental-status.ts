export enum RentalStatus {
  PENDING = "pending",
  APPROVED = "approved",
  ACTIVE = "active",
  COMPLETED = "completed",
  REJECTED = "rejected",
  CANCELLED = "cancelled",
}

export const RENTAL_STATUS_OPTIONS: RentalStatus[] = [
  RentalStatus.PENDING,
  RentalStatus.APPROVED,
  RentalStatus.ACTIVE,
  RentalStatus.COMPLETED,
  RentalStatus.REJECTED,
  RentalStatus.CANCELLED,
];

export function formatRentalStatus(s: RentalStatus) {
  // hiển thị đẹp
  return s.toUpperCase(); // PENDING, APPROVED...
}
