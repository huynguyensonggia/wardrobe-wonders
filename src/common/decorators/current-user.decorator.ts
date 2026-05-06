import { createParamDecorator, ExecutionContext } from "@nestjs/common";

/**
 * Lấy user hiện tại từ JWT payload đã được JwtAuthGuard xác thực.
 * Dùng trong controller: @CurrentUser() user: { id: number; email: string; role: string }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
