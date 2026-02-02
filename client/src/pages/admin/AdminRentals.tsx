import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { rentalsApi } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  RentalStatus,
  RENTAL_STATUS_OPTIONS,
  formatRentalStatus,
} from "@/types/rental-status";

type RentalItem = {
  id: number;
  quantity: number;
  days: number;
  subtotal: number;
  rentPricePerDay: number;
  product?: { id: number; name?: string; imageUrl?: string; image_url?: string };
};

type UserLite = {
  id: number;
  email?: string;
  fullName?: string;
  name?: string;
};

type PaymentLite = {
  id: number;
  amount?: number;
  status?: string;
  method?: string;
  createdAt?: string;
};

type Rental = {
  id: number;
  rentalCode?: string;

  startDate: string;
  endDate: string;
  totalDays: number;

  totalPrice: number;
  totalDeposit: number;

  status: RentalStatus;
  note?: string | null;

  shipFullName?: string;
  shipPhone?: string;
  shipAddress?: string;
  shipNote?: string | null;

  createdAt?: string;
  updatedAt?: string;

  user?: UserLite;
  items?: RentalItem[];
  payments?: PaymentLite[];
};

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
    case RentalStatus.APPROVED:
    case RentalStatus.ACTIVE:
    default:
      return "outline";
  }
}

export default function AdminRentals() {
  const qc = useQueryClient();

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const [selected, setSelected] = useState<Rental | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-rentals", page, pageSize],
    queryFn: () => rentalsApi.getAll(page, pageSize),
    staleTime: 30_000,
  });

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
      // giữ selected không bị mất
      setSelected((prev) => (prev ? { ...prev } : prev));
    },
  });

  const handlePick = (r: Rental) => setSelected(r);

  const handleStatusChange = async (rentalId: number, status: RentalStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id: String(rentalId), status });

      // update UI selected ngay lập tức (optimistic nhỏ)
      setSelected((prev) => (prev ? { ...prev, status } : prev));
    } catch (e: any) {
      alert(e?.message || "Update status failed");
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
        <div className="text-destructive font-medium mb-2">
          Failed to load rentals
        </div>
        <div className="text-muted-foreground text-sm">
          {(error as Error)?.message}
        </div>
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
                key={r.id}
                className={`w-full text-left border rounded-lg p-4 hover:bg-secondary/40 transition ${
                  selected?.id === r.id ? "border-primary" : ""
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
                        {r.user?.email ||
                          r.user?.fullName ||
                          r.user?.name ||
                          `User#${r.user?.id ?? "?"}`}
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
                    <div className="text-xs text-muted-foreground">
                      Deposit: ${r.totalDeposit}
                    </div>
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
          <div className="text-sm text-muted-foreground">
            Select a rental to view details.
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Rental</div>
              <div className="font-medium">
                #{selected.id}{" "}
                {selected.rentalCode ? `• ${selected.rentalCode}` : ""}
              </div>
              <div className="text-sm text-muted-foreground">
                {selected.startDate} → {selected.endDate} • {selected.totalDays}{" "}
                days
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Total: </span>
                <span className="font-medium">${selected.totalPrice}</span>
                <span className="text-muted-foreground"> • Deposit: </span>
                <span className="font-medium">${selected.totalDeposit}</span>
              </div>
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="text-sm text-muted-foreground">Status</div>

              <div className="flex flex-wrap gap-2">
                {RENTAL_STATUS_OPTIONS.map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={selected.status === s ? "default" : "outline"}
                    disabled={updateStatusMutation.isPending}
                    onClick={() => handleStatusChange(selected.id, s)}
                  >
                    {formatRentalStatus(s)}
                  </Button>
                ))}
              </div>

              {updateStatusMutation.isPending && (
                <div className="text-xs text-muted-foreground">
                  Updating status...
                </div>
              )}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="text-sm text-muted-foreground">Shipping</div>
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
              {selected.shipNote ? (
                <div className="text-sm">
                  <span className="text-muted-foreground">Note: </span>
                  <span className="font-medium">{selected.shipNote}</span>
                </div>
              ) : null}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="text-sm text-muted-foreground">Items</div>
              {selected.items?.length ? (
                <div className="space-y-2">
                  {selected.items.map((it) => (
                    <div key={it.id} className="border rounded-md p-3">
                      <div className="font-medium">
                        {it.product?.name || `Product#${it.product?.id ?? "?"}`}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ${it.rentPricePerDay}/day • {it.days} days • Qty{" "}
                        {it.quantity}
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
