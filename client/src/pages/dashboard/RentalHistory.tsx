import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { History } from "lucide-react";
import { rentalsApi } from "@/lib/api";
import { RentalStatus, formatRentalStatus } from "@/types/rental-status";
import { useTranslation } from "react-i18next";

type RentalItem = {
  id: number;
  quantity: number;
  days: number;
  subtotal: number;
  rentPricePerDay: number;
  product?: {
    id: number;
    name: string;
    category?: { name: string };
    imageUrl?: string;
    image_url?: string;
    images?: { url: string }[];
  };
};

type Rental = {
  id: number | string;
  startDate: string;
  endDate: string;
  status: RentalStatus | string;
  totalPrice: number;
  totalDeposit?: number;
  items?: RentalItem[];
};

function normalizeStatus(s: Rental["status"]): RentalStatus | string {
  const raw = String(s ?? "").trim();
  const lower = raw.toLowerCase();

  if (lower === RentalStatus.PENDING) return RentalStatus.PENDING;
  if (lower === RentalStatus.SHIPPING) return RentalStatus.SHIPPING;
  if (lower === RentalStatus.ACTIVE) return RentalStatus.ACTIVE;
  if (lower === RentalStatus.COMPLETED) return RentalStatus.COMPLETED;
  if (lower === RentalStatus.REJECTED) return RentalStatus.REJECTED;
  if (lower === RentalStatus.CANCELLED) return RentalStatus.CANCELLED;

  return raw;
}

export default function RentalHistory() {
  const { t } = useTranslation(); // ✅ giống MyRentals

  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await rentalsApi.getUserRentals();
      const data = (res as any)?.data ?? res;
      setRentals(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || t("common.errors.loadRentalHistoryFailed"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const completedRentals = useMemo(() => {
    return rentals.filter(
      (r) => normalizeStatus(r.status) === RentalStatus.COMPLETED
    );
  }, [rentals]);

  if (loading) {
    return (
      <div className="py-10 text-muted-foreground">
        {t("common.loading.rentalHistory")}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10">
        <p className="text-destructive mb-3">
          {t("common.errors.prefix")}: {error}
        </p>
        <Button variant="outline" onClick={load}>
          {t("common.retry")}
        </Button>
      </div>
    );
  }

  if (completedRentals.length === 0) {
    return (
      <div className="text-center py-16">
        <History className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="font-display text-xl font-medium mb-2">
          {t("rentals.history.emptyTitle")}
        </h2>
        <p className="text-muted-foreground">
          {t("rentals.history.emptyDesc")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-medium">
        {t("rentals.history.title")}
      </h2>

      <div className="space-y-4">
        {completedRentals.map((r) => {
          const rentalId = String(r.id);
          const st = normalizeStatus(r.status);
          const items = r.items ?? [];

          return (
            <Card key={rentalId} className="overflow-hidden">
              <CardContent className="p-4 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="text-sm text-muted-foreground">
                    {String(r.startDate).slice(0, 10)} —{" "}
                    {String(r.endDate).slice(0, 10)}
                  </div>

                  <Badge variant="secondary">
                    {formatRentalStatus(st as RentalStatus)}
                  </Badge>
                </div>

                {/* Items */}
                <div className="space-y-3">
                  {items.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      {t("rentals.history.noItems")}
                    </div>
                  ) : (
                    items.map((it) => {
                      const p: any = it.product || {};
                      const img =
                        p.imageUrl ||
                        p.image_url ||
                        p.images?.[0]?.url ||
                        "https://placehold.co/300x300?text=No+Image";

                      return (
                        <div
                          key={it.id ?? `${rentalId}-${p?.id ?? Math.random()}`}
                          className="flex gap-4 border rounded-lg p-3"
                        >
                          <div className="w-24 h-24 shrink-0 overflow-hidden rounded-md bg-muted">
                            <img
                              src={img}
                              alt={p?.name || t("common.product")}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-medium">
                                  {p?.name || t("common.product")}
                                </div>

                                {p?.category?.name ? (
                                  <div className="text-sm text-muted-foreground">
                                    {p.category.name}
                                  </div>
                                ) : null}

                                <div className="text-sm text-muted-foreground mt-1">
                                  {t("rentals.itemLine", {
                                    qty: it.quantity,
                                    days: it.days,
                                    pricePerDay: Number(it.rentPricePerDay || 0).toLocaleString("vi-VN"),
                                  })}
                                </div>
                              </div>

                              <div className="text-sm">
                                {t("rentals.subtotal")}:{" "}
                                <span className="font-medium">
                                  {Number(it.subtotal || 0).toLocaleString("vi-VN")}đ
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Totals */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="text-sm">
                    {t("rentals.total")}:{" "}
                    <span className="font-medium">
                      {Number(r.totalPrice || 0).toLocaleString("vi-VN")}đ
                    </span>

                    {"totalDeposit" in r ? (
                      <div className="text-xs text-muted-foreground">
                        {t("rentals.deposit")}: {Number((r as any).totalDeposit || 0).toLocaleString("vi-VN")}đ
                      </div>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
