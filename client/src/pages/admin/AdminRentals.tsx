// pages/admin/AdminRentals.tsx
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { rentalsApi } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import type { Rental } from "@/types";
import { RentalStatus, formatRentalStatus } from "@/types/rental-status";

import { useTranslation } from "react-i18next";

// Format VND
const vnd = (amount: number) => `${Number(amount).toLocaleString("vi-VN")}đ`;

function statusBadgeVariant(
  status: RentalStatus
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case RentalStatus.CANCELLED:
    case RentalStatus.REJECTED:
      return "destructive";
    case RentalStatus.COMPLETED:
      return "default";
    case RentalStatus.PENDING:
      return "secondary";
    case RentalStatus.SHIPPING:
    case RentalStatus.ACTIVE:
    default:
      return "outline";
  }
}

function getAdminActions(t: (k: string) => string): Record<
  RentalStatus,
  { label: string; to: RentalStatus; variant?: "default" | "outline" | "destructive" }[]
> {
  return {
    [RentalStatus.PENDING]: [
      { label: t("adminRentals.actions.startShipping"), to: RentalStatus.SHIPPING, variant: "default" },
      { label: t("adminRentals.actions.reject"), to: RentalStatus.REJECTED, variant: "destructive" },
    ],
    [RentalStatus.SHIPPING]: [
      { label: t("adminRentals.actions.customerReceived"), to: RentalStatus.ACTIVE, variant: "default" },
    ],
    [RentalStatus.ACTIVE]: [
      { label: t("adminRentals.actions.complete"), to: RentalStatus.COMPLETED, variant: "default" },
    ],
    [RentalStatus.COMPLETED]: [],
    [RentalStatus.REJECTED]: [],
    [RentalStatus.CANCELLED]: [],
  };
}

async function handleRefundDeposit(rentalId: string, t: (k: string) => string) {
  try {
    await rentalsApi.refundDeposit(rentalId);
    alert(t("rentals.refundDeposit.success"));
    return true;
  } catch (e: any) {
    alert(e?.message || t("rentals.refundDeposit.error"));
    return false;
  }
}

const SURCHARGE_TYPES = ["late_return", "damage", "cleaning", "express_delivery", "other"] as const;

function AddSurchargeForm({ rentalId, onDone, t }: { rentalId: string; onDone: () => void; t: (k: string) => string }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string>("late_return");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) return;
    setLoading(true);
    try {
      await rentalsApi.addSurcharge(rentalId, { type, amount: Number(amount), note: note || undefined });
      setOpen(false); setAmount(""); setNote("");
      onDone();
      alert(t("adminRentals.surcharge.success"));
    } catch (e: any) {
      alert(e?.message || t("adminRentals.surcharge.error"));
    } finally {
      setLoading(false);
    }
  };

  if (!open) return (
    <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
      + {t("adminRentals.surcharge.add")}
    </Button>
  );

  return (
    <div className="space-y-2 border rounded-md p-3">
      <select className="w-full border rounded-md px-3 py-2 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
        {SURCHARGE_TYPES.map((s) => (
          <option key={s} value={s}>{t(`adminRentals.surcharge.types.${s}`)}</option>
        ))}
      </select>
      <input className="w-full border rounded-md px-3 py-2 text-sm" type="number" placeholder={t("adminRentals.surcharge.amount")} value={amount} onChange={(e) => setAmount(e.target.value)} />
      <input className="w-full border rounded-md px-3 py-2 text-sm" placeholder={t("adminRentals.surcharge.note")} value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
        <Button size="sm" disabled={loading || !amount} onClick={handleSubmit}>{t("common.save")}</Button>
      </div>
    </div>
  );
}

export default function AdminRentals() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [selected, setSelected] = useState<Rental | null>(null);
  const [editingShip, setEditingShip] = useState(false);
  const [shipFullName, setShipFullName] = useState("");
  const [shipPhone, setShipPhone] = useState("");
  const [shipAddress, setShipAddress] = useState("");
  const [shipNote, setShipNote] = useState("");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-rentals", page, pageSize],
    queryFn: () => rentalsApi.getAll(page, pageSize),
    staleTime: 30_000,
  });

  const rentals: Rental[] = (data as any)?.data ?? [];
  const total: number = (data as any)?.total ?? 0;
  const totalPages = useMemo(() => Math.max(1, Math.ceil((total || 1) / pageSize)), [total, pageSize]);

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: RentalStatus }) => rentalsApi.updateStatus(id, status),
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ["admin-rentals"] }); },
  });

  const updateShippingMutation = useMutation({
    mutationFn: (args: { id: string; shipFullName?: string; shipPhone?: string; shipAddress?: string; shipNote?: string }) =>
      rentalsApi.updateShipping(args.id, { shipFullName: args.shipFullName, shipPhone: args.shipPhone, shipAddress: args.shipAddress, shipNote: args.shipNote }),
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ["admin-rentals"] }); },
  });

  useMemo(() => {
    if (!selected) return;
    const fresh = rentals.find((r) => String(r.id) === String(selected.id));
    if (fresh) setSelected(fresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rentals]);

  const canEditShipping = selected?.status === RentalStatus.PENDING || selected?.status === RentalStatus.SHIPPING;

  const handlePick = (r: Rental) => {
    setSelected(r); setEditingShip(false);
    setShipFullName(r.shipFullName ?? ""); setShipPhone(r.shipPhone ?? "");
    setShipAddress(r.shipAddress ?? ""); setShipNote(r.shipNote ?? "");
  };

  const handleStatusChange = async (rentalId: string, status: RentalStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id: rentalId, status });
      setSelected((prev) => (prev ? { ...prev, status } : prev));
    } catch (e: any) {
      alert(e?.message || t("adminRentals.errors.updateStatusFailed"));
    }
  };

  const handleSaveShipping = async () => {
    if (!selected) return;
    try {
      await updateShippingMutation.mutateAsync({
        id: String(selected.id),
        shipFullName: shipFullName.trim(), shipPhone: shipPhone.trim(),
        shipAddress: shipAddress.trim(), shipNote: shipNote.trim(),
      });
      setSelected((prev) => prev ? { ...prev, shipFullName: shipFullName.trim(), shipPhone: shipPhone.trim(), shipAddress: shipAddress.trim(), shipNote: shipNote.trim() } : prev);
      setEditingShip(false);
    } catch (e: any) {
      alert(e?.message || t("adminRentals.errors.updateShippingFailed"));
    }
  };

  const ADMIN_ACTIONS = useMemo(() => getAdminActions(t), [t]);

  if (isLoading) return <div className="container mx-auto px-4 py-10 text-muted-foreground">{t("adminRentals.loading")}</div>;
  if (isError) return <div className="container mx-auto px-4 py-10 text-destructive">{(error as Error)?.message}</div>;

  return (
    <div className="container mx-auto px-4 py-10 grid lg:grid-cols-3 gap-6">
      {/* LEFT: List */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-medium">{t("adminRentals.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("adminRentals.total")}: <span className="font-medium">{total}</span></p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>{t("pagination.prev")}</Button>
            <div className="text-sm text-muted-foreground">{t("pagination.page")} <span className="font-medium">{page}</span> / {totalPages}</div>
            <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>{t("pagination.next")}</Button>
          </div>
        </div>

        {rentals.length === 0 ? (
          <div className="border rounded-lg p-6 text-center text-muted-foreground">{t("adminRentals.empty")}</div>
        ) : (
          <div className="space-y-3">
            {rentals.map((r) => (
              <button
                key={String(r.id)}
                className={`w-full text-left border rounded-lg p-4 hover:bg-secondary/40 transition ${String(selected?.id) === String(r.id) ? "border-primary" : ""}`}
                onClick={() => handlePick(r)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">#{r.id} {r.rentalCode ? `• ${r.rentalCode}` : ""}</div>
                    <div className="text-sm text-muted-foreground">{String(r.startDate).slice(0,10)} → {String(r.endDate).slice(0,10)} • {r.totalDays} {t("adminRentals.days")}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {t("adminRentals.user")}: <span className="font-medium">{(r.user as any)?.email || (r.user as any)?.name || `User#${(r.user as any)?.id ?? "?"}`}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant={statusBadgeVariant(r.status)}>{formatRentalStatus(r.status)}</Badge>
                    <div className="text-sm mt-1 font-medium">{vnd(r.totalPrice)}</div>
                    <div className="text-xs text-muted-foreground">{t("adminRentals.deposit")}: {vnd(r.totalDeposit)}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT: Detail */}
      <div className="border rounded-lg p-5 h-fit space-y-4 overflow-y-auto max-h-[90vh]">
        <h2 className="text-lg font-medium">{t("adminRentals.detailTitle")}</h2>

        {!selected ? (
          <div className="text-sm text-muted-foreground">{t("adminRentals.selectHint")}</div>
        ) : (
          <>
            {/* ĐƠN THUÊ */}
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">{t("adminRentals.detail.rental")}</div>
              <div className="font-medium">#{selected.id} {selected.rentalCode ? `• ${selected.rentalCode}` : ""}</div>
              <div className="text-sm text-muted-foreground">
                {String(selected.startDate).slice(0,10)} → {String(selected.endDate).slice(0,10)} • {selected.totalDays} {t("adminRentals.days")}
              </div>
              <div className="flex gap-4 text-sm mt-1">
                <span><span className="text-muted-foreground">Thuê: </span><span className="font-medium">{vnd(selected.totalPrice)}</span></span>
                <span><span className="text-muted-foreground">Cọc: </span><span className="font-medium">{vnd(selected.totalDeposit)}</span></span>
              </div>
            </div>

            {/* TRẠNG THÁI */}
            <div className="border-t pt-4 space-y-2">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">{t("adminRentals.detail.status")}</div>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <Badge variant={statusBadgeVariant(selected.status)}>{formatRentalStatus(selected.status)}</Badge>
                <div className="flex flex-wrap gap-2">
                  {(ADMIN_ACTIONS[selected.status] ?? []).map((a) => (
                    <Button key={a.to} size="sm" variant={a.variant ?? "outline"} disabled={updateStatusMutation.isPending} onClick={() => handleStatusChange(String(selected.id), a.to)}>
                      {a.label}
                    </Button>
                  ))}
                  {(ADMIN_ACTIONS[selected.status] ?? []).length === 0 && (
                    <span className="text-xs text-muted-foreground">{t("adminRentals.noActions")}</span>
                  )}
                  {/* Hoàn cọc */}
                  {(() => {
                    if (selected.status !== RentalStatus.COMPLETED || Number(selected.totalDeposit) <= 0) return null;
                    const payments = (selected as any).payments ?? [];
                    const isRefunded = payments.some((p: any) => p.transactionCode?.startsWith("DEP-") && p.status === "REFUNDED");
                    if (isRefunded) return <span className="text-xs text-green-600 font-medium px-2 py-1 bg-green-50 rounded-md">✓ {t("adminRentals.actions.depositRefunded")}</span>;
                    return (
                      <Button size="sm" variant="outline" onClick={async () => {
                        const ok = await handleRefundDeposit(String(selected.id), t);
                        if (ok) await qc.invalidateQueries({ queryKey: ["admin-rentals"] });
                      }}>
                        {t("adminRentals.actions.refundDeposit")} ({vnd(selected.totalDeposit)})
                      </Button>
                    );
                  })()}
                </div>
              </div>
              {updateStatusMutation.isPending && <div className="text-xs text-muted-foreground">{t("adminRentals.updatingStatus")}</div>}
            </div>

            {/* CHI TIẾT THANH TOÁN */}
            {(selected as any).payments?.length > 0 && (
              <div className="border-t pt-4 space-y-2">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">{t("adminRentals.detail.payments")}</div>
                <div className="space-y-1.5">
                  {(selected as any).payments.map((p: any) => {
                    const isRent = p.transactionCode?.startsWith("RENT-");
                    const isDeposit = p.transactionCode?.startsWith("DEP-");
                    const isExtend = p.transactionCode?.startsWith("EXT-");
                    const label = isRent ? t("adminRentals.payment.rent") : isDeposit ? t("adminRentals.payment.deposit") : isExtend ? t("adminRentals.payment.extension") : p.transactionCode;
                    const isRefunded = p.status === "REFUNDED";
                    return (
                      <div key={p.id} className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">{label}</span>
                        <span className={`font-medium ${isRefunded ? "line-through text-muted-foreground" : ""}`}>
                          {vnd(p.amount)}{isRefunded ? " (đã hoàn)" : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* GIAO HÀNG */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">{t("adminRentals.detail.shipping")}</div>
                {!editingShip ? (
                  <Button size="sm" variant="outline" disabled={!canEditShipping} onClick={() => setEditingShip(true)}>{t("common.edit")}</Button>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" disabled={updateShippingMutation.isPending} onClick={() => { setShipFullName(selected.shipFullName ?? ""); setShipPhone(selected.shipPhone ?? ""); setShipAddress(selected.shipAddress ?? ""); setShipNote(selected.shipNote ?? ""); setEditingShip(false); }}>{t("common.cancel")}</Button>
                    <Button size="sm" disabled={updateShippingMutation.isPending} onClick={handleSaveShipping}>{t("common.save")}</Button>
                  </div>
                )}
              </div>
              {!editingShip ? (
                <div className="space-y-1 text-sm">
                  <div><span className="text-muted-foreground">{t("adminRentals.shipping.name")}: </span><span className="font-medium">{selected.shipFullName || "-"}</span></div>
                  <div><span className="text-muted-foreground">{t("adminRentals.shipping.phone")}: </span><span className="font-medium">{selected.shipPhone || "-"}</span></div>
                  <div><span className="text-muted-foreground">{t("adminRentals.shipping.address")}: </span><span className="font-medium">{selected.shipAddress || "-"}</span></div>
                  {selected.shipNote && <div><span className="text-muted-foreground">{t("adminRentals.shipping.note")}: </span><span className="font-medium">{selected.shipNote}</span></div>}
                </div>
              ) : (
                <div className="space-y-2">
                  {[
                    { label: t("adminRentals.shipping.name"), val: shipFullName, set: setShipFullName, ph: t("adminRentals.placeholders.fullName") },
                    { label: t("adminRentals.shipping.phone"), val: shipPhone, set: setShipPhone, ph: t("adminRentals.placeholders.phone") },
                    { label: t("adminRentals.shipping.address"), val: shipAddress, set: setShipAddress, ph: t("adminRentals.placeholders.address") },
                    { label: t("adminRentals.shipping.note"), val: shipNote, set: setShipNote, ph: t("adminRentals.placeholders.noteOptional") },
                  ].map(({ label, val, set, ph }) => (
                    <div key={label} className="grid gap-1">
                      <div className="text-xs text-muted-foreground">{label}</div>
                      <input className="w-full border rounded-md px-3 py-2 text-sm" value={val} onChange={(e) => set(e.target.value)} placeholder={ph} />
                    </div>
                  ))}
                  {updateShippingMutation.isPending && <div className="text-xs text-muted-foreground">{t("adminRentals.savingShipping")}</div>}
                </div>
              )}
            </div>

            {/* SẢN PHẨM */}
            <div className="border-t pt-4 space-y-2">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">{t("adminRentals.detail.items")}</div>
              {selected.items?.length ? (
                <div className="space-y-2">
                  {selected.items.map((it) => (
                    <div key={String(it.id)} className="border rounded-md p-3 space-y-1">
                      <div className="font-medium">{(it as any).product?.name || `Product#${(it as any).product?.id}`}</div>
                      <div className="text-xs text-muted-foreground">
                        Size: <span className="font-medium">{(it as any).variant?.size ?? (it as any).variantId}</span>
                        {" • "}{vnd(it.rentPricePerDay)}/{t("adminRentals.perDay")}
                        {" • "}{it.days} {t("adminRentals.days")}
                        {" • "}SL: {it.quantity}
                      </div>
                      <div className="text-sm flex justify-between">
                        <span className="text-muted-foreground">{t("adminRentals.item.subtotal")}</span>
                        <span className="font-medium">{vnd(it.subtotal)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">{t("adminRentals.noItems")}</div>
              )}
            </div>

            {/* GHI CHÚ */}
            {selected.note && (
              <div className="border-t pt-4 space-y-1">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">{t("adminRentals.detail.note")}</div>
                <div className="text-sm">{selected.note}</div>
              </div>
            )}

            {/* PHÍ PHÁT SINH */}
            <div className="border-t pt-4 space-y-2">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">{t("adminRentals.detail.surcharges")}</div>
              {(selected as any).surcharges?.length > 0 && (
                <div className="space-y-1">
                  {(selected as any).surcharges.map((s: any) => (
                    <div key={s.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t(`adminRentals.surcharge.types.${s.type}`)}</span>
                      <span className="font-medium">{vnd(s.amount)}{s.note ? ` (${s.note})` : ""}</span>
                    </div>
                  ))}
                </div>
              )}
              {(selected.status === RentalStatus.ACTIVE || selected.status === RentalStatus.COMPLETED) && (
                <AddSurchargeForm rentalId={String(selected.id)} onDone={() => qc.invalidateQueries({ queryKey: ["admin-rentals"] })} t={t} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
