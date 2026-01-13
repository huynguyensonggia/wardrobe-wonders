import { DataSource } from "typeorm";
import * as bcrypt from "bcrypt";
import { User } from "@/modules/users/entities/user.entity";
import { Role } from "@/common/enums/role.enum";

export async function seedUsers(dataSource: DataSource) {
  const repo = dataSource.getRepository(User);

  const users = [
    {
      name: "Admin",
      email: "admin@smartdress.com",
      password: "admin123",
      role: Role.ADMIN,
    },
    {
      name: "Test User",
      email: "user@smartdress.com",
      password: "123456",
      role: Role.USER,
    },
  ];

  for (const u of users) {
    const existing = await repo.findOne({ where: { email: u.email } });

    if (!existing) {
      const hashed = await bcrypt.hash(u.password, 10);
      const user = repo.create({
        name: u.name,
        email: u.email,
        password: hashed,
        role: u.role,
      });
      await repo.save(user);
      console.log(`✅ Seeded user: ${u.email}`);
    }
  }
}
