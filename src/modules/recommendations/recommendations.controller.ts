import { Body, Controller, Post } from "@nestjs/common";
import { RecommendationsService } from "./recommendations.service";
import { RecommendDto } from "./dto/recommend.dto";

@Controller("recommendations")
export class RecommendationsController {
  constructor(private readonly service: RecommendationsService) {}

  @Post()
  recommend(@Body() dto: RecommendDto) {
    return this.service.recommend(dto);
  }
}
