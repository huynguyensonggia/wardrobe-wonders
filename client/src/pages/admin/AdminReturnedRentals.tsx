import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { rentalsApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { RentalStatus, getRentalStatusKey } from "@/types/rental-status";
import { getLocalizedProductName } from "@/utils/i18n";
import type { Rental } from "@/types";

const vnd = (amount: number) => `${Number(amount).toLocaleString("vi-VN")}đ`;

export default function AdminReturnedRentals() {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [selected, setSelected] = useState<Rental | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-rentals-returned", page, pageSize],
    queryFn: () => rentalsApi.getAll(page, pageSize, RentalStatus.RETURNED),
    staleTime: 30_000,
  });

  const rentals: Rental[] = (data as any)?.data ?? [];
  const total: number = (data as any)?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (isLoading) return (
    <div className="container mx-auto px-4 py-10 text-muted-foreground">
      {t("adminRentals.loading")}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-10 grid lg:grid-cols-3 gap-6">
      {/* LEFT: List */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-medium">{t("adminReturnedRentals.title")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("adminRentals.total")}: <span className="font-medium">{total}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              {t("pagination.prev")}
            </Button>
            <span className="text-sm text-muted-foreground">
              {t("pagination.page")} <span className="font-medium">{page}</span> / {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              {t("pagination.next")}
            </Button>
          </div>
        </div>

        {rentals.length === 0 ? (
          <div className="border rounded-lg p-6 text-center text-muted-foreground">
            {t("adminReturnedRentals.empty")}
          </div>
        ) : (
          <div className="space-y-3">
            {rentals.map((r) => (
              <button
                key={String(r.id)}
                className={`w-full text-left border rounded-lg p-4 hover:bg-secondary/40 transition ${String(selected?.id) === String(r.id) ? "border-primary" : ""}`}
                onClick={() => setSelected(r)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">#{r.id} {r.rentalCode ? `• ${r.rentalCode}` : ""}</div>
                    <div className="text-sm text-muted-foreground">
                      {String(r.startDate).slice(0, 10)} → {String(r.endDate).slice(0, 10)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-0.5">
                      {t("adminRentals.user")}: <span className="font-medium">{(r.user as any)?.email || `User#${(r.user as any)?.id}`}</span>
                    </div>
                    {r.note && (
                      <div className="mt-1.5 text-sm bg-destructive/10 text-destructive rounded-md px-2 py-1">
                        <span className="font-medium">{t("adminReturnedRentals.reason")}: </span>{r.note}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <Badge variant="destructive">{t(getRentalStatusKey(r.status))}</Badge>
                    <div className="text-sm font-medium">{vnd(r.totalPrice)}</div>
                    <div className="text-xs text-muted-foreground">{t("adminRentals.deposit")}: {vnd(r.totalDeposit)}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT: Detail */}
      <div className="border rounded-lg p-5 h-fit space-y-4">
        <h2 className="text-lg font-medium">{t("adminRentals.detailTitle")}</h2>
        {!selected ? (
          <div className="text-sm text-muted-foreground">{t("adminRentals.selectHint")}</div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">{t("adminRentals.detail.rental")}</div>
              <div className="font-medium">#{selected.id} {selected.rentalCode ? `• ${selected.rentalCode}` : ""}</div>
              <div className="text-sm text-muted-foreground">
                {String(selected.startDate).slice(0, 10)} → {String(selected.endDate).slice(0, 10)} • {selected.totalDays} {t("adminRentals.days")}
              </div>
              <div className="flex gap-4 text-sm mt-1">
                <span><span className="text-muted-foreground">{t("adminRentals.payment.rent")}: </span><span className="font-medium">{vnd(selected.totalPrice)}</span></span>
                <span><span className="text-muted-foreground">{t("adminRentals.payment.deposit")}: </span><span className="font-medium">{vnd(selected.totalDeposit)}</span></span>
              </div>
            </div>

            {/* Lý do trả hàng */}
            {selected.note && (
              <div className="border border-destructive/30 bg-destructive/5 rounded-lg p-3 space-y-1">
                <div className="text-xs font-medium text-destructive uppercase tracking-wide">
                  {t("adminReturnedRentals.reason")}
                </div>
                <div className="text-sm">{selected.note}</div>
              </div>
            )}

            {/* Giao hàng */}
            <div className="border-t pt-3 space-y-1 text-sm">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">{t("adminRentals.detail.shipping")}</div>
              <div><span className="text-muted-foreground">{t("adminRentals.shipping.name")}: </span>{selected.shipFullName || "-"}</div>
              <div><span className="text-muted-foreground">{t("adminRentals.shipping.phone")}: </span>{selected.shipPhone || "-"}</div>
              <div><span className="text-muted-foreground">{t("adminRentals.shipping.address")}: </span>{selected.shipAddress || "-"}</div>
            </div>

            {/* Sản phẩm */}
            <div className="border-t pt-3 space-y-2">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">{t("adminRentals.detail.items")}</div>
              {selected.items?.map((it) => (
                <div key={String(it.id)} className="border rounded-md p-3 text-sm space-y-0.5">
                  <div className="font-medium">
                    {(it as any).product
                      ? getLocalizedProductName((it as any).product, i18n.language, (it as any).product.name)
                      : `Product#${(it as any).product?.id ?? "?"}`}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("adminRentals.item.size")}: {(it as any).variant?.size ?? "-"}
                    {" • "}{vnd(it.rentPricePerDay)}/{t("adminRentals.perDay")}
                    {" • "}{it.days} {t("adminRentals.days")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
