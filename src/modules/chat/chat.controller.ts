import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { ChatDto } from "./dto/chat.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller("chat")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  chat(@Body() dto: ChatDto) {
    return this.chatService.chat(dto);
  }
}
