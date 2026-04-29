import { useLocation, Link, Navigate } from "react-router-dom";
import { CheckCircle, CalendarDays, MapPin, CreditCard, Package } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

type OrderSuccessState = {
  rentalCodes: string[];
  checkoutRef?: string;
  shipFullName: string;
  shipAddress: string;
  paymentMethod: string;
  pickupType: "delivery" | "store";
  total: number;
  totalDeposit: number;
  groups: {
    startDate: string;
    endDate: string;
    items: {
      name: string;
      size?: string;
      imageUrl?: string;
      quantity: number;
      rentPricePerDay: number;
      days: number;
    }[];
  }[];
};

export default function OrderSuccessPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const state = location.state as OrderSuccessState | null;

  // Nếu vào thẳng URL không có state → redirect về home
  if (!state) return <Navigate to="/" replace />;

  const grandTotal = state.total + state.totalDeposit;

  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4 max-w-2xl">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-full bg-accent/15 flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-10 h-10 text-accent" />
          </div>
          <h1 className="font-display text-3xl font-semibold mb-2">
            {t("orderSuccess.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("orderSuccess.subtitle")}
          </p>
          {state.rentalCodes.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 justify-center">
              {state.rentalCodes.map((code) => (
                <span
                  key={code}
                  className="inline-block bg-secondary border border-border rounded-md px-3 py-1 text-sm font-mono font-medium"
                >
                  #{code}
                </span>
              ))}
            </div>
          )}
          {state.checkoutRef && state.rentalCodes.length === 0 && (
            <p className="mt-3 text-xs font-mono text-muted-foreground">
              {state.checkoutRef}
            </p>
          )}
        </div>

        {/* Order details */}
        <div className="space-y-4">

          {/* Items per group */}
          {state.groups.map((g, gi) => (
            <div key={gi} className="border border-border rounded-xl overflow-hidden">
              <div className="bg-secondary px-4 py-3 flex items-center gap-2 text-sm font-medium">
                <CalendarDays className="w-4 h-4 text-accent" />
                {g.startDate} → {g.endDate}
                <span className="text-muted-foreground font-normal ml-1">
                  ({g.items[0]?.days ?? 0} {t("orderSuccess.days")})
                </span>
              </div>
              <div className="divide-y divide-border">
                {g.items.map((it, ii) => (
                  <div key={ii} className="flex gap-3 p-4">
                    <div className="w-14 h-16 rounded-md overflow-hidden bg-muted shrink-0">
                      <img
                        src={it.imageUrl || "https://placehold.co/200x200?text=No+Image"}
                        alt={it.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {it.name}{it.size ? ` (${it.size})` : ""}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {Number(it.rentPricePerDay).toLocaleString("vi-VN")}đ/{t("orderSuccess.perDay")}
                        {" · "}{t("orderSuccess.qty")}: {it.quantity}
                      </p>
                    </div>
                    <div className="text-sm font-medium shrink-0">
                      {(it.quantity * it.rentPricePerDay * it.days).toLocaleString("vi-VN")}đ
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Shipping info */}
          <div className="border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 font-medium text-sm">
              <MapPin className="w-4 h-4 text-accent" />
              {t("orderSuccess.shipping")}
            </div>
            <div className="text-sm text-muted-foreground space-y-1 pl-6">
              <p>{state.shipFullName}</p>
              <p>{state.shipAddress}</p>
              <p>
                {state.pickupType === "store"
                  ? t("orderSuccess.pickupStore")
                  : t("orderSuccess.pickupDelivery")}
              </p>
            </div>
          </div>

          {/* Payment summary */}
          <div className="border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 font-medium text-sm">
              <CreditCard className="w-4 h-4 text-accent" />
              {t("orderSuccess.payment")}
            </div>
            <div className="pl-6 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>{t("orderSuccess.rentalTotal")}</span>
                <span>{state.total.toLocaleString("vi-VN")}đ</span>
              </div>
              {state.totalDeposit > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("orderSuccess.deposit")}</span>
                  <span>{state.totalDeposit.toLocaleString("vi-VN")}đ</span>
                </div>
              )}
              <div className="flex justify-between font-semibold border-t border-border pt-2">
                <span>{t("orderSuccess.grandTotal")}</span>
                <span>{grandTotal.toLocaleString("vi-VN")}đ</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground pt-1">
                <Package className="w-3.5 h-3.5" />
                <span>{t(`orderSuccess.paymentMethod.${state.paymentMethod}`)}</span>
              </div>
            </div>
          </div>

          {/* Next steps hint */}
          <div className="bg-secondary rounded-xl p-4 text-sm text-muted-foreground leading-relaxed">
            {t("orderSuccess.nextSteps")}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Button asChild size="lg" className="flex-1">
            <Link to="/dashboard">{t("orderSuccess.viewRentals")}</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="flex-1">
            <Link to="/products">{t("orderSuccess.continueShopping")}</Link>
          </Button>
        </div>

      </div>
    </div>
  );
}
