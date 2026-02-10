// pages/admin/AdminRentals.tsx
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { rentalsApi } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import type { Rental } from "@/types";
import { RentalStatus, formatRentalStatus } from "@/types/rental-status";

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

// ✅ Admin actions only (no extra)
const ADMIN_ACTIONS: Record<
  RentalStatus,
  { label: string; to: RentalStatus; variant?: "default" | "outline" | "destructive" }[]
> = {
  [RentalStatus.PENDING]: [
    { label: "Start shipping", to: RentalStatus.SHIPPING, variant: "default" },
    { label: "Reject", to: RentalStatus.REJECTED, variant: "destructive" },
  ],
  [RentalStatus.SHIPPING]: [
    { label: "Customer received", to: RentalStatus.ACTIVE, variant: "default" }, // ✅ ACTIVE deducts stock
  ],
  [RentalStatus.ACTIVE]: [{ label: "Complete", to: RentalStatus.COMPLETED, variant: "default" }],
  [RentalStatus.COMPLETED]: [],
  [RentalStatus.REJECTED]: [],
  [RentalStatus.CANCELLED]: [],
};

export default function AdminRentals() {
  const qc = useQueryClient();

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const [selected, setSelected] = useState<Rental | null>(null);

  // ✅ Shipping edit state
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

  // rentalsApi.getAll() as BE: { data, total, page, pageSize }
  const rentals: Rental[] = (data as any)?.data ?? [];
  const total: number = (data as any)?.total ?? 0;

  const totalPages = useMemo(() => {
    if (!total || !pageSize) return 1;
    return Math.max(1, Math.ceil(total / pageSize));
  }, [total, pageSize]);

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: RentalStatus }) =>
      rentalsApi.updateStatus(id, status),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin-rentals"] });
      // keep selected, data will refresh from query
    },
  });

  const updateShippingMutation = useMutation({
    mutationFn: (args: {
      id: string;
      shipFullName?: string;
      shipPhone?: string;
      shipAddress?: string;
      shipNote?: string;
    }) =>
      rentalsApi.updateShipping(args.id, {
        shipFullName: args.shipFullName,
        shipPhone: args.shipPhone,
        shipAddress: args.shipAddress,
        shipNote: args.shipNote,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin-rentals"] });
    },
  });

  // ✅ sync selected with latest list after refetch (when selected exists)
  useMemo(() => {
    if (!selected) return;
    const fresh = rentals.find((r) => String(r.id) === String(selected.id));
    if (fresh) setSelected(fresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rentals]);

  const canEditShipping =
    selected?.status === RentalStatus.PENDING || selected?.status === RentalStatus.SHIPPING;

  const handlePick = (r: Rental) => {
    setSelected(r);
    setEditingShip(false);

    setShipFullName(r.shipFullName ?? "");
    setShipPhone(r.shipPhone ?? "");
    setShipAddress(r.shipAddress ?? "");
    setShipNote(r.shipNote ?? "");
  };

  const handleStatusChange = async (rentalId: string, status: RentalStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id: rentalId, status });
      setSelected((prev) => (prev ? { ...prev, status } : prev));
    } catch (e: any) {
      alert(e?.message || "Update status failed");
    }
  };

  const handleSaveShipping = async () => {
    if (!selected) return;

    try {
      await updateShippingMutation.mutateAsync({
        id: String(selected.id),
        shipFullName: shipFullName.trim(),
        shipPhone: shipPhone.trim(),
        shipAddress: shipAddress.trim(),
        shipNote: shipNote.trim(),
      });

      // update selected immediately
      setSelected((prev) =>
        prev
          ? {
              ...prev,
              shipFullName: shipFullName.trim(),
              shipPhone: shipPhone.trim(),
              shipAddress: shipAddress.trim(),
              shipNote: shipNote.trim(),
            }
          : prev
      );

      setEditingShip(false);
    } catch (e: any) {
      alert(e?.message || "Update shipping failed");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="text-muted-foreground">Loading rentals...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="text-destructive font-medium mb-2">Failed to load rentals</div>
        <div className="text-muted-foreground text-sm">{(error as Error)?.message}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 grid lg:grid-cols-3 gap-6">
      {/* LEFT: List */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-medium">Rentals</h1>
            <p className="text-sm text-muted-foreground">
              Total: <span className="font-medium">{total}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </Button>
            <div className="text-sm text-muted-foreground">
              Page <span className="font-medium">{page}</span> / {totalPages}
            </div>
            <Button
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>

        {rentals.length === 0 ? (
          <div className="border rounded-lg p-6 text-center text-muted-foreground">
            No rentals yet.
          </div>
        ) : (
          <div className="space-y-3">
            {rentals.map((r) => (
              <button
                key={String(r.id)}
                className={`w-full text-left border rounded-lg p-4 hover:bg-secondary/40 transition ${
                  String(selected?.id) === String(r.id) ? "border-primary" : ""
                }`}
                onClick={() => handlePick(r)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">
                      #{r.id} {r.rentalCode ? `• ${r.rentalCode}` : ""}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {r.startDate} → {r.endDate} • {r.totalDays} days
                    </div>

                    <div className="text-sm text-muted-foreground mt-1">
                      User:{" "}
                      <span className="font-medium">
                        {(r.user as any)?.email ||
                          (r.user as any)?.fullName ||
                          (r.user as any)?.name ||
                          `User#${(r.user as any)?.id ?? "?"}`}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <Badge variant={statusBadgeVariant(r.status)}>
                      {formatRentalStatus(r.status)}
                    </Badge>
                    <div className="text-sm mt-2">
                      <span className="text-muted-foreground">Total: </span>
                      <span className="font-medium">${r.totalPrice}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Deposit: ${r.totalDeposit}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT: Detail */}
      <div className="border rounded-lg p-5 h-fit space-y-4">
        <h2 className="text-lg font-medium">Rental Detail</h2>

        {!selected ? (
          <div className="text-sm text-muted-foreground">Select a rental to view details.</div>
        ) : (
          <>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Rental</div>
              <div className="font-medium">
                #{selected.id} {selected.rentalCode ? `• ${selected.rentalCode}` : ""}
              </div>
              <div className="text-sm text-muted-foreground">
                {selected.startDate} → {selected.endDate} • {selected.totalDays} days
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Total: </span>
                <span className="font-medium">${selected.totalPrice}</span>
                <span className="text-muted-foreground"> • Deposit: </span>
                <span className="font-medium">${selected.totalDeposit}</span>
              </div>
            </div>

            {/* ✅ STATUS */}
            <div className="border-t pt-4 space-y-2">
              <div className="text-sm text-muted-foreground">Status</div>

              <div className="flex items-center justify-between gap-3">
                <Badge variant={statusBadgeVariant(selected.status)}>
                  {formatRentalStatus(selected.status)}
                </Badge>

                <div className="flex flex-wrap gap-2 justify-end">
                  {(ADMIN_ACTIONS[selected.status] ?? []).map((a) => (
                    <Button
                      key={a.to}
                      size="sm"
                      variant={a.variant ?? "outline"}
                      disabled={updateStatusMutation.isPending}
                      onClick={() => handleStatusChange(String(selected.id), a.to)}
                    >
                      {a.label}
                    </Button>
                  ))}

                  {(ADMIN_ACTIONS[selected.status] ?? []).length === 0 && (
                    <span className="text-xs text-muted-foreground">No actions</span>
                  )}
                </div>
              </div>

              {updateStatusMutation.isPending && (
                <div className="text-xs text-muted-foreground">Updating status...</div>
              )}
            </div>

            {/* ✅ SHIPPING */}
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Shipping</div>

                {!editingShip ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!canEditShipping}
                    onClick={() => setEditingShip(true)}
                    title={!canEditShipping ? "Editable only in PENDING/SHIPPING" : "Edit shipping"}
                  >
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={updateShippingMutation.isPending}
                      onClick={() => {
                        setShipFullName(selected.shipFullName ?? "");
                        setShipPhone(selected.shipPhone ?? "");
                        setShipAddress(selected.shipAddress ?? "");
                        setShipNote(selected.shipNote ?? "");
                        setEditingShip(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      disabled={updateShippingMutation.isPending}
                      onClick={handleSaveShipping}
                    >
                      Save
                    </Button>
                  </div>
                )}
              </div>

              {!editingShip ? (
                <>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Name: </span>
                    <span className="font-medium">{selected.shipFullName || "-"}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Phone: </span>
                    <span className="font-medium">{selected.shipPhone || "-"}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Address: </span>
                    <span className="font-medium">{selected.shipAddress || "-"}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Note: </span>
                    <span className="font-medium">{selected.shipNote || "-"}</span>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="grid gap-1">
                    <div className="text-xs text-muted-foreground">Name</div>
                    <input
                      className="w-full border rounded-md px-3 py-2 text-sm"
                      value={shipFullName}
                      onChange={(e) => setShipFullName(e.target.value)}
                      placeholder="Full name"
                    />
                  </div>

                  <div className="grid gap-1">
                    <div className="text-xs text-muted-foreground">Phone</div>
                    <input
                      className="w-full border rounded-md px-3 py-2 text-sm"
                      value={shipPhone}
                      onChange={(e) => setShipPhone(e.target.value)}
                      placeholder="Phone"
                    />
                  </div>

                  <div className="grid gap-1">
                    <div className="text-xs text-muted-foreground">Address</div>
                    <input
                      className="w-full border rounded-md px-3 py-2 text-sm"
                      value={shipAddress}
                      onChange={(e) => setShipAddress(e.target.value)}
                      placeholder="Address"
                    />
                  </div>

                  <div className="grid gap-1">
                    <div className="text-xs text-muted-foreground">Note</div>
                    <input
                      className="w-full border rounded-md px-3 py-2 text-sm"
                      value={shipNote}
                      onChange={(e) => setShipNote(e.target.value)}
                      placeholder="Note (optional)"
                    />
                  </div>

                  {updateShippingMutation.isPending && (
                    <div className="text-xs text-muted-foreground">Saving shipping...</div>
                  )}
                </div>
              )}
            </div>

            {/* ✅ ITEMS */}
            <div className="border-t pt-4 space-y-2">
              <div className="text-sm text-muted-foreground">Items</div>

              {selected.items?.length ? (
                <div className="space-y-2">
                  {selected.items.map((it) => (
                    <div key={String(it.id)} className="border rounded-md p-3">
                      <div className="font-medium">
                        {(it as any).product?.name || `Product#${(it as any).product?.id ?? "?"}`}
                      </div>

                      <div className="text-sm text-muted-foreground">
                        Size:{" "}
                        <span className="font-medium">
                          {(it as any).variant?.size ?? `#${(it as any).variantId ?? "-"}`}
                        </span>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        ${it.rentPricePerDay}/day • {it.days} days • Qty {it.quantity}
                      </div>

                      <div className="text-sm">
                        <span className="text-muted-foreground">Subtotal: </span>
                        <span className="font-medium">${it.subtotal}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No items.</div>
              )}
            </div>

            {selected.note ? (
              <div className="border-t pt-4 space-y-2">
                <div className="text-sm text-muted-foreground">Note</div>
                <div className="text-sm">{selected.note}</div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
