import { useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { rentalsApi } from "@/lib/api";
import { useCart } from "@/contexts/CartContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  DA_NANG_DISTRICTS,
  DA_NANG_WARDS,
  type DaNangDistrict,
} from "@/constants/daNangAddress";

// ================= TYPES =================
type CheckoutItem = {
  productId: number;
  variantId: number;   // ✅ bắt buộc
  size?: string;

  name: string;
  imageUrl?: string;
  rentPricePerDay: number;
  startDate: string;
  endDate: string;
  days: number;
  quantity: number;
};

type CheckoutState =
  | { source: "cart" }
  | {
      source: "rentNow";
      product: {
        productId: number;
        variantId: number; // ✅ NEW
        size?: string;

        name: string;
        imageUrl?: string;
        rentPricePerDay: number;
        startDate: string;
        endDate: string;
        days: number;
        quantity?: number;
      };
    };

function normalizePhone(s: string) {
  return String(s || "")
    .trim()
    .replace(/[^\d+]/g, "");
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, clear } = useCart();

  const state =
    (location.state as CheckoutState) ?? ({ source: "cart" } as CheckoutState);

  // ================= BUILD CHECKOUT ITEMS =================
  const checkoutItems: CheckoutItem[] = useMemo(() => {
    if (state.source === "rentNow") {
      const p = state.product;
      return [
        {
          productId: p.productId,
          variantId: p.variantId, // ✅
          size: p.size,
          name: p.name,
          imageUrl: p.imageUrl,
          rentPricePerDay: p.rentPricePerDay,
          startDate: p.startDate,
          endDate: p.endDate,
          days: p.days,
          quantity: p.quantity ?? 1,
        },
      ];
    }

    // source === "cart"
    return items.map((it) => ({
      productId: it.productId,
      variantId: it.variantId, // ✅
      size: it.size,
      name: it.name,
      imageUrl: it.imageUrl,
      rentPricePerDay: it.rentPricePerDay,
      startDate: it.startDate,
      endDate: it.endDate,
      days: it.days,
      quantity: it.quantity,
    }));
  }, [state, items]);

  // ================= EMPTY =================
  if (!checkoutItems.length) {
    return (
      <div className="container mx-auto px-4 py-10 text-center">
        <h2 className="text-xl font-medium mb-2">No items to checkout</h2>
        <p className="text-muted-foreground mb-6">
          Please add products before checkout.
        </p>
        <Button asChild>
          <Link to="/products">Browse products</Link>
        </Button>
      </div>
    );
  }

  // ================= GROUP BY DATE =================
  const groups = useMemo(() => {
    const map = new Map<string, CheckoutItem[]>();

    for (const it of checkoutItems) {
      const key = `${it.startDate}_${it.endDate}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }

    return Array.from(map.entries()).map(([key, list]) => {
      const [startDate, endDate] = key.split("_");
      return { key, startDate, endDate, list };
    });
  }, [checkoutItems]);

  const total = useMemo(() => {
    return checkoutItems.reduce(
      (sum, it) => sum + it.quantity * it.rentPricePerDay * it.days,
      0
    );
  }, [checkoutItems]);

  // ================= SHIPPING FORM =================
  const [shipFullName, setShipFullName] = useState("");
  const [shipPhone, setShipPhone] = useState("");
  const [street, setStreet] = useState("");
  const [district, setDistrict] = useState<DaNangDistrict | "">("");
  const [ward, setWard] = useState("");
  const [shipNote, setShipNote] = useState("");

  const wardOptions = useMemo(() => {
    if (!district) return [];
    return DA_NANG_WARDS[district] ?? [];
  }, [district]);

  const shipAddress = useMemo(() => {
    const parts = [
      street.trim(),
      ward ? `Phường/Xã ${ward}` : "",
      district ? `Quận/Huyện ${district}` : "",
      "Đà Nẵng",
    ].filter(Boolean);
    return parts.join(", ");
  }, [street, ward, district]);

  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    shipFullName.trim().length > 0 &&
    normalizePhone(shipPhone).length > 0 &&
    street.trim().length > 0 &&
    Boolean(district) &&
    Boolean(ward);

  // ================= CONFIRM =================
  const handleConfirm = async () => {
    try {
      const fullName = shipFullName.trim();
      const phone = normalizePhone(shipPhone);
      const address = shipAddress.trim();
      const note = shipNote.trim();

      if (!fullName) return alert("Please input full name");
      if (!phone) return alert("Please input phone number");
      if (!street.trim()) return alert("Please input street/house number");
      if (!district) return alert("Please select district");
      if (!ward) return alert("Please select ward");
      if (!address) return alert("Please input address");

      setSubmitting(true);

      for (const g of groups) {
        await rentalsApi.create({
          startDate: g.startDate,
          endDate: g.endDate,
          items: g.list.map((x) => ({
            productId: x.productId,
            variantId: x.variantId, // ✅
            quantity: x.quantity,
          })),
          note: "Created from checkout",
          shipFullName: fullName,
          shipPhone: phone,
          shipAddress: address,
          shipNote: note || undefined,
        } as any);
      }

      if (state.source === "cart") clear();

      alert("Order created successfully!");
      navigate("/dashboard");
    } catch (e: any) {
      alert(e?.message || "Create rental failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ================= RENDER =================
  return (
    <div className="container mx-auto px-4 py-10 grid lg:grid-cols-2 gap-8">
      {/* LEFT: Items */}
      <div className="space-y-4">
        <h2 className="text-xl font-medium">Order Summary</h2>

        {groups.map((g) => {
          const groupTotal = g.list.reduce(
            (sum, it) => sum + it.quantity * it.rentPricePerDay * it.days,
            0
          );

          return (
            <div key={g.key} className="border rounded-lg p-4 space-y-3">
              <div className="text-sm text-muted-foreground">
                Rental period: <b>{g.startDate}</b> → <b>{g.endDate}</b>
              </div>

              {g.list.map((it) => {
                const lineTotal = it.quantity * it.rentPricePerDay * it.days;
                return (
                  <div
                    key={`${it.productId}_${it.variantId}_${it.startDate}_${it.endDate}`}
                    className="flex gap-3"
                  >
                    <div className="w-16 h-16 bg-muted rounded-md overflow-hidden shrink-0">
                      <img
                        src={
                          it.imageUrl ||
                          "https://placehold.co/200x200?text=No+Image"
                        }
                        alt={it.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1">
                      <div className="font-medium">
                        {it.name} {it.size ? `(${it.size})` : ""}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ${it.rentPricePerDay}/day • {it.days} days • Qty{" "}
                        {it.quantity}
                      </div>
                      <div className="text-sm font-medium">
                        Line: ${lineTotal}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="border-t pt-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Group total</span>
                <span className="font-medium">${groupTotal}</span>
              </div>
            </div>
          );
        })}

        <div className="border-t pt-4 flex items-center justify-between">
          <div className="text-sm">
            Total: <span className="font-medium">${total}</span>
          </div>

          {state.source === "cart" && (
            <Button variant="outline" asChild>
              <Link to="/cart">Back to cart</Link>
            </Button>
          )}
        </div>
      </div>

      {/* RIGHT: Shipping */}
      <div className="border rounded-lg p-5 space-y-4">
        <h2 className="text-xl font-medium">Shipping Information</h2>

        <div className="grid gap-2">
          <Label>Full name</Label>
          <Input
            value={shipFullName}
            onChange={(e) => setShipFullName(e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label>Phone</Label>
          <Input
            value={shipPhone}
            onChange={(e) => setShipPhone(e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label>Số nhà / Tên đường</Label>
          <Input value={street} onChange={(e) => setStreet(e.target.value)} />
        </div>

        <div className="grid gap-2">
          <Label>Quận / Huyện</Label>
          <select
            className="h-10 rounded-md border px-3 text-sm"
            value={district}
            onChange={(e) => {
              const d = e.target.value as DaNangDistrict | "";
              setDistrict(d);
              setWard("");
            }}
          >
            <option value="">-- Chọn quận/huyện --</option>
            {DA_NANG_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <Label>Phường / Xã</Label>
          <select
            className="h-10 rounded-md border px-3 text-sm"
            value={ward}
            onChange={(e) => setWard(e.target.value)}
            disabled={!district}
          >
            <option value="">
              {district ? "-- Chọn phường/xã --" : "Chọn quận/huyện trước"}
            </option>
            {wardOptions.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <Label>Địa chỉ ghép</Label>
          <Input value={shipAddress} readOnly />
        </div>

        <div className="grid gap-2">
          <Label>Note</Label>
          <Input value={shipNote} onChange={(e) => setShipNote(e.target.value)} />
        </div>

        <Button
          className="w-full"
          onClick={handleConfirm}
          disabled={submitting || !canSubmit}
        >
          {submitting ? "Creating..." : "Confirm & Create Rental"}
        </Button>
      </div>
    </div>
  );
}
