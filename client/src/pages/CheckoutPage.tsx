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

import { useTranslation } from "react-i18next";

// ================= TYPES =================
type CheckoutItem = {
  productId: number;
  variantId: number; // ✅ required
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
        variantId: number; // ✅
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
  const { t } = useTranslation();

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
          variantId: p.variantId,
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
      variantId: it.variantId,
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
        <h2 className="text-xl font-medium mb-2">
          {t("checkout.empty.title")}
        </h2>
        <p className="text-muted-foreground mb-6">
          {t("checkout.empty.desc")}
        </p>
        <Button asChild>
          <Link to="/products">{t("checkout.empty.browse")}</Link>
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
      ward ? t("checkout.address.wardPrefix", { ward }) : "",
      district ? t("checkout.address.districtPrefix", { district }) : "",
      t("checkout.address.city"),
    ].filter(Boolean);

    return parts.join(", ");
  }, [street, ward, district, t]);

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

      if (!fullName) return alert(t("checkout.alert.fullName"));
      if (!phone) return alert(t("checkout.alert.phone"));
      if (!street.trim()) return alert(t("checkout.alert.street"));
      if (!district) return alert(t("checkout.alert.district"));
      if (!ward) return alert(t("checkout.alert.ward"));
      if (!address) return alert(t("checkout.alert.address"));

      setSubmitting(true);

      for (const g of groups) {
        await rentalsApi.create({
          startDate: g.startDate,
          endDate: g.endDate,
          items: g.list.map((x) => ({
            productId: x.productId,
            variantId: x.variantId,
            quantity: x.quantity,
          })),
          note: t("checkout.order.note"),
          shipFullName: fullName,
          shipPhone: phone,
          shipAddress: address,
          shipNote: note || undefined,
        } as any);
      }

      if (state.source === "cart") clear();

      alert(t("checkout.alert.success"));
      navigate("/dashboard");
    } catch (e: any) {
      alert(e?.message || t("checkout.alert.failed"));
    } finally {
      setSubmitting(false);
    }
  };

  // ================= RENDER =================
  return (
    <div className="container mx-auto px-4 py-10 grid lg:grid-cols-2 gap-8">
      {/* LEFT: Items */}
      <div className="space-y-4">
        <h2 className="text-xl font-medium">{t("checkout.summary.title")}</h2>

        {groups.map((g) => {
          const groupTotal = g.list.reduce(
            (sum, it) => sum + it.quantity * it.rentPricePerDay * it.days,
            0
          );

          return (
            <div key={g.key} className="border rounded-lg p-4 space-y-3">
              <div className="text-sm text-muted-foreground">
                {t("checkout.summary.rentalPeriod")}{" "}
                <b>{g.startDate}</b> → <b>{g.endDate}</b>
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
                        ${it.rentPricePerDay}/{t("checkout.summary.perDay")} •{" "}
                        {t("checkout.summary.days", { days: it.days })} •{" "}
                        {t("checkout.summary.qty")} {it.quantity}
                      </div>

                      <div className="text-sm font-medium">
                        {t("checkout.summary.line")}: ${lineTotal}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="border-t pt-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {t("checkout.summary.groupTotal")}
                </span>
                <span className="font-medium">${groupTotal}</span>
              </div>
            </div>
          );
        })}

        <div className="border-t pt-4 flex items-center justify-between">
          <div className="text-sm">
            {t("checkout.summary.total")}:{" "}
            <span className="font-medium">${total}</span>
          </div>

          {state.source === "cart" && (
            <Button variant="outline" asChild>
              <Link to="/cart">{t("checkout.summary.backToCart")}</Link>
            </Button>
          )}
        </div>
      </div>

      {/* RIGHT: Shipping */}
      <div className="border rounded-lg p-5 space-y-4">
        <h2 className="text-xl font-medium">{t("checkout.shipping.title")}</h2>

        <div className="grid gap-2">
          <Label>{t("checkout.shipping.fullName")}</Label>
          <Input
            value={shipFullName}
            onChange={(e) => setShipFullName(e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label>{t("checkout.shipping.phone")}</Label>
          <Input
            value={shipPhone}
            onChange={(e) => setShipPhone(e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label>{t("checkout.shipping.street")}</Label>
          <Input value={street} onChange={(e) => setStreet(e.target.value)} />
        </div>

        <div className="grid gap-2">
          <Label>{t("checkout.shipping.district")}</Label>
          <select
            className="h-10 rounded-md border px-3 text-sm"
            value={district}
            onChange={(e) => {
              const d = e.target.value as DaNangDistrict | "";
              setDistrict(d);
              setWard("");
            }}
          >
            <option value="">{t("checkout.shipping.districtPlaceholder")}</option>
            {DA_NANG_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <Label>{t("checkout.shipping.ward")}</Label>
          <select
            className="h-10 rounded-md border px-3 text-sm"
            value={ward}
            onChange={(e) => setWard(e.target.value)}
            disabled={!district}
          >
            <option value="">
              {district
                ? t("checkout.shipping.wardPlaceholder")
                : t("checkout.shipping.wardNeedDistrict")}
            </option>
            {wardOptions.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <Label>{t("checkout.shipping.combinedAddress")}</Label>
          <Input value={shipAddress} readOnly />
        </div>

        <div className="grid gap-2">
          <Label>{t("checkout.shipping.note")}</Label>
          <Input
            value={shipNote}
            onChange={(e) => setShipNote(e.target.value)}
            placeholder={t("checkout.shipping.notePlaceholder")}
          />
        </div>

        <Button
          className="w-full"
          onClick={handleConfirm}
          disabled={submitting || !canSubmit}
        >
          {submitting ? t("checkout.button.creating") : t("checkout.button.confirm")}
        </Button>
      </div>
    </div>
  );
}
