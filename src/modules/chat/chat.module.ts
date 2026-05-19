import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";
import { Product } from "../products/entities/product.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
