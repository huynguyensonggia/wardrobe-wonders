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
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from "lucide-react";

import { productsApi, categoriesApi } from "@/lib/api";
import type { ProductStatus } from "@/types";
import { useTranslation } from "react-i18next";
import { LoadingState, ErrorState } from "@/components/common";
import { getLocalizedCategoryName, getLocalizedColor } from "@/lib/mappers";

const ALL_VALUE = "all";

export default function ProductsPage() {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  // Debounced search để không gọi API mỗi keystroke
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchInput);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (searchInput) next.set("search", searchInput);
        else next.delete("search");
        return next;
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, setSearchParams]);

  // ✅ State filters (khởi tạo từ URL)
  const [filters, setFilters] = useState({
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
      category: "",
      occasion: "",
      size: "",
      color: "",
      status: "" as ProductStatus | "",
    });
    setSearchInput("");
    setDebouncedSearch("");
    setSearchParams({});
  };

  const hasActiveFilters = Object.values(filters).some((v) => v) || !!searchInput;
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

  // 2) Fetch products — search gọi BE, size/color filter client-side
  const {
    data: productsFromApi = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["products", filters.category, categoryId, filters.status, filters.occasion, debouncedSearch],
    queryFn: () =>
      productsApi.getAll({
        categoryId,
        status: (filters.status as ProductStatus) || undefined,
        occasion: filters.occasion || undefined,
        search: debouncedSearch || undefined,
      } as any),
    staleTime: 60_000,
    enabled: filters.category ? categoryId !== undefined : true,
  });

  const ACCESSORY_SLUGS = ["bags", "jewelry", "hats", "accessories"];
  const HIDDEN_CATEGORY_SLUGS = [...ACCESSORY_SLUGS];

  // 3) Client-side filter — loại trừ phụ kiện, chỉ lọc size/color/status
  const filteredProducts = useMemo(() => {
    const list = (productsFromApi as any[]).filter(
      (product) => !ACCESSORY_SLUGS.includes(product?.category?.slug ?? "")
    );

    return list.filter((product) => {
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
  }, [productsFromApi, filters.size, filters.color, filters.status]);

  // chỉ lấy sizes/colors từ sản phẩm không phải phụ kiện
  const nonAccessoryProducts = useMemo(
    () => (productsFromApi as any[]).filter((p) => !ACCESSORY_SLUGS.includes(p?.category?.slug ?? "")),
    [productsFromApi]
  );

  const allSizes = useMemo(() => {
    return [...new Set(nonAccessoryProducts.flatMap((p) => p.sizes ?? []))].sort();
  }, [nonAccessoryProducts]);

  // Map Vietnamese color → localized display name
  const allColors = useMemo(() => {
    const map = new Map<string, string>();
    nonAccessoryProducts.forEach((p) => {
      const viColor = p.color ?? "";
      if (viColor && !map.has(viColor)) {
        const label = getLocalizedColor(p, i18n.language);
        map.set(viColor, label ? label.charAt(0).toUpperCase() + label.slice(1) : label);
      }
    });
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [nonAccessoryProducts, i18n.language]);

  const isSearching = searchInput !== debouncedSearch;

  // Pagination
  const PAGE_SIZE = 12;
  const [page, setPage] = useState(1);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [filteredProducts.length]);

  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE);
  const pagedProducts = filteredProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 pr-10"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-muted-foreground/40 border-t-muted-foreground rounded-full animate-spin" />
              </div>
            )}
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
                  {(categories as any[]).filter((cat) => !HIDDEN_CATEGORY_SLUGS.includes(cat.slug)).map((cat) => (
                    <SelectItem key={cat.id} value={cat.slug}>
                      {getLocalizedCategoryName(cat, i18n.language)}
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
                  {allColors.map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
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
                  {(categories as any[]).filter((cat) => !HIDDEN_CATEGORY_SLUGS.includes(cat.slug)).map((cat) => (
                    <SelectItem key={cat.id} value={cat.slug}>
                      {getLocalizedCategoryName(cat, i18n.language)}
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
                  {allColors.map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
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
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
              {pagedProducts.map((product: any, i: number) => (
                <div
                  key={product.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "..." ? (
                      <span key={`e${i}`} className="px-2 text-muted-foreground">…</span>
                    ) : (
                      <Button
                        key={p}
                        variant={p === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(p as number)}
                        className="min-w-9"
                      >
                        {p}
                      </Button>
                    )
                  )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
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
