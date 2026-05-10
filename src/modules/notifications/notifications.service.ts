import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Notification } from "./entities/notification.entity";
import { NotificationType } from "./enums/notification-type.enum";

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
  ) {}

  async create(userId: number, title: string, message: string, type: NotificationType): Promise<void> {
    const notif = this.repo.create({
      user: { id: userId } as any,
      title,
      message,
      type,
    });
    await this.repo.save(notif);
  }

  async findForUser(userId: number) {
    return this.repo.find({
      where: { user: { id: userId } as any },
      order: { createdAt: "DESC" },
      take: 50,
    });
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.repo.count({
      where: { user: { id: userId } as any, isRead: false as any },
    });
  }

  async markRead(id: number, userId: number): Promise<void> {
    await this.repo.update({ id, user: { id: userId } as any }, { isRead: true });
  }

  async markAllRead(userId: number): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update()
      .set({ isRead: true })
      .where("user_id = :userId AND is_read = 0", { userId })
      .execute();
  }

  async deleteOne(id: number, userId: number): Promise<void> {
    await this.repo.delete({ id, user: { id: userId } as any });
  }
}
