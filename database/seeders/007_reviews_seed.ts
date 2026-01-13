// database/seeders/seed-reviews.ts
import { DataSource } from "typeorm";
import { Review } from "@/modules/reviews/entities/review.entity";
import { User } from "@/modules/users/entities/user.entity";
import { Product } from "@/modules/products/entities/product.entity";

export async function seedReviews(dataSource: DataSource) {
  const reviewRepo = dataSource.getRepository(Review);
  const userRepo = dataSource.getRepository(User);
  const productRepo = dataSource.getRepository(Product);

  // 1. Lấy user đầu tiên (hoặc user cụ thể nếu bạn muốn)
  const user = await userRepo.findOne({
    where: {}, // hoặc where: { email: "user@example.com" }
    order: { id: "ASC" },
  });

  // 2. Lấy product đầu tiên
  const product = await productRepo.findOne({
    where: {},
    order: { id: "ASC" },
  });

  // Kiểm tra tồn tại dữ liệu cần thiết
  if (!user) {
    console.log("⚠️ Không tìm thấy user nào trong database. Bỏ qua seed review.");
    return;
  }

  if (!product) {
    console.log("⚠️ Không tìm thấy product nào trong database. Bỏ qua seed review.");
    return;
  }

  // 3. Kiểm tra review đã tồn tại cho cặp user-product này chưa
  const exists = await reviewRepo.findOne({
    where: {
      user: { id: user.id },
      product: { id: product.id },
    },
  });

  if (exists) {
    console.log(
      `⚠️ Đã tồn tại review cho User ID ${user.id} và Product ID ${product.id}. Bỏ qua.`
    );
    return;
  }

  // 4. Tạo review mới
  const review = reviewRepo.create({
    user,                       // TypeORM sẽ tự động map user_id
    product,                    // TypeORM sẽ tự động map product_id
    rating: 5,
    comment: "Váy đẹp, form chuẩn, rất hài lòng! Chất liệu tốt, giao hàng nhanh.",
  });

  // 5. Lưu và log kết quả
  try {
    await reviewRepo.save(review);
    console.log("✅ Đã seed thành công 1 review:");
    console.log(`   - Review ID: ${review.id}`);
    console.log(`   - User ID: ${user.id}`);
    console.log(`   - Product ID: ${product.id}`);
    console.log(`   - Rating: ${review.rating}/5`);
  } catch (error) {
    console.error("❌ Lỗi khi seed review:", error);
  }
}