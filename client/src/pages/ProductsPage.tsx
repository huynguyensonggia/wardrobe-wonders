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

const ALL_VALUE = "all";

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  // ✅ State filters (khởi tạo từ URL)
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "", // slug
    size: searchParams.get("size") || "",
    color: searchParams.get("color") || "",
    status:
      (searchParams.get("status") as ProductStatus) ||
      ("" as ProductStatus | ""),
  });

  // ✅ QUAN TRỌNG: Sync URL -> state (khi click nav đổi query)
  const sp = searchParams.toString();
  useEffect(() => {
    setFilters({
      search: searchParams.get("search") || "",
      category: searchParams.get("category") || "",
      size: searchParams.get("size") || "",
      color: searchParams.get("color") || "",
      status:
        (searchParams.get("status") as ProductStatus) ||
        ("" as ProductStatus | ""),
    });

    // optional: đổi category thì đóng mobile filter cho gọn
    // setShowFilters(false);
  }, [sp, searchParams]);

  const updateFilter = (key: keyof typeof filters, value: string) => {
    const actualValue = value === ALL_VALUE ? "" : value;

    // update state
    setFilters((prev) => ({ ...prev, [key]: actualValue }));

    // update URL
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
      size: "",
      color: "",
      status: "" as ProductStatus | "",
    });
    setSearchParams({});
  };

  const hasActiveFilters = Object.values(filters).some((v) => v);
  const getSelectValue = (value: string) => value || ALL_VALUE;

  // 1) Fetch categories (để map slug -> id)
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

  // 2) Fetch products từ backend theo đúng query hỗ trợ: categoryId + status
  const {
    data: productsFromApi = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    // ✅ thêm filters.category để chắc chắn đổi slug là refetch
    queryKey: ["products", filters.category, categoryId, filters.status],
    queryFn: () =>
      productsApi.getAll({
        categoryId,
        status: (filters.status as ProductStatus) || undefined,
      } as any),
    staleTime: 60_000,
    enabled: filters.category ? categoryId !== undefined : true, // nếu có category slug mà chưa map ra id thì chờ
  });

  // 3) Lọc client-side cho search/size/color (backend chưa có)
  const filteredProducts = useMemo(() => {
    const list = productsFromApi as any[];

    return list.filter((product) => {
      if (filters.search) {
        const name = String(product?.name ?? "").toLowerCase();
        if (!name.includes(filters.search.toLowerCase())) return false;
      }

      if (filters.size) {
        const sizes: string[] = product?.sizes ?? [];
        if (!sizes.includes(filters.size)) return false;
      }

      if (filters.color) {
        const colors: string[] = product?.colors ?? [];
        if (!colors.includes(filters.color)) return false;
      }

      // status đã filter server-side rồi, nhưng giữ lại cũng không sao
      if (filters.status && product?.status !== filters.status) return false;

      return true;
    });
  }, [productsFromApi, filters.search, filters.size, filters.color, filters.status]);

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
        <div className="container mx-auto px-4 py-24">Loading...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4 py-24 text-destructive">
          {(error as Error)?.message || "Failed to load products"}
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
            Our Collection
          </h1>
          <p className="text-muted-foreground">
            {filteredProducts.length} pieces available
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
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
              Filters
            </Button>

            {/* Desktop Filters */}
            <div className="hidden lg:flex gap-2">
              <Select
                value={getSelectValue(filters.category)}
                onValueChange={(v) => updateFilter("category", v)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All Categories</SelectItem>
                  {(categories as any[]).map((cat) => (
                    <SelectItem key={cat.id} value={cat.slug}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={getSelectValue(filters.size)}
                onValueChange={(v) => updateFilter("size", v)}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All Sizes</SelectItem>
                  {allSizes.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={getSelectValue(filters.color)}
                onValueChange={(v) => updateFilter("color", v)}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All Colors</SelectItem>
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
                  <SelectValue placeholder="Availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All Status</SelectItem>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="RENTED">Rented</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="text-muted-foreground"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
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
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All Categories</SelectItem>
                  {(categories as any[]).map((cat) => (
                    <SelectItem key={cat.id} value={cat.slug}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={getSelectValue(filters.size)}
                onValueChange={(v) => updateFilter("size", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All Sizes</SelectItem>
                  {allSizes.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={getSelectValue(filters.color)}
                onValueChange={(v) => updateFilter("color", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All Colors</SelectItem>
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
                  <SelectValue placeholder="Availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All Status</SelectItem>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="RENTED">Rented</SelectItem>
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
            <p className="text-lg text-muted-foreground mb-4">No products found</p>
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
