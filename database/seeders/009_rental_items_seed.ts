// database/seeders/seed-rental-items.ts
import { DataSource } from "typeorm";
import { RentalItem } from "@/modules/rentals/entities/rental-item.entity";
import { Rental } from "@/modules/rentals/entities/rental.entity";
import { Product } from "@/modules/products/entities/product.entity";
import { ProductVariant } from "@/modules/products/entities/product-variant.entity";
import { ProductSize } from "@/modules/products/enums/product-size.enum";

export async function seedRentalItems(dataSource: DataSource) {
  const rentalRepo = dataSource.getRepository(Rental);
  const productRepo = dataSource.getRepository(Product);
  const variantRepo = dataSource.getRepository(ProductVariant);
  const itemRepo = dataSource.getRepository(RentalItem);

  const rental = await rentalRepo.findOne({
    where: {},
    order: { id: "ASC" },
  });

  if (!rental) {
    console.log("⚠️ Không tìm thấy rental để seed rental item");
    return;
  }

  // ✅ chọn product có variant chắc chắn (an toàn hơn)
  const anyVariant = await variantRepo.findOne({
    where: {},
    order: { id: "ASC" },
    relations: { product: true },
  });

  if (!anyVariant) {
    console.log("⚠️ Chưa có product_variants. Hãy chạy seedProductVariants trước.");
    return;
  }

  const product = anyVariant.product;
  if (!product) {
    console.log("⚠️ Variant không có relation product (thiếu relations?)");
    return;
  }

  // ✅ ưu tiên variant size M của product đó
  const variant =
    (await variantRepo.findOne({
      where: { productId: product.id, size: ProductSize.M },
      order: { id: "ASC" },
    })) ??
    (await variantRepo.findOne({
      where: { productId: product.id },
      order: { id: "ASC" },
    }));

  if (!variant) {
    console.log("⚠️ Product chưa có variant để seed rental item.");
    return;
  }

  // ✅ Check tồn tại theo rental + variant (đúng theo unique index)
  const exists = await itemRepo.findOne({
    where: {
      rental: { id: rental.id },
      variantId: variant.id,
    },
  });

  if (exists) {
    console.log("⚠️ Đã tồn tại rental item cho rental này và variant này");
    return;
  }

  const days = 3;

  const item = itemRepo.create({
    rental,
    product,
    variant,
    variantId: variant.id,

    rentPricePerDay: (product as any).rentPricePerDay,
    quantity: 1,
    days,
    subtotal: (product as any).rentPricePerDay * days,
  });

  await itemRepo.save(item);

  console.log("✅ Đã seed rental item thành công");
  console.log(`   - Rental ID: ${rental.id}`);
  console.log(`   - Product ID: ${product.id}`);
  console.log(`   - Variant ID: ${variant.id} (size: ${variant.size})`);
}
