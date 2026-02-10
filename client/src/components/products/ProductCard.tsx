import { Link } from "react-router-dom";
import { Product } from "@/types";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { t } = useTranslation();

  const imgs: any[] = (product as any)?.images ?? [];
  const primaryImage = imgs.find((img) => img?.isPrimary) || imgs[0];

  const rawStatus = String((product as any)?.status ?? "").trim();
  const statusUpper = rawStatus.toUpperCase();

  const isAvailable = statusUpper === "AVAILABLE" || statusUpper === "";
  const isRented = statusUpper === "RENTED";

  const categoryName =
    (product as any)?.category?.name ?? t("productCard.fallback.category");

  const productName = (product as any)?.name ?? t("productCard.fallback.product");

  const pricePerDay =
    (product as any)?.rentPricePerDay ??
    (product as any)?.pricePerDay ??
    0;

  const deposit = (product as any)?.deposit ?? 0;

  return (
    <Link to={`/products/${product.id}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-secondary mb-4">
        <img
          src={primaryImage?.url || "https://placehold.co/600x800?text=No+Image"}
          alt={productName}
          className="w-full h-full object-cover image-zoom"
        />

        {!isAvailable && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <Badge variant="secondary" className="text-sm">
              {isRented
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

        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium">
            ${Number(pricePerDay)}
            {t("productCard.perDay")}
          </span>
          <span className="text-xs text-muted-foreground">
            ${Number(deposit)} {t("productCard.deposit")}
          </span>
        </div>
      </div>
    </Link>
  );
}
