import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { ProductCard } from "@/components/products/ProductCard";
import { productsApi, categoriesApi } from "@/lib/api";
import { LoadingState, ErrorState } from "@/components/common";
import { useTranslation } from "react-i18next";

const ACCESSORY_SLUGS = ["bags", "jewelry", "hats"];

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();

  const isAllAccessories = slug === "accessories";

  const { data: categories = [], isLoading: loadingCats } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.getAll(),
    staleTime: 5 * 60_000,
  });

  // Với slug thường: tìm đúng category
  const category = useMemo(
    () => (categories as any[]).find((c) => c.slug === slug),
    [categories, slug]
  );

  // Với "accessories": gom tất cả category phụ kiện
  const accessoryCategoryIds = useMemo(() => {
    if (!isAllAccessories) return [];
    return (categories as any[])
      .filter((c) => ACCESSORY_SLUGS.includes(c.slug))
      .map((c) => Number(c.id));
  }, [categories, isAllAccessories]);

  const categoryId = !isAllAccessories && category?.id ? Number(category.id) : undefined;

  // Fetch cho slug thường
  const {
    data: singleProducts = [],
    isLoading: loadingSingle,
    isError: isErrorSingle,
    error: errorSingle,
  } = useQuery({
    queryKey: ["products", "category", slug, categoryId],
    queryFn: () => productsApi.getAll({ categoryId } as any),
    staleTime: 60_000,
    enabled: !isAllAccessories && categoryId !== undefined,
  });

  // Fetch song song cho từng accessory category
  const {
    data: bagsProducts = [],
    isLoading: loadingBags,
  } = useQuery({
    queryKey: ["products", "category", "bags", accessoryCategoryIds[0]],
    queryFn: () => productsApi.getAll({ categoryId: accessoryCategoryIds[0] } as any),
    staleTime: 60_000,
    enabled: isAllAccessories && accessoryCategoryIds.length > 0,
  });

  const {
    data: jewelryProducts = [],
    isLoading: loadingJewelry,
  } = useQuery({
    queryKey: ["products", "category", "jewelry", accessoryCategoryIds[1]],
    queryFn: () => productsApi.getAll({ categoryId: accessoryCategoryIds[1] } as any),
    staleTime: 60_000,
    enabled: isAllAccessories && accessoryCategoryIds.length > 1,
  });

  const {
    data: hatsProducts = [],
    isLoading: loadingHats,
  } = useQuery({
    queryKey: ["products", "category", "hats", accessoryCategoryIds[2]],
    queryFn: () => productsApi.getAll({ categoryId: accessoryCategoryIds[2] } as any),
    staleTime: 60_000,
    enabled: isAllAccessories && accessoryCategoryIds.length > 2,
  });

  // Gộp tất cả sản phẩm phụ kiện, loại trùng
  const allAccessoryProducts = useMemo(() => {
    const merged = [
      ...(bagsProducts as any[]),
      ...(jewelryProducts as any[]),
      ...(hatsProducts as any[]),
    ];
    const seen = new Set<number>();
    return merged.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [bagsProducts, jewelryProducts, hatsProducts]);

  const products = isAllAccessories ? allAccessoryProducts : (singleProducts as any[]);
  const isLoading = isAllAccessories
    ? loadingCats || loadingBags || loadingJewelry || loadingHats
    : loadingSingle || (slug && categoryId === undefined && (categories as any[]).length === 0);
  const isError = !isAllAccessories && isErrorSingle;
  const error = errorSingle;

  const categoryName = isAllAccessories
    ? t("navbar.accessories")
    : category?.name ?? slug ?? "";

  if (isLoading) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          <LoadingState text={t("products.loading")} />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          <ErrorState message={(error as Error)?.message || t("products.error")} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("productDetail.backToCollection")}
        </Link>

        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-semibold mb-2">
            {categoryName}
          </h1>
          <p className="text-muted-foreground">
            {t("products.piecesAvailable", { count: products.length })}
          </p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            {t("products.noProducts")}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
