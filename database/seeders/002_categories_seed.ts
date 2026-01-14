import { DataSource } from "typeorm";
import { Category } from "@/modules/categories/entities/category.entity";
import { VtonCategory } from "@/modules/categories/enums/vton-category.enum";

type SeedItem = {
  name: string;
  slug: string;
  description?: string | null;
  isActive?: boolean;
  vtonCategory: VtonCategory;
};

export async function seedCategories(dataSource: DataSource) {
  const repo = dataSource.getRepository(Category);

  const items = [
    {
      name: "Áo",
      slug: "tops",
      vtonCategory: VtonCategory.UPPER_BODY,
    },
    {
      name: "Quần",
      slug: "pants",
      vtonCategory: VtonCategory.LOWER_BODY,
    },
    {
      name: "Váy / Đầm",
      slug: "dresses",
      vtonCategory: VtonCategory.DRESSES,
    },
    {
      name: "Blazer",
      slug: "outerwear",
      vtonCategory: VtonCategory.OUTERWEAR,
    },
  ];

  for (const it of items) {
    const existing = await repo.findOne({ where: { slug: it.slug } });

    if (!existing) {
      await repo.save(
        repo.create({
          name: it.name,
          slug: it.slug,
          vtonCategory: it.vtonCategory,
          isActive: true,
        }),
      );
      console.log(`✅ Seeded category: ${it.slug}`);
    }
  }

  console.log("✅ Categories seeded");
}

