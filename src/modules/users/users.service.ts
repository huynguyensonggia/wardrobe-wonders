import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { Role } from "../../common/enums/role.enum";
import { User } from "./entities/user.entity";

// Type User không có password (type-safe)
type UserWithoutPassword = Omit<User, "password">;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) { }

  // ✅ Register/create user: luôn USER (không cho tự set role)
  async create(dto: CreateUserDto): Promise<UserWithoutPassword> {
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.repo.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      role: Role.USER, // ✅ FIX: không dùng dto.role
      phone: dto.phone,
    });

    const savedUser = await this.repo.save(user);
    return this.excludePassword(savedUser);
  }

  // ✅ Admin panel: chỉ lấy USER => không bao giờ thấy ADMIN
  async findAll(): Promise<UserWithoutPassword[]> {
    const users = await this.repo.find({
      where: { role: Role.USER },
      relations: ["rentals"],
    });
    return users.map((u) => this.excludePassword(u));
  }

  async findOne(id: number): Promise<UserWithoutPassword> {
    const user = await this.repo.findOne({
      where: { id },
      relations: ["rentals"],
    });
    if (!user) throw new NotFoundException("User not found");
    return this.excludePassword(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({
      where: { email },
      relations: ["rentals"],
    });
  }

  async update(id: number, dto: UpdateUserDto): Promise<UserWithoutPassword> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException("User not found");

    // ✅ Optional: nếu user là ADMIN thì có thể chặn update luôn (tuỳ bạn)
    if (user.role === Role.ADMIN) throw new BadRequestException("Cannot update admin account");

    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }

    Object.assign(user, dto);

    const updatedUser = await this.repo.save(user);
    return this.excludePassword(updatedUser);
  }

  async remove(id: number): Promise<{ message: string }> {
    const user = await this.repo.findOne({
      where: { id },
      relations: ["rentals"], // ✅ cần load rentals để check
    });
    if (!user) throw new NotFoundException("User not found");

    if (user.role === Role.ADMIN) {
      throw new BadRequestException("Cannot delete admin account");
    }

    // ✅ chặn delete nếu có rentals
    if (user.rentals && user.rentals.length > 0) {
      throw new BadRequestException("Cannot delete user who has rentals");
    }

    await this.repo.remove(user);
    return { message: "User deleted successfully" };
  }

  private excludePassword(user: User): UserWithoutPassword {
    const { password, ...rest } = user;
    return rest;
  }
}
