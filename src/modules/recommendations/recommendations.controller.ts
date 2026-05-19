import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { RecommendationsService } from "./recommendations.service";
import { RecommendDto } from "./dto/recommend.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller("recommendations")
export class RecommendationsController {
  constructor(private readonly service: RecommendationsService) {}

  @Post()
  recommend(@Body() dto: RecommendDto) {
    return this.service.recommend(dto);
  }
}
