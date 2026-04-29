import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Payment } from "./entities/payment.entity";
import { PaymentStatus } from "./enums/payment-status.enum";

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentsRepo: Repository<Payment>,
  ) {}

  /** Lấy tất cả payment của một rental */
  async findByRental(rentalId: number): Promise<Payment[]> {
    return this.paymentsRepo.find({
      where: { rental: { id: rentalId } as any },
      order: { createdAt: "ASC" },
    });
  }

  /** Admin đánh dấu đã thu tiền (PENDING → PAID) */
  async markPaid(paymentId: number): Promise<Payment> {
    const payment = await this.paymentsRepo.findOne({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException(`Payment #${paymentId} not found`);

    payment.status = PaymentStatus.PAID;
    payment.paidAt = new Date();
    return this.paymentsRepo.save(payment);
  }

  /** Admin đánh dấu đã hoàn cọc (PAID → REFUNDED) */
  async markRefunded(paymentId: number): Promise<Payment> {
    const payment = await this.paymentsRepo.findOne({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException(`Payment #${paymentId} not found`);

    payment.status = PaymentStatus.REFUNDED;
    payment.paidAt = new Date();
    return this.paymentsRepo.save(payment);
  }

  /** Tóm tắt trạng thái thanh toán của một rental */
  async getSummary(rentalId: number) {
    const payments = await this.findByRental(rentalId);

    const rentalFee   = payments.filter((p) => p.transactionCode?.startsWith("RENT-"));
    const deposit     = payments.filter((p) => p.transactionCode?.startsWith("DEP-"));
    const extension   = payments.filter((p) => p.transactionCode?.startsWith("EXT-"));

    const totalPaid = payments
      .filter((p) => p.status === PaymentStatus.PAID)
      .reduce((s, p) => s + p.amount, 0);

    const totalPending = payments
      .filter((p) => p.status === PaymentStatus.PENDING)
      .reduce((s, p) => s + p.amount, 0);

    const totalRefunded = payments
      .filter((p) => p.status === PaymentStatus.REFUNDED)
      .reduce((s, p) => s + p.amount, 0);

    return {
      payments,
      rentalFee,
      deposit,
      extension,
      totalPaid,
      totalPending,
      totalRefunded,
    };
  }
}
