import { DataSource } from "typeorm";
import { Rental } from "@/modules/rentals/entities/rental.entity";
import { RentalStatus } from "@/modules/rentals/enums/rental-status.enum";
import { User } from "@/modules/users/entities/user.entity";

export async function seedRentals(dataSource: DataSource) {
  const rentalRepo = dataSource.getRepository(Rental);
  const userRepo = dataSource.getRepository(User);

  // 1) Tìm user
  const user = await userRepo.findOne({
    where: { email: "user@smartdress.com" },
  });

  if (!user) {
    console.log("⚠️ Không tìm thấy user với email user@smartdress.com");
    return;
  }

  // 2) Check đã có rental chưa
  const exists = await rentalRepo.findOne({
    where: { user: { id: user.id } },
  });

  if (exists) {
    console.log("⚠️ Đã tồn tại ít nhất một rental cho user này");
    return;
  }

  // 3) Seed data
  const start = new Date();
  const end = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // +3 ngày

  const rental = rentalRepo.create({
    user, // relation

    // ✅ nên set rentalCode rõ ràng (đỡ phụ thuộc BeforeInsert)
    rentalCode: `RENT-SEED-${Date.now()}`,

    status: RentalStatus.PENDING,
    startDate: start,
    endDate: end,

    totalDays: 3,
    totalPrice: 500000,
    totalDeposit: 1000000,

    note: "Seed rental",

    // ✅ SHIPPING INFO (NEW)
    shipFullName: "Nguyen Van A",
    shipPhone: "0901234567",
    shipAddress: "123 Le Loi",
    shipNote: "Gọi trước khi giao",
  });

  await rentalRepo.save(rental);

  console.log(`✅ Đã tạo rental thành công cho user: ${user.email}`);
  console.log(`   Rental ID: ${rental.id}`);
  console.log(`   Rental Code: ${rental.rentalCode}`);
}
