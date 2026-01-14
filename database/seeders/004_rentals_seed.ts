import { DataSource } from "typeorm";
import { Rental } from "@/modules/rentals/entities/rental.entity";
import { RentalStatus } from "@/modules/rentals/enums/rental-status.enum";
import { User } from "@/modules/users/entities/user.entity";

export async function seedRentals(dataSource: DataSource) {
  const rentalRepo = dataSource.getRepository(Rental);
  const userRepo = dataSource.getRepository(User);

  // Tìm user
  const user = await userRepo.findOne({
    where: { email: "user@smartdress.com" },
  });

  if (!user) {
    console.log("⚠️ Không tìm thấy user với email user@smartdress.com");
    return;
  }

  // Kiểm tra đã tồn tại rental cho user này chưa
  // (dùng quan hệ user thay vì userId)
  const exists = await rentalRepo.findOne({
    where: {
      user: { id: user.id },
    },
  });

  if (exists) {
    console.log("⚠️ Đã tồn tại ít nhất một rental cho user này");
    return;
  }

  // Tạo rental mới - gán trực tiếp object user
  const rental = rentalRepo.create({
    user, // ← Đây là cách đúng (quan hệ)
    // KHÔNG cần userId nữa vì TypeORM sẽ tự động điền foreign key

    status: RentalStatus.CREATED,
    startDate: new Date(),
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // +3 ngày
    totalPrice: 500000,
    totalDeposit: 1000000,

    // Nếu muốn điền thêm các field tính toán
    totalDays: 3,
    // note: "Rental seed đầu tiên",
  });

  await rentalRepo.save(rental);

  console.log(`✅ Đã tạo rental thành công cho user: ${user.email}`);
  console.log(`   Rental ID: ${rental.id}`);
}
