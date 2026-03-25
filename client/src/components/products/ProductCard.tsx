import { Link } from "react-router-dom";
import { Product } from "@/types";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language; // "vi" | "en" | "ja"

  const imgs: any[] = (product as any)?.images ?? [];
  const primaryImage = imgs.find((img) => img?.isPrimary) || imgs[0];

  const rawStatus = String((product as any)?.status ?? "").trim();
  const statusUpper = rawStatus.toUpperCase();

  const isAvailable = statusUpper === "AVAILABLE" || statusUpper === "";
  const isRented = statusUpper === "RENTED";

  const categoryName =
    (product as any)?.category?.name ?? t("productCard.fallback.category");

  // Tên đa ngôn ngữ: ưu tiên nameVi/nameJa nếu có, fallback về name
  const nameEn = (product as any)?.name ?? t("productCard.fallback.product");
  const nameVi = (product as any)?.nameVi || nameEn;
  const nameJa = (product as any)?.nameJa || nameEn;
  const productName = lang === "vi" ? nameVi : lang === "ja" ? nameJa : nameEn;

  const pricePerDay =
    (product as any)?.rentPricePerDay ??
    (product as any)?.pricePerDay ??
    0;

  const deposit = (product as any)?.deposit ?? 0;

  // Format giá theo ngôn ngữ
  const formatPrice = (amount: number) => {
      return amount.toLocaleString("vi-VN") + "đ";
    };

  // Lấy tất cả sizes từ variants
  const variants: any[] = (product as any)?.variants ?? [];
  const sizes = variants.length > 0
    ? variants
    : (product as any)?.sizes?.map((s: string) => ({ size: s, stock: 1 })) ?? [];

  // Sold out khi tất cả variants đều hết hàng
  const isSoldOut = sizes.length > 0 && sizes.every((v: any) => (v?.stock ?? 1) <= 0);

  return (
    <Link to={`/products/${product.id}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-secondary mb-4">
        <img
          src={primaryImage?.url || "https://placehold.co/600x800?text=No+Image"}
          alt={productName}
          className="w-full h-full object-cover image-zoom"
        />

        {(!isAvailable || isSoldOut) && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <Badge variant="secondary" className="text-sm">
              {isSoldOut
                ? t("productCard.status.soldOut")
                : isRented
                ? t("productCard.status.currentlyRented")
                : t("productCard.status.unavailable")}
            </Badge>
          </div>
        )}

        {(product as any)?.featured && (
          <Badge className="absolute top-3 left-3 bg-gold text-gold-foreground">
            {t("productCard.featured")}
          </Badge>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          {categoryName}
        </p>

        <h3 className="font-display text-lg font-medium group-hover:text-accent transition-colors">
          {productName}
        </h3>

        <div className="flex flex-wrap items-center gap-1 min-h-[24px]">
          {sizes.map((v: any) => {
            const s = v?.size ?? v;
            const available = (v?.stock ?? 1) > 0;
            return (
              <span
                key={s}
                className={`text-xs px-2 py-0.5 rounded border font-medium ${
                  available
                    ? "border-foreground/30 text-foreground"
                    : "border-muted text-muted-foreground line-through"
                }`}
              >
                {s}
              </span>
            );
          })}
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium">
            {formatPrice(Number(pricePerDay))}{t("productCard.perDay")}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatPrice(Number(deposit))} {t("productCard.deposit")}
          </span>
        </div>
      </div>
    </Link>
  );
}
