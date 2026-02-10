import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function CartPage() {
  const { t } = useTranslation();

  const { items, count, updateQty, removeItem, clear } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-10 text-center">
        <h2 className="text-xl font-medium mb-2">{t("cart.empty.title")}</h2>
        <p className="text-muted-foreground mb-6">{t("cart.empty.desc")}</p>
        <Button asChild>
          <Link to="/products">{t("cart.empty.browse")}</Link>
        </Button>
      </div>
    );
  }

  // ✅ tổng tiền = sum(subtotal từng item)
  const total = items.reduce(
    (sum, it) => sum + it.quantity * it.rentPricePerDay * it.days,
    0
  );

  const handleCheckout = () => {
    const missingVariant = items.find((it) => !it.variantId);
    if (missingVariant) {
      alert(t("cart.alert.missingVariant"));
      return;
    }

    navigate("/checkout", {
      state: { source: "cart" },
    });
  };

  return (
    <div className="container mx-auto px-4 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium">{t("cart.title")}</h2>
        <div className="text-sm text-muted-foreground">
          {t("cart.itemsCount", { count })}
        </div>
      </div>

      <div className="space-y-3">
        {items.map((it) => {
          const lineTotal = it.quantity * it.rentPricePerDay * it.days;

          const key = `${it.productId}_${it.variantId}_${it.startDate}_${it.endDate}`;

          return (
            <div key={key} className="border rounded-lg p-4 flex gap-4">
              <div className="w-20 h-20 bg-muted rounded-md overflow-hidden shrink-0">
                <img
                  src={it.imageUrl || "https://placehold.co/200x200?text=No+Image"}
                  alt={it.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{it.name}</div>

                    <div className="text-sm text-muted-foreground">
                      {it.startDate} → {it.endDate} ({t("cart.days", { days: it.days })})
                    </div>

                    <div className="text-sm text-muted-foreground">
                      {t("cart.size")}{" "}
                      <span className="font-medium">
                        {it.size ?? t("cart.variantFallback", { id: it.variantId })}
                      </span>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      ${it.rentPricePerDay}/{t("cart.perDay")}
                    </div>

                    <div className="text-sm font-medium mt-1">
                      {t("cart.lineTotal")}: ${lineTotal}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    className="text-destructive"
                    onClick={() =>
                      removeItem(it.productId, it.variantId, it.startDate, it.endDate)
                    }
                  >
                    {t("cart.remove")}
                  </Button>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateQty(
                        it.productId,
                        it.variantId,
                        it.startDate,
                        it.endDate,
                        it.quantity - 1
                      )
                    }
                    disabled={it.quantity <= 1}
                    aria-label={t("cart.qty.decrease")}
                  >
                    -
                  </Button>

                  <div className="w-10 text-center">{it.quantity}</div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateQty(
                        it.productId,
                        it.variantId,
                        it.startDate,
                        it.endDate,
                        it.quantity + 1
                      )
                    }
                    aria-label={t("cart.qty.increase")}
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <Button variant="outline" onClick={clear}>
          {t("cart.clear")}
        </Button>

        <div className="flex items-center gap-4">
          <div className="text-sm">
            {t("cart.total")}: <span className="font-medium">${total}</span>
          </div>
          <Button onClick={handleCheckout}>{t("cart.checkout")}</Button>
        </div>
      </div>
    </div>
  );
}
