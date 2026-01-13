// database/seeders/seed-rental-items.ts
import { DataSource } from "typeorm";
import { RentalItem } from "@/modules/rentals/entities/rental-item.entity";
import { Rental } from "@/modules/rentals/entities/rental.entity";
import { Product } from "@/modules/products/entities/product.entity";

export async function seedRentalItems(dataSource: DataSource) {
  const rentalRepo = dataSource.getRepository(Rental);
  const productRepo = dataSource.getRepository(Product);
  const itemRepo = dataSource.getRepository(RentalItem);

  // ✅ BẮT BUỘC CÓ where
  const rental = await rentalRepo.findOne({
    where: {},
    order: { id: "ASC" },
  });

  const product = await productRepo.findOne({
    where: {},
    order: { id: "ASC" },
  });

  if (!rental || !product) {
    console.log("⚠️ Không tìm thấy rental hoặc product để seed rental item");
    return;
  }

  // ✅ Check tồn tại theo quan hệ
  const exists = await itemRepo.findOne({
    where: {
      rental: { id: rental.id },
      product: { id: product.id },
    },
  });

  if (exists) {
    console.log("⚠️ Đã tồn tại rental item cho rental này và product này");
    return;
  }

  const days = 3;

  const item = itemRepo.create({
    rental,                      // quan hệ
    product,
    rentPricePerDay: product.rentPricePerDay,
    quantity: 1,
    days,
    subtotal: product.rentPricePerDay * days,
  });

  await itemRepo.save(item);

  console.log("✅ Đã seed rental item thành công");
  console.log(`   - Rental ID: ${rental.id}`);
  console.log(`   - Product ID: ${product.id}`);
}
