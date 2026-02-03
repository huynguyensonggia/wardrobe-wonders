import { DataSource } from "typeorm";
import { Product } from "@/modules/products/entities/product.entity";
import { ProductVariant } from "@/modules/products/entities/product-variant.entity";
import { ProductSize } from "@/modules/products/enums/product-size.enum";

export async function seedProductVariants(dataSource: DataSource) {
  const variantRepo = dataSource.getRepository(ProductVariant);
  const productRepo = dataSource.getRepository(Product);

  const count = await variantRepo.count();
  if (count > 0) {
    console.log("↩️ Product variants already seeded");
    return;
  }

  // lấy các product bạn đã seed
  const blackDress = await productRepo.findOne({ where: { name: "Đầm dạ hội đen" } });
  const redDress = await productRepo.findOne({ where: { name: "Đầm dự tiệc đỏ" } });

  if (!blackDress || !redDress) {
    throw new Error("❌ Seed products not found. Run seedProducts first.");
  }

  const variants: ProductVariant[] = [
    // ===== Đầm dạ hội đen =====
    variantRepo.create({
      product: blackDress,
      size: ProductSize.S,
      stock: 1,
      isActive: true,
    }),
    variantRepo.create({
      product: blackDress,
      size: ProductSize.M,
      stock: 2,
      isActive: true,
    }),
    variantRepo.create({
      product: blackDress,
      size: ProductSize.L,
      stock: 0,
      isActive: true,
    }),

    // ===== Đầm dự tiệc đỏ =====
    variantRepo.create({
      product: redDress,
      size: ProductSize.XL,
      stock: 1,
      isActive: true,
    }),
    variantRepo.create({
      product: redDress,
      size: ProductSize.XXL,
      stock: 1,
      isActive: true,
    }),
  ];

  await variantRepo.save(variants);
  console.log("✅ Seeded product variants");

  // (OPTIONAL) Nếu bạn muốn "products.quantity" = tổng stock variants
  // (OPTIONAL) Và "products.size" chỉ để fallback UI (ví dụ set = 'M')
  // => bạn có thể sync như sau:

  /*
  const products = [blackDress.id, redDress.id];
  for (const pid of products) {
    const vs = await variantRepo.find({ where: { product: { id: pid } } });
    const total = vs.reduce((sum, v) => sum + (v.stock || 0), 0);
    await productRepo.update(pid, { quantity: total, size: ProductSize.M });
  }
  */
}
