import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.service.findForUser(req.user.userId);
  }

  @Get("unread-count")
  async unreadCount(@Request() req: any) {
    const count = await this.service.getUnreadCount(req.user.userId);
    return { count };
  }

  @Patch("read-all")
  async markAllRead(@Request() req: any) {
    await this.service.markAllRead(req.user.userId);
    return { success: true };
  }

  @Patch(":id/read")
  async markRead(@Param("id", ParseIntPipe) id: number, @Request() req: any) {
    await this.service.markRead(id, req.user.userId);
    return { success: true };
  }

  @Delete(":id")
  async deleteOne(@Param("id", ParseIntPipe) id: number, @Request() req: any) {
    await this.service.deleteOne(id, req.user.userId);
    return { success: true };
  }
}
