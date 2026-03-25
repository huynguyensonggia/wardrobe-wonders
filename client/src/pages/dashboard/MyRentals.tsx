import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Calendar, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
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
  };
};

type Rental = {
  id: number | string;
  startDate: string;
  endDate: string;
  status: RentalStatus | string;
  totalPrice: number;
  totalDeposit: number;
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

export default function MyRentals() {
  const { t } = useTranslation();

  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extend dialog state
  const [extendRentalId, setExtendRentalId] = useState<string | null>(null);
  const [extendDate, setExtendDate] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await rentalsApi.getUserRentals();
      const data = (res as any)?.data ?? res;
      setRentals(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || t("common.errors.loadRentalsFailed"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onCancel(rentalId: string) {
    try {
      await rentalsApi.cancel(rentalId);
      await load();
    } catch (e: any) {
      alert(e?.message || t("common.errors.cancelFailed"));
    }
  }

  async function onExtend() {
    if (!extendRentalId || !extendDate) return;
    try {
      await rentalsApi.extend(extendRentalId, extendDate);
      setExtendRentalId(null);
      setExtendDate("");
      await load();
      alert(t("rentals.extend.success"));
    } catch (e: any) {
      alert(e?.message || t("rentals.extend.error"));
    }
  }

  const currentRentals = useMemo(() => {
    return rentals.filter((r) => {
      const st = normalizeStatus(r.status);
      return st !== RentalStatus.COMPLETED && st !== RentalStatus.REJECTED;
    });
  }, [rentals]);

  const activeCount = useMemo(() => {
    return currentRentals.filter(
      (r) => normalizeStatus(r.status) !== RentalStatus.CANCELLED
    ).length;
  }, [currentRentals]);

  if (loading) {
    return <div className="py-10 text-muted-foreground">{t("common.loading.rentals")}</div>;
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

  if (!currentRentals.length) {
    return (
      <div className="text-center py-16">
        <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="font-display text-xl font-medium mb-2">
          {t("rentals.current.emptyTitle")}
        </h2>
        <p className="text-muted-foreground mb-6">
          {t("rentals.current.emptyDesc")}
        </p>
        <Button asChild>
          <Link to="/products">
            {t("common.browseCollection")}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-medium">
          {t("rentals.current.title")}
        </h2>
        <Badge variant="secondary">
          {t("rentals.current.activeCount", { count: activeCount })}
        </Badge>
      </div>

      {/* Extend Dialog */}
      {extendRentalId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg p-6 w-full max-w-sm space-y-4 shadow-xl">
            <h3 className="font-medium text-lg">{t("rentals.extend.title")}</h3>
            <div className="grid gap-2">
              <label className="text-sm text-muted-foreground">
                {t("rentals.extend.newEndDate")}
              </label>
              <input
                type="date"
                className="border rounded-md px-3 py-2 text-sm"
                value={extendDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setExtendDate(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setExtendRentalId(null); setExtendDate(""); }}>
                {t("rentals.extend.cancel")}
              </Button>
              <Button disabled={!extendDate} onClick={onExtend}>
                {t("rentals.extend.confirm")}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {currentRentals.map((r) => {
          const rentalId = String(r.id);
          const st = normalizeStatus(r.status);
          const isCancelled = st === RentalStatus.CANCELLED;
          const items = r.items ?? [];

          return (
            <Card key={rentalId} className="overflow-hidden">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {String(r.startDate).slice(0, 10)} — {String(r.endDate).slice(0, 10)}
                  </div>

                  <Badge variant={st === RentalStatus.ACTIVE ? "default" : "secondary"}>
                    {formatRentalStatus(st as RentalStatus)}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {items.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      {t("rentals.current.noItems")}
                    </div>
                  ) : (
                    items.map((it) => {
                      const p: any = it.product || {};
                      const img =
                        p.imageUrl ||
                        p.image_url ||
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
                                <div className="font-medium">{p?.name || t("common.product")}</div>

                                {p?.category?.name ? (
                                  <div className="text-sm text-muted-foreground">
                                    {p.category.name}
                                  </div>
                                ) : null}

                                <div className="text-sm text-muted-foreground mt-1">
                                  {t("rentals.itemLine", {
                                    qty: it.quantity,
                                    days: it.days,
                                    pricePerDay: Number(it.rentPricePerDay || 0),
                                  })}
                                </div>
                              </div>

                              <div className="text-sm">
                                {t("rentals.subtotal")}:{" "}
                                <span className="font-medium">
                                  ${Number(it.subtotal || 0)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="text-sm">
                    {t("rentals.total")}:{" "}
                    <span className="font-medium">${Number(r.totalPrice || 0)}</span>
                    <div className="text-xs text-muted-foreground">
                      {t("rentals.deposit")}: ${Number(r.totalDeposit || 0)}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={normalizeStatus(r.status) !== RentalStatus.ACTIVE}
                      onClick={() => {
                        setExtendRentalId(rentalId);
                        setExtendDate(String(r.endDate).slice(0, 10));
                      }}
                    >
                      {t("rentals.actions.extend")}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      disabled={isCancelled}
                      onClick={() => onCancel(rentalId)}
                    >
                      {t("rentals.actions.cancel")}
                    </Button>
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
