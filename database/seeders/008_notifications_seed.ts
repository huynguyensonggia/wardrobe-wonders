// database/seeders/seed-notifications.ts
import { DataSource } from "typeorm";
import { Notification } from "@/modules/notifications/entities/notification.entity";
import { NotificationType } from "@/modules/notifications/enums/notification-type.enum";
import { User } from "@/modules/users/entities/user.entity";

export async function seedNotifications(dataSource: DataSource) {
  const notificationRepo = dataSource.getRepository(Notification);
  const userRepo = dataSource.getRepository(User);

  const user = await userRepo.findOneBy({});

  if (!user) {
    console.log(
      "⚠️ Không tìm thấy bất kỳ user nào trong database. Bỏ qua seed notification.",
    );
    return;
  }

  // Kiểm tra notification SYSTEM đã tồn tại chưa
  const exists = await notificationRepo.findOne({
    where: {
      user: { id: user.id },
      type: NotificationType.SYSTEM,
    },
  });

  if (exists) {
    console.log(
      `⚠️ Đã tồn tại notification SYSTEM cho User ID ${user.id}. Bỏ qua.`,
    );
    return;
  }

  // Tạo notification mới
  const notification = notificationRepo.create({
    user, // TypeORM tự map user_id
    title: "Chào mừng bạn đến SmartClother",
    message: "Chúc bạn có trải nghiệm thuê trang phục tuyệt vời!",
    type: NotificationType.SYSTEM,
    isRead: false,
  });

  try {
    await notificationRepo.save(notification);

    console.log("✅ Đã seed notification thành công:");
    console.log(`   - Notification ID: ${notification.id}`);
    console.log(`   - User ID: ${user.id}`);
    console.log(`   - Type: ${notification.type}`);
    console.log(`   - Created At: ${notification.createdAt}`);
  } catch (error) {
    console.error("❌ Lỗi khi lưu notification:", error);
  }
}
