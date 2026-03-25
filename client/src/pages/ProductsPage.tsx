import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { ProductCard } from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { productsApi, categoriesApi } from "@/lib/api";
import type { ProductStatus } from "@/types";
import { useTranslation } from "react-i18next";

const ALL_VALUE = "all";

export default function ProductsPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  // ✅ State filters (khởi tạo từ URL)
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    occasion: searchParams.get("occasion") || "",
    size: searchParams.get("size") || "",
    color: searchParams.get("color") || "",
    status:
      (searchParams.get("status") as ProductStatus) || ("" as ProductStatus | ""),
  });

  // ✅ Sync URL -> state
  const sp = searchParams.toString();
  useEffect(() => {
    setFilters({
      search: searchParams.get("search") || "",
      category: searchParams.get("category") || "",
      occasion: searchParams.get("occasion") || "",
      size: searchParams.get("size") || "",
      color: searchParams.get("color") || "",
      status:
        (searchParams.get("status") as ProductStatus) || ("" as ProductStatus | ""),
    });
  }, [sp, searchParams]);

  const updateFilter = (key: keyof typeof filters, value: string) => {
    const actualValue = value === ALL_VALUE ? "" : value;

    setFilters((prev) => ({ ...prev, [key]: actualValue }));

    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (actualValue) next.set(key, actualValue);
      else next.delete(key);
      return next;
    });
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      category: "",
      occasion: "",
      size: "",
      color: "",
      status: "" as ProductStatus | "",
    });
    setSearchParams({});
  };

  const hasActiveFilters = Object.values(filters).some((v) => v);
  const getSelectValue = (value: string) => value || ALL_VALUE;

  // 1) Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.getAll(),
    staleTime: 5 * 60_000,
  });

  // Map category slug -> categoryId
  const categoryId = useMemo(() => {
    if (!filters.category) return undefined;
    const cat = (categories as any[]).find((c) => c.slug === filters.category);
    return cat?.id ? Number(cat.id) : undefined;
  }, [filters.category, categories]);

  // 2) Fetch products
  const {
    data: productsFromApi = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["products", filters.category, categoryId, filters.status],
    queryFn: () =>
      productsApi.getAll({
        categoryId,
        status: (filters.status as ProductStatus) || undefined,
      } as any),
    staleTime: 60_000,
    enabled: filters.category ? categoryId !== undefined : true,
  });

  // 3) Client-side filter
  const filteredProducts = useMemo(() => {
    const list = productsFromApi as any[];

    return list.filter((product) => {
      if (filters.search) {
        const name = String(product?.name ?? "").toLowerCase();
        if (!name.includes(filters.search.toLowerCase())) return false;
      }

      // Filter occasion (có thể là nhiều giá trị cách nhau bởi dấu phẩy)
      if (filters.occasion) {
        const occasions = filters.occasion.split(",").map((o) => o.trim());
        const productOccasion = String(product?.occasion ?? "").toLowerCase();
        if (!occasions.includes(productOccasion)) return false;
      }

      if (filters.size) {
        const sizes: string[] = product?.sizes ?? [];
        if (!sizes.includes(filters.size)) return false;
      }

      if (filters.color) {
        const colors: string[] = product?.colors ?? [];
        if (!colors.includes(filters.color)) return false;
      }

      if (filters.status && product?.status !== filters.status) return false;

      return true;
    });
  }, [productsFromApi, filters.search, filters.size, filters.color, filters.status, filters.occasion]);

  // derive sizes/colors
  const allSizes = useMemo(() => {
    return [...new Set((productsFromApi as any[]).flatMap((p) => p.sizes ?? []))].sort();
  }, [productsFromApi]);

  const allColors = useMemo(() => {
    return [...new Set((productsFromApi as any[]).flatMap((p) => p.colors ?? []))].sort();
  }, [productsFromApi]);

  if (isLoading) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4 py-24">{t("products.loading")}</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4 py-24 text-destructive">
          {(error as Error)?.message || t("products.error")}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-semibold mb-2">
            {t("products.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("products.piecesAvailable", { count: filteredProducts.length })}
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("products.searchPlaceholder")}
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              {t("products.filters")}
            </Button>

            {/* Desktop Filters */}
            <div className="hidden lg:flex gap-2">
              <Select
                value={getSelectValue(filters.category)}
                onValueChange={(v) => updateFilter("category", v)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder={t("products.category")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>{t("products.allCategories")}</SelectItem>
                  {(categories as any[]).map((cat) => (
                    <SelectItem key={cat.id} value={cat.slug}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={getSelectValue(filters.size)} onValueChange={(v) => updateFilter("size", v)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder={t("products.size")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>{t("products.allSizes")}</SelectItem>
                  {allSizes.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={getSelectValue(filters.color)} onValueChange={(v) => updateFilter("color", v)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder={t("products.color")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>{t("products.allColors")}</SelectItem>
                  {allColors.map((color) => (
                    <SelectItem key={color} value={color}>
                      {color}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={getSelectValue(filters.status)}
                onValueChange={(v) => updateFilter("status", v as ProductStatus | "")}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder={t("products.availability")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>{t("products.allStatus")}</SelectItem>
                  <SelectItem value="AVAILABLE">{t("products.status.available")}</SelectItem>
                  <SelectItem value="RENTED">{t("products.status.rented")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground">
                <X className="w-4 h-4 mr-1" />
                {t("products.clear")}
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Filters */}
        {showFilters && (
          <div className="lg:hidden mb-8 p-4 bg-secondary rounded-lg animate-slide-down">
            <div className="grid grid-cols-2 gap-3">
              <Select
                value={getSelectValue(filters.category)}
                onValueChange={(v) => updateFilter("category", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("products.category")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>{t("products.allCategories")}</SelectItem>
                  {(categories as any[]).map((cat) => (
                    <SelectItem key={cat.id} value={cat.slug}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={getSelectValue(filters.size)} onValueChange={(v) => updateFilter("size", v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("products.size")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>{t("products.allSizes")}</SelectItem>
                  {allSizes.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={getSelectValue(filters.color)} onValueChange={(v) => updateFilter("color", v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("products.color")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>{t("products.allColors")}</SelectItem>
                  {allColors.map((color) => (
                    <SelectItem key={color} value={color}>
                      {color}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={getSelectValue(filters.status)}
                onValueChange={(v) => updateFilter("status", v as ProductStatus | "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("products.availability")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>{t("products.allStatus")}</SelectItem>
                  <SelectItem value="AVAILABLE">{t("products.status.available")}</SelectItem>
                  <SelectItem value="RENTED">{t("products.status.rented")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
            {filteredProducts.map((product: any, i: number) => (
              <div
                key={product.id}
                className="animate-fade-in"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-lg text-muted-foreground mb-4">{t("products.noProducts")}</p>
            <Button variant="outline" onClick={clearFilters}>
              {t("products.clearFilters")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
