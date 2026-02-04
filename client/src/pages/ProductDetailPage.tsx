import { useMemo, useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { productsApi } from "@/lib/api";
import { useCart } from "@/contexts/CartContext";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  ChevronLeft,
  Heart,
  Share2,
  Calendar as CalendarIcon,
  Sparkles,
  Truck,
  Shield,
  ArrowRight,
  ShoppingBag,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

type VariantLite = {
  id: number;
  size: string;
  stock: number;
  isActive?: number | boolean | string;
};

function isVariantActive(x: any): boolean {
  if (x === true) return true;
  if (x === false) return false;
  if (typeof x === "number") return x === 1;
  if (typeof x === "string") {
    const s = x.trim().toLowerCase();
    return s === "1" || s === "true";
  }
  return true;
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [selectedImage, setSelectedImage] = useState(0);

  const { addItem } = useCart();

  const { data: product, isLoading, isError, error } = useQuery({
    queryKey: ["product", id],
    queryFn: () => productsApi.getById(id!),
    enabled: !!id,
    staleTime: 60_000,
  });

  // ✅ hooks luôn chạy, dù product undefined
  const rentalDays = useMemo(() => {
    return dateRange.from && dateRange.to ? differenceInDays(dateRange.to, dateRange.from) + 1 : 0;
  }, [dateRange.from, dateRange.to]);

  const startDate = useMemo(
    () => (dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : ""),
    [dateRange.from]
  );
  const endDate = useMemo(
    () => (dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : ""),
    [dateRange.to]
  );

  const images = useMemo(() => ((product as any)?.images ?? []) as any[], [product]);
  const colors = useMemo(() => ((product as any)?.colors ?? []) as string[], [product]);

  const variants: VariantLite[] = useMemo(() => {
    const raw = (product as any)?.variants ?? [];
    return raw.map((v: any) => ({
      id: Number(v.id),
      size: String(v.size),
      stock: Number(v.stock ?? 0),
      isActive: v.isActive ?? 1,
    }));
  }, [product]);

  const sizes: string[] = useMemo(() => {
    const fromVariants = variants.map((v) => v.size);
    const unique = Array.from(new Set(fromVariants));
    if (unique.length) return unique;
    return ((product as any)?.sizes ?? []) as string[];
  }, [variants, product]);

  const canRent = useMemo(() => {
    return String((product as any)?.status ?? "").toUpperCase() === "AVAILABLE";
  }, [product]);

  const selectedVariant = useMemo(() => {
    if (!selectedSize) return null;
    return variants.find((v) => v.size === selectedSize && isVariantActive(v.isActive)) ?? null;
  }, [variants, selectedSize]);

  // nếu user đang chọn size nhưng variant đó inactive/out-of-stock => reset size
  useEffect(() => {
    if (!selectedSize) return;
    const v = variants.find((x) => x.size === selectedSize);
    if (!v) return;
    const ok = isVariantActive(v.isActive) && (v.stock ?? 0) > 0;
    if (!ok) setSelectedSize("");
  }, [variants, selectedSize]);

  const canAddToCart = useMemo(() => {
    return (
      canRent &&
      !!selectedVariant?.id &&
      rentalDays > 0 &&
      (selectedVariant?.stock ?? 0) > 0
    );
  }, [canRent, selectedVariant?.id, selectedVariant?.stock, rentalDays]);

  const imageUrl = useMemo(() => {
    return (
      (product as any)?.imageUrl ||
      (product as any)?.image_url ||
      images?.[0]?.url
    );
  }, [product, images]);

  const displayName = useMemo(() => {
    const base = String((product as any)?.name ?? "");
    return `${base} (${selectedSize}${selectedColor ? `, ${selectedColor}` : ""})`;
  }, [product, selectedSize, selectedColor]);

  const totalPrice = useMemo(() => {
    const pricePerDay = Number((product as any)?.pricePerDay ?? 0);
    return rentalDays * pricePerDay;
  }, [product, rentalDays]);

  const mainImage = useMemo(() => {
    return (
      images?.[selectedImage]?.url ||
      (product as any)?.imageUrl ||
      (product as any)?.image_url ||
      "https://placehold.co/600x800?text=No+Image"
    );
  }, [images, selectedImage, product]);

  const ensureValid = () => {
    if (!canRent) return false;

    if (!selectedSize) {
      alert("Please select size");
      return false;
    }

    if (!selectedVariant?.id) {
      alert("Size/variant not found. Please re-select.");
      return false;
    }

    if ((selectedVariant.stock ?? 0) <= 0) {
      alert("This size is out of stock.");
      return false;
    }

    if (!dateRange.from || !dateRange.to) {
      alert("Please select rental dates");
      return false;
    }

    return true;
  };

  const handleAddToCart = () => {
    if (!ensureValid()) return;

    addItem(
      {
        productId: Number((product as any).id),
        variantId: Number(selectedVariant!.id),
        size: selectedVariant!.size,

        name: displayName,
        imageUrl,
        rentPricePerDay: Number((product as any).pricePerDay ?? 0),
        startDate,
        endDate,
        days: rentalDays,
      },
      1
    );

    alert("Added to cart!");
  };

  const handleRentNow = () => {
    if (!ensureValid()) return;

    navigate("/checkout", {
      state: {
        source: "rentNow",
        product: {
          productId: Number((product as any).id),
          variantId: Number(selectedVariant!.id),
          size: selectedVariant!.size,

          name: displayName,
          imageUrl,
          rentPricePerDay: Number((product as any).pricePerDay ?? 0),
          startDate,
          endDate,
          days: rentalDays,
          quantity: 1,
        },
      },
    });
  };

  // ✅ sau khi tất cả hooks đã gọi xong, mới return theo trạng thái
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-muted-foreground">Loading product...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-2xl mb-2">Failed to load product</h1>
          <p className="text-muted-foreground mb-4">{(error as Error)?.message}</p>
          <Button asChild>
            <Link to="/products">Back to Collection</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-2xl mb-4">Product not found</h1>
          <Button asChild>
            <Link to="/products">Back to Collection</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            to="/products"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Collection
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-[3/4] overflow-hidden rounded-lg bg-secondary">
              <img
                src={mainImage}
                alt={images?.[selectedImage]?.alt || (product as any).name}
                className="w-full h-full object-cover"
              />
            </div>

            {images.length > 1 && (
              <div className="flex gap-2">
                {images.map((img: any, i: number) => (
                  <button
                    key={img.id ?? i}
                    onClick={() => setSelectedImage(i)}
                    className={cn(
                      "w-20 h-24 rounded-md overflow-hidden border-2 transition-colors",
                      selectedImage === i ? "border-accent" : "border-transparent"
                    )}
                  >
                    <img
                      src={img.url}
                      alt={img.alt || (product as any).name}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="lg:py-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">
                  {(product as any).category?.name}
                </p>
                <h1 className="font-display text-3xl md:text-4xl font-semibold">
                  {(product as any).name}
                </h1>
              </div>
              <div className="flex gap-2">
                <Button variant="icon" size="icon">
                  <Heart className="w-5 h-5" />
                </Button>
                <Button variant="icon" size="icon">
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-2xl font-medium">${(product as any).pricePerDay}/day</span>
              <span className="text-muted-foreground">${(product as any).deposit} deposit</span>
            </div>

            {!canRent && (
              <Badge variant="secondary" className="mb-4">
                Currently Unavailable
              </Badge>
            )}

            <p className="text-muted-foreground mb-8 leading-relaxed">
              {(product as any).description}
            </p>

            {/* Size Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">Select Size</label>

              {variants.length === 0 && (
                <div className="text-xs text-destructive mb-2">
                  ⚠️ Product has no variants from API.
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {sizes.map((size: string) => {
                  const v = variants.find((x) => x.size === size);
                  const stock = v?.stock ?? 0;
                  const active = v ? isVariantActive(v.isActive) : true;
                  const disabled = !active || stock <= 0;

                  return (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      disabled={disabled}
                      title={disabled ? (!active ? "Variant inactive" : "Out of stock") : `Stock: ${stock}`}
                      className={cn(
                        "w-12 h-12 rounded-md border text-sm font-medium transition-all",
                        disabled && "opacity-40 cursor-not-allowed",
                        selectedSize === size
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-accent"
                      )}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>

              {selectedVariant && (
                <div className="text-xs text-muted-foreground mt-2">
                  Selected variant: #{selectedVariant.id} • Stock: {selectedVariant.stock}
                </div>
              )}
            </div>

            {/* Color Selection */}
            {colors.length > 1 && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3">Select Color</label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color: string) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={cn(
                        "px-4 py-2 rounded-md border text-sm transition-all",
                        selectedColor === color
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-accent"
                      )}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Date Selection */}
            <div className="mb-8">
              <label className="block text-sm font-medium mb-3">Rental Period</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d, yyyy")}
                        </>
                      ) : (
                        format(dateRange.from, "MMM d, yyyy")
                      )
                    ) : (
                      "Select dates"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                    disabled={{ before: new Date() }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Price Summary */}
            {rentalDays > 0 && (
              <div className="bg-secondary rounded-lg p-4 mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span>
                    ${(product as any).pricePerDay} × {rentalDays} days
                  </span>
                  <span>${totalPrice}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Refundable deposit</span>
                  <span>${(product as any).deposit}</span>
                </div>
                <div className="border-t border-border pt-2 mt-2">
                  <div className="flex justify-between font-medium">
                    <span>Total due today</span>
                    <span>${totalPrice + Number((product as any).deposit ?? 0)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <Button
                variant="hero"
                size="xl"
                className="w-full"
                disabled={!canAddToCart}
                onClick={handleRentNow}
              >
                Rent Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={handleAddToCart}
                disabled={!canAddToCart}
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Add to Cart
              </Button>

              <Button variant="hero-outline" size="lg" className="w-full" asChild>
                <Link to={`/try-on?product=${(product as any).id}`}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Try On Virtually
                </Link>
              </Button>
            </div>

            {/* Features */}
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-sm">
                <Truck className="w-5 h-5 text-accent" />
                <span>Free shipping over $100</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Shield className="w-5 h-5 text-accent" />
                <span>Damage protection included</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
