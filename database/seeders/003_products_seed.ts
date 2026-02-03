import { DataSource } from "typeorm";
import { Product } from "@/modules/products/entities/product.entity";
import { Category } from "@/modules/categories/entities/category.entity";
import { ProductSize } from "@/modules/products/enums/product-size.enum";
import { ProductStatus } from "@/modules/products/enums/product-status.enum";
import { ProductOccasion } from "@/modules/products/enums/product-occasion.enum";

export async function seedProducts(dataSource: DataSource) {
  const productRepo = dataSource.getRepository(Product);
  const categoryRepo = dataSource.getRepository(Category);

  const count = await productRepo.count();
  if (count > 0) {
    console.log("↩️ Products already seeded");
    return;
  }

  // ===== CATEGORY =====
  const partyCategory = await categoryRepo.findOneBy({ slug: "tops" });
  if (!partyCategory) throw new Error("❌ Category party-dress not found");

  // ===== PRODUCTS =====
  const products = [
    productRepo.create({
      name: "Đầm dạ hội đen",
      category: partyCategory,
      occasion: ProductOccasion.WEDDING, // ✅ QUAN TRỌNG
      rentPricePerDay: 250000,
      deposit: 1000000,
      color: "black",
      status: ProductStatus.AVAILABLE,
      imageUrl: "https://example.com/party-black.jpg",
      description: "Đầm dạ hội sang trọng màu đen",
    }),

    productRepo.create({
      name: "Đầm dự tiệc đỏ",
      category: partyCategory,
      occasion: ProductOccasion.PARTY, // ✅ QUAN TRỌNG
      rentPricePerDay: 220000,
      deposit: 900000,
      color: "red",
      status: ProductStatus.MAINTENANCE,
      imageUrl: "https://example.com/party-red.jpg",
      description: "Đầm đỏ nổi bật cho tiệc tối",
    }),
  ];

  await productRepo.save(products);
  console.log("✅ Seeded products");
}
