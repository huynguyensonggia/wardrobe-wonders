import { DataSource } from "typeorm";
import { Payment } from "@/modules/payments/entities/payment.entity";
import { PaymentMethod } from "@/modules/payments/enums/payment-method.enum";
import { PaymentStatus } from "@/modules/payments/enums/payment-status.enum";
import { Rental } from "@/modules/rentals/entities/rental.entity";

export async function seedPayments(dataSource: DataSource) {
  const paymentRepo = dataSource.getRepository(Payment);
  const rentalRepo = dataSource.getRepository(Rental);

  // ✅ FIX: dùng find + take
  const rental = await rentalRepo
    .find({
      order: { id: "ASC" },
      relations: ["user"],
      take: 1,
    })
    .then((res) => res[0]);

  if (!rental || !rental.user) {
    console.log("⚠️ Không tìm thấy rental hoặc user để seed payment");
    return;
  }

  // ✅ Tránh seed trùng payment
  const exists = await paymentRepo.findOne({
    where: {
      rental: { id: rental.id },
    },
  });

  if (exists) {
    console.log("⚠️ Payment đã tồn tại cho rental này");
    return;
  }

  const payment = paymentRepo.create({
    rental,
    user: rental.user,

    amount: rental.totalPrice + rental.totalDeposit,
    method: PaymentMethod.COD,
    status: PaymentStatus.SUCCESS,

    transactionCode: `PAY-${Date.now()}`,
    paidAt: new Date(),
  });

  await paymentRepo.save(payment);

  console.log("✅ Đã seed payment thành công");
  console.log(`   - Payment ID: ${payment.id}`);
  console.log(`   - Rental ID: ${rental.id}`);
  console.log(`   - User ID: ${rental.user.id}`);
  console.log(`   - Amount: ${payment.amount.toLocaleString()} VND`);
}
