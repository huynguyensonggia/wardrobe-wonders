import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
} from "@nestjs/common";

import { RentalsService } from "./rentals.service";
import { CreateRentalDto } from "./dto/create-rental.dto";
import { ExtendRentalDto } from "./dto/extend-rental.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("rentals") // => /api/rentals
@UseGuards(JwtAuthGuard)
export class RentalsController {
  constructor(private readonly rentalsService: RentalsService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateRentalDto) {
    // ✅ userId lấy từ token
    const userId = req.user.id;
    return this.rentalsService.create(userId, dto);
  }

  @Get()
  findMine(@Req() req: any) {
    const userId = req.user.id;
    return this.rentalsService.findMine(userId);
  }

  @Get(":id")
  findOneMine(@Req() req: any, @Param("id") id: string) {
    const userId = req.user.id;
    return this.rentalsService.findOneMine(userId, Number(id));
  }

  @Patch(":id/cancel")
  cancel(@Req() req: any, @Param("id") id: string) {
    const userId = req.user.id;
    return this.rentalsService.cancelMine(userId, Number(id));
  }

  @Post(":id/extend")
  extend(@Req() req: any, @Param("id") id: string, @Body() dto: ExtendRentalDto) {
    const userId = req.user.id;
    return this.rentalsService.extendMine(userId, Number(id), dto.endDate);
  }
}
