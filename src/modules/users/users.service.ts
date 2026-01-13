import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '../../common/enums/role.enum';
import { User } from './entities/user.entity';

// Type User không có password (type-safe)
type UserWithoutPassword = Omit<User, 'password'>;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<UserWithoutPassword> {
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.repo.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      role: dto.role || Role.USER,
      phone: dto.phone,
    });

    const savedUser = await this.repo.save(user);
    return this.excludePassword(savedUser);
  }

  async findAll(): Promise<UserWithoutPassword[]> {
    const users = await this.repo.find({
      // Optional: load relations nếu cần
      relations: ['rentals'],
    });
    return users.map(u => this.excludePassword(u));
  }

  async findOne(id: number): Promise<UserWithoutPassword> {
    const user = await this.repo.findOne({
      where: { id },
      // Optional: load relations nếu cần
      relations: ['rentals'],
    });
    if (!user) throw new NotFoundException('User not found');
    return this.excludePassword(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({
      where: { email },
      relations: ['rentals'], 
    });
  }

  async update(id: number, dto: UpdateUserDto): Promise<UserWithoutPassword> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }

    Object.assign(user, dto);

    const updatedUser = await this.repo.save(user);
    return this.excludePassword(updatedUser);
  }

  async remove(id: number): Promise<{ message: string }> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    await this.repo.remove(user);
    return { message: 'User deleted successfully' };
  }

  private excludePassword(user: User): UserWithoutPassword {
    const { password, ...rest } = user;
    return rest;
  }
}