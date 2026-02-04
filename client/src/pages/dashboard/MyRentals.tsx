import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Calendar, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { rentalsApi } from "@/lib/api";

import { RentalStatus, formatRentalStatus } from "@/types/rental-status";

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
    imageUrl?: string; // ✅ backend map từ image_url
    image_url?: string; // ✅ fallback nếu backend trả snake_case
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

  return raw; // fallback nếu status lạ
}

export default function MyRentals() {
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
      setError(e?.message || "Load rentals failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onCancel(rentalId: string) {
    try {
      await rentalsApi.cancel(rentalId);
      await load();
    } catch (e: any) {
      alert(e?.message || "Cancel failed");
    }
  }

  // ✅ Current Rentals:
  // - Ẩn COMPLETED (đã nằm ở Rental History)
  // - Ẩn REJECTED (user không cần thấy)
  // - VẪN GIỮ CANCELLED (user chủ động hủy vẫn cần xem)
  const currentRentals = useMemo(() => {
    return rentals.filter((r) => {
      const st = normalizeStatus(r.status);
      return st !== RentalStatus.COMPLETED && st !== RentalStatus.REJECTED;
    });
  }, [rentals]);

  // ✅ Active count: đếm những đơn chưa CANCELLED (nhưng vẫn hiển thị cancelled trong list)
  const activeCount = useMemo(() => {
    return currentRentals.filter((r) => normalizeStatus(r.status) !== RentalStatus.CANCELLED).length;
  }, [currentRentals]);

  if (loading) {
    return <div className="py-10 text-muted-foreground">Loading rentals...</div>;
  }

  if (error) {
    return (
      <div className="py-10">
        <p className="text-destructive mb-3">Error: {error}</p>
        <Button variant="outline" onClick={load}>
          Retry
        </Button>
      </div>
    );
  }

  if (!currentRentals.length) {
    return (
      <div className="text-center py-16">
        <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="font-display text-xl font-medium mb-2">No current rentals</h2>
        <p className="text-muted-foreground mb-6">
          Your completed rentals are saved in Rental History.
        </p>
        <Button asChild>
          <Link to="/products">
            Browse Collection
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-medium">Current Rentals</h2>
        <Badge variant="secondary">{activeCount} active</Badge>
      </div>

      <div className="space-y-4">
        {currentRentals.map((r) => {
          const rentalId = String(r.id);
          const st = normalizeStatus(r.status);
          const isCancelled = st === RentalStatus.CANCELLED;
          const items = r.items ?? [];

          return (
            <Card key={rentalId} className="overflow-hidden">
              <CardContent className="p-4 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {String(r.startDate).slice(0, 10)} — {String(r.endDate).slice(0, 10)}
                  </div>

                  <Badge variant={st === RentalStatus.ACTIVE ? "default" : "secondary"}>
                    {formatRentalStatus(st as RentalStatus)}
                  </Badge>
                </div>

                {/* Items list */}
                <div className="space-y-3">
                  {items.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No items in this rental.</div>
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
                              alt={p?.name || "Product"}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-medium">{p?.name || "Product"}</div>
                                {p?.category?.name ? (
                                  <div className="text-sm text-muted-foreground">
                                    {p.category.name}
                                  </div>
                                ) : null}

                                <div className="text-sm text-muted-foreground mt-1">
                                  Qty: <span className="font-medium">{it.quantity}</span> • Days:{" "}
                                  <span className="font-medium">{it.days}</span> • /day:{" "}
                                  <span className="font-medium">
                                    ${Number(it.rentPricePerDay || 0)}
                                  </span>
                                </div>
                              </div>

                              <div className="text-sm">
                                Subtotal:{" "}
                                <span className="font-medium">${Number(it.subtotal || 0)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer totals + actions */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="text-sm">
                    Total: <span className="font-medium">${Number(r.totalPrice || 0)}</span>
                    <div className="text-xs text-muted-foreground">
                      Deposit: ${Number(r.totalDeposit || 0)}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled>
                      Extend Rental
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      disabled={isCancelled}
                      onClick={() => onCancel(rentalId)}
                    >
                      Cancel
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
