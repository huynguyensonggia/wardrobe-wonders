import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

import {
  format,
  differenceInDays,
  startOfDay,
} from "date-fns";

import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

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

/** Tính tổng tiền thuê: ngày đầu = basePrice, mỗi ngày thêm +10.000 */
function calcRentalPrice(basePrice: number, days: number): number {
  if (days <= 0) return 0;
  return basePrice + (days - 1) * 10_000;
}

export default function ProductDetailPage() {
  const { t, i18n } = useTranslation();
  const MIN_RENTAL_DAYS = 1;

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
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

  const rentalDays = useMemo(() => {
    return dateRange.from && dateRange.to
      ? differenceInDays(dateRange.to, dateRange.from) + 1
      : 0;
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
      rentalDays >= 1 &&
      (selectedVariant?.stock ?? 0) > 0
    );
  }, [canRent, selectedVariant?.id, selectedVariant?.stock, rentalDays]);

  const imageUrl = useMemo(() => {
    return (product as any)?.imageUrl || (product as any)?.image_url || images?.[0]?.url;
  }, [product, images]);

  const displayName = useMemo(() => {
    const base = String((product as any)?.name ?? "");
    return `${base} (${selectedSize}${selectedColor ? `, ${selectedColor}` : ""})`;
  }, [product, selectedSize, selectedColor]);

  const totalPrice = useMemo(() => {
    const pricePerDay = Number((product as any)?.rentPricePerDay ?? (product as any)?.pricePerDay ?? 0);
    return calcRentalPrice(pricePerDay, rentalDays);
  }, [product, rentalDays]);

  const mainImage = useMemo(() => {
    return (
      images?.[selectedImage]?.url ||
      (product as any)?.imageUrl ||
      (product as any)?.image_url ||
      "https://placehold.co/600x800?text=No+Image"
    );
  }, [images, selectedImage, product]);

  // disable days: past only
  const disabledDays = useMemo(() => {
    const today = startOfDay(new Date());
    return (date: Date) => startOfDay(date) < today;
  }, []);

  // auto-suggest: khi chọn from mà chưa có to, set to = from (1 ngày)
  useEffect(() => {
    if (!dateRange.from) return;
    if (dateRange.to) return;
    setDateRange((prev) => ({ ...prev, to: prev.from }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange.from]);

  const ensureValid = () => {
    if (!canRent) return false;

    if (!selectedSize) {
      alert(t("productDetail.alerts.selectSize"));
      return false;
    }

    if (!selectedVariant?.id) {
      alert(t("productDetail.alerts.variantNotFound"));
      return false;
    }

    if ((selectedVariant.stock ?? 0) <= 0) {
      alert(t("productDetail.alerts.outOfStock"));
      return false;
    }

    if (!dateRange.from || !dateRange.to) {
      alert(t("productDetail.alerts.selectDates"));
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
        rentPricePerDay: Number((product as any).rentPricePerDay ?? (product as any).pricePerDay ?? 0),
        startDate,
        endDate,
        days: rentalDays,
      },
      1
    );

    alert(t("productDetail.alerts.addedToCart"));
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
          rentPricePerDay: Number((product as any).rentPricePerDay ?? (product as any).pricePerDay ?? 0),
          startDate,
          endDate,
          days: rentalDays,
          quantity: 1,
        },
      },
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-muted-foreground">{t("productDetail.loading")}</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-2xl mb-2">{t("productDetail.errorTitle")}</h1>
          <p className="text-muted-foreground mb-4">{(error as Error)?.message}</p>
          <Button asChild>
            <Link to="/products">{t("productDetail.backToCollection")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-2xl mb-4">{t("productDetail.notFoundTitle")}</h1>
          <Button asChild>
            <Link to="/products">{t("productDetail.backToCollection")}</Link>
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
            {t("productDetail.backToCollection")}
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
                    aria-label={t("productDetail.galleryImage", { index: i + 1 })}
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
                  {(i18n.language === "en" ? (product as any).nameEn : i18n.language === "ja" ? (product as any).nameJa : null) || (product as any).name}
                </h1>
              </div>
              <div className="flex gap-2">
                <Button variant="icon" size="icon" aria-label={t("productDetail.actions.favorite")}>
                  <Heart className="w-5 h-5" />
                </Button>
                <Button variant="icon" size="icon" aria-label={t("productDetail.actions.share")}>
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-2xl font-medium">
                {Number((product as any).pricePerDay).toLocaleString("vi-VN")}đ{t("productDetail.perDay")}
              </span>
              <span className="text-muted-foreground">
                {Number((product as any).deposit).toLocaleString("vi-VN")}đ {t("productDetail.deposit")}
              </span>
            </div>

            {!canRent && (
              <Badge variant="secondary" className="mb-4">
                {t("productDetail.unavailable")}
              </Badge>
            )}

            <p className="text-muted-foreground mb-8 leading-relaxed">
              {(i18n.language === "en" ? (product as any).descriptionEn : i18n.language === "ja" ? (product as any).descriptionJa : null) || (product as any).description}
            </p>

            {/* Size Selection */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium">{t("productDetail.selectSize")}</label>

                <Dialog>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="text-xs italic text-muted-foreground hover:text-foreground underline underline-offset-4"
                    >
                      {t("productDetail.sizeGuide")}
                    </button>
                  </DialogTrigger>

                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>{t("productDetail.sizeChartTitle")}</DialogTitle>
                    </DialogHeader>

                    <div className="overflow-auto">
                      <img
                        src="/size-chart.png"
                        alt={t("productDetail.sizeChartAlt")}
                        className="w-full h-auto rounded-md"
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {variants.length === 0 && (
                <div className="text-xs text-destructive mb-2">
                  {t("productDetail.noVariantsWarning")}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {sizes.map((size: string) => {
                  const v = variants.find((x) => x.size === size);
                  const stock = v?.stock ?? 0;
                  const active = v ? isVariantActive(v.isActive) : true;
                  const disabled = !active || stock <= 0;

                  const title = disabled
                    ? !active
                      ? t("productDetail.tooltips.variantInactive")
                      : t("productDetail.tooltips.outOfStock")
                    : t("productDetail.tooltips.stock", { stock });

                  return (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      disabled={disabled}
                      title={title}
                      className={cn(
                        "px-3 h-10 rounded-md border text-sm font-medium transition-all",
                        disabled && "opacity-40 cursor-not-allowed",
                        selectedSize === size
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-accent"
                      )}
                    >
                      <div>{size}</div>
                      <div className="text-xs font-normal opacity-70">
                        {disabled ? "Hết" : `${stock} còn`}
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedVariant && (
                <div className="text-xs text-muted-foreground mt-2">
                  {t("productDetail.selectedVariant", {
                    id: selectedVariant.id,
                    stock: selectedVariant.stock,
                  })}
                </div>
              )}
            </div>

            {/* Color Selection */}
            {colors.length > 1 && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3">
                  {t("productDetail.selectColor")}
                </label>
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
              <label className="block text-sm font-medium mb-3">
                {t("productDetail.rentalPeriod")}
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "MMM d")} -{" "}
                          {format(dateRange.to, "MMM d, yyyy")}
                        </>
                      ) : (
                        format(dateRange.from, "MMM d, yyyy")
                      )
                    ) : (
                      t("productDetail.selectDates")
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={(range) => {
                      if (!range?.from) {
                        setDateRange({ from: undefined, to: undefined });
                        return;
                      }
                      // Nếu chỉ chọn 1 ngày (from = to), cho phép
                      setDateRange({ from: range.from, to: range.to ?? range.from });
                    }}
                    disabled={disabledDays}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>

            </div>

            {/* Price Summary */}
            {rentalDays >= 1 && (
              <div className="bg-secondary rounded-lg p-4 mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span>
                    {Number((product as any).rentPricePerDay ?? (product as any).pricePerDay ?? 0).toLocaleString("vi-VN")}đ
                    {rentalDays > 1 && (
                      <> + {((rentalDays - 1) * 10_000).toLocaleString("vi-VN")}đ</>
                    )}{" "}
                    ({rentalDays} {t("productDetail.days")})
                  </span>
                  <span>{totalPrice.toLocaleString("vi-VN")}đ</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span>{t("productDetail.refundableDeposit")}</span>
                  <span>{Number((product as any).deposit).toLocaleString("vi-VN")}đ</span>
                </div>
                <div className="border-t border-border pt-2 mt-2">
                  <div className="flex justify-between font-medium">
                    <span>{t("productDetail.totalDueToday")}</span>
                    <span>
                      {(totalPrice + Number((product as any).deposit ?? 0)).toLocaleString("vi-VN")}đ
                    </span>
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
                {t("productDetail.rentNow")}
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
                {t("productDetail.addToCart")}
              </Button>

              <Button variant="hero-outline" size="lg" className="w-full" asChild>
                <Link to={`/try-on?product=${(product as any).id}`}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {t("productDetail.tryOnVirtually")}
                </Link>
              </Button>
            </div>

            {/* Features */}
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-sm">
                <Truck className="w-5 h-5 text-accent" />
                <span>{t("productDetail.features.freeShipping")}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Shield className="w-5 h-5 text-accent" />
                <span>{t("productDetail.features.damageProtection")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
