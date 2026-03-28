import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { productsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";

type ConditionStatus =
  | "available" | "shipping" | "rented"
  | "returned" | "washing" | "repairing" | "retired";

type InventoryItem = {
  id: number;
  barcode: string;
  conditionStatus: ConditionStatus;
  totalRentals: number;
  maxRentals: number;
  conditionNote?: string;
  variant?: { id: number; size: string; product?: { name: string } };
};

const STATUS_COLORS: Record<ConditionStatus, string> = {
  available:  "bg-green-100 text-green-800",
  shipping:   "bg-indigo-100 text-indigo-800",
  rented:     "bg-yellow-100 text-yellow-800",
  returned:   "bg-orange-100 text-orange-800",
  washing:    "bg-cyan-100 text-cyan-800",
  repairing:  "bg-red-100 text-red-800",
  retired:    "bg-gray-100 text-gray-500",
};

const ALL_STATUSES: ConditionStatus[] = [
  "available", "shipping", "rented", "returned", "washing", "repairing", "retired"
];

const MANUAL_STATUSES: ConditionStatus[] = [
  "available", "washing", "repairing", "retired"
];

const MANUALLY_EDITABLE: ConditionStatus[] = ["available", "returned", "washing", "repairing"];

export default function AdminInventory() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<ConditionStatus | "">("");
  const [barcodeSearch, setBarcodeSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newVariantId, setNewVariantId] = useState("");
  const [newBarcode, setNewBarcode] = useState("");
  const [newMaxRentals, setNewMaxRentals] = useState("50");
  const [newNote, setNewNote] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");

  const { data: products = [] } = useQuery({
    queryKey: ["products-for-inventory"],
    queryFn: () => productsApi.getAll(),
    staleTime: 60_000,
  });

  const selectedProduct = (products as any[]).find((p) => String(p.id) === selectedProductId);
  const variants: any[] = selectedProduct?.variants ?? [];

  const { data: items = [], isLoading } = useQuery<InventoryItem[]>({
    queryKey: ["admin-inventory", filterStatus],
    queryFn: () => fetchApi(`/admin/inventory${filterStatus ? `?status=${filterStatus}` : ""}`),
    staleTime: 30_000,
  });

  const { data: candidates = [] } = useQuery<InventoryItem[]>({
    queryKey: ["admin-inventory-retirement"],
    queryFn: () => fetchApi("/admin/inventory/retirement-candidates"),
    staleTime: 60_000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ConditionStatus }) =>
      fetchApi(`/admin/inventory/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-inventory"] }),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      fetchApi("/admin/inventory", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-inventory"] });
      setShowAdd(false);
      setSelectedProductId(""); setNewVariantId(""); setNewBarcode(""); setNewMaxRentals("50"); setNewNote("");
    },
  });

  const filtered = barcodeSearch
    ? items.filter((i) => i.barcode.toLowerCase().includes(barcodeSearch.toLowerCase()))
    : items;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium">{t("adminInventory.title")}</h2>
          <p className="text-sm text-muted-foreground">{items.length} {t("adminInventory.itemCount")}</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)}>+ {t("adminInventory.addItem")}</Button>
      </div>

      {/* Form thêm mới */}
      {showAdd && (
        <div className="border rounded-lg p-4 space-y-3">
          <h3 className="font-medium text-sm">{t("adminInventory.form.title")}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">{t("adminInventory.form.product")}</label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm mt-1"
                value={selectedProductId}
                onChange={(e) => { setSelectedProductId(e.target.value); setNewVariantId(""); }}
              >
                <option value="">-- {t("adminInventory.form.selectProduct")} --</option>
                {(products as any[]).map((p) => (
                  <option key={p.id} value={String(p.id)}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">{t("adminInventory.form.size")}</label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm mt-1"
                value={newVariantId}
                onChange={(e) => setNewVariantId(e.target.value)}
                disabled={!selectedProductId}
              >
                <option value="">-- {t("adminInventory.form.selectSize")} --</option>
                {variants.map((v: any) => (
                  <option key={v.id} value={String(v.id)}>
                    Size {v.size} ({t("adminInventory.form.stock")}: {v.stock})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">{t("adminInventory.form.barcode")}</label>
              <Input value={newBarcode} onChange={(e) => setNewBarcode(e.target.value)} placeholder="VD: WW-001-M" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">{t("adminInventory.form.maxRentals")}</label>
              <Input value={newMaxRentals} onChange={(e) => setNewMaxRentals(e.target.value)} type="number" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground">{t("adminInventory.form.note")}</label>
              <Input value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder={t("adminInventory.form.notePlaceholder")} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowAdd(false)}>{t("common.cancel")}</Button>
            <Button
              disabled={!newVariantId || !newBarcode || createMutation.isPending}
              onClick={() => createMutation.mutate({
                variantId: Number(newVariantId),
                barcode: newBarcode,
                maxRentals: Number(newMaxRentals),
                conditionNote: newNote || undefined,
              })}
            >
              {createMutation.isPending ? t("adminInventory.saving") : t("common.save")}
            </Button>
          </div>
        </div>
      )}

      {/* Đề xuất thanh lý */}
      {candidates.length > 0 && (
        <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
          <h3 className="font-medium text-sm text-orange-800 mb-2">
            ⚠️ {t("adminInventory.retirementWarning", { count: candidates.length })}
          </h3>
          <div className="flex flex-wrap gap-2">
            {candidates.slice(0, 5).map((c) => (
              <span key={c.id} className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                {c.barcode} ({c.totalRentals} {t("adminInventory.times")})
              </span>
            ))}
            {candidates.length > 5 && (
              <span className="text-xs text-orange-600">+{candidates.length - 5} {t("adminInventory.more")}</span>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterStatus("")}
          className={`text-xs px-3 py-1.5 rounded-full border transition ${!filterStatus ? "bg-foreground text-background" : "border-border"}`}
        >
          {t("adminInventory.all")}
        </button>
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`text-xs px-3 py-1.5 rounded-full border transition ${filterStatus === s ? "bg-foreground text-background" : "border-border"}`}
          >
            {t(`adminInventory.status.${s}`)}
          </button>
        ))}
      </div>

      <Input
        placeholder={t("adminInventory.searchBarcode")}
        value={barcodeSearch}
        onChange={(e) => setBarcodeSearch(e.target.value)}
        className="max-w-xs"
      />

      {isLoading ? (
        <div className="text-muted-foreground text-sm">{t("adminInventory.loading")}</div>
      ) : filtered.length === 0 ? (
        <div className="text-muted-foreground text-sm">{t("adminInventory.empty")}</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <div key={item.id} className="border rounded-lg p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-medium">{item.barcode}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[item.conditionStatus]}`}>
                    {t(`adminInventory.status.${item.conditionStatus}`)}
                  </span>
                  {item.totalRentals >= item.maxRentals * 0.8 && (
                    <span className="text-xs text-orange-600">⚠️ {t("adminInventory.nearLimit")}</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {item.variant?.product?.name} • Size {item.variant?.size} •{" "}
                  {t("adminInventory.rentedCount", { count: item.totalRentals, max: item.maxRentals })}
                  {item.conditionNote && ` • ${item.conditionNote}`}
                </div>
              </div>

              <select
                className={`text-xs border rounded-md px-2 py-1.5 bg-background transition ${
                  !MANUALLY_EDITABLE.includes(item.conditionStatus)
                    ? "opacity-40 cursor-not-allowed"
                    : ""
                }`}
                value={item.conditionStatus}
                disabled={
                  !MANUALLY_EDITABLE.includes(item.conditionStatus) ||
                  item.conditionStatus === "retired" ||
                  updateMutation.isPending
                }
                onChange={(e) => updateMutation.mutate({ id: item.id, status: e.target.value as ConditionStatus })}
              >
                {/* Nếu item đang ở trạng thái không editable, hiện trạng thái đó như readonly */}
                {!MANUALLY_EDITABLE.includes(item.conditionStatus) && (
                  <option value={item.conditionStatus}>{t(`adminInventory.status.${item.conditionStatus}`)}</option>
                )}
                {MANUAL_STATUSES.map((s) => (
                  <option key={s} value={s}>{t(`adminInventory.status.${s}`)}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
