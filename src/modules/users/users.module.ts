import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), // ← Quan trọng: khai báo repository cho User
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService], // export để AuthModule hoặc module khác dùng
})
export class UsersModule {}