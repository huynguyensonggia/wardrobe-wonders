import {
    Controller,
    Get,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
} from "@nestjs/common";

import { UsersService } from "../users/users.service";
import { UpdateUserDto } from "../users/dto/update-user.dto";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../modules/auth/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/enums/role.enum";

@Controller("admin/users") // => /api/admin/users
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminUsersController {
    constructor(private readonly usersService: UsersService) { }

    // ✅ GET /admin/users
    @Get()
    findAll() {
        return this.usersService.findAll();
    }

    @Get(":id")
    findOne(@Param("id") id: string) {
        return this.usersService.findOne(Number(id));
    }

    // ✅ PATCH /admin/users/:id
    @Patch(":id")
    update(@Param("id") id: string, @Body() dto: UpdateUserDto) {
        return this.usersService.update(Number(id), dto);
    }

    // ✅ DELETE /admin/users/:id
    @Delete(":id")
    remove(@Param("id") id: string) {
        return this.usersService.remove(Number(id));
    }
}
