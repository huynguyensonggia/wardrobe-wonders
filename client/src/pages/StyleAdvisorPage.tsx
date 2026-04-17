import { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { recommendationsApi, type RecommendResult } from "@/lib/api";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { label: "👗 Váy / Đầm", value: "Dresses" },
  { label: "👚 Áo", value: "Tops" },
  { label: "👖 Quần", value: "Pants" },
  { label: "🧥 Áo khoác", value: "Outerwear" },
  { label: "🥻 Áo dài", value: "Áo dài" },
];

export default function StyleAdvisorPage() {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bust, setBust] = useState("");
  const [waist, setWaist] = useState("");
  const [hips, setHips] = useState("");
  const [colorInput, setColorInput] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [results, setResults] = useState<RecommendResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleItem = (
    list: string[],
    setList: (v: string[]) => void,
    item: string
  ) => {
    setList(
      list.includes(item) ? list.filter((x) => x !== item) : [...list, item]
    );
  };

  const handleSubmit = async () => {
    if (!height || !weight) {
      setError("Vui lòng nhập chiều cao và cân nặng.");
      return;
    }
    setError(null);
    setLoading(true);
    setResults(null);

    try {
      const data = await recommendationsApi.recommend({
        height: Number(height),
        weight: Number(weight),
        bust: bust ? Number(bust) : undefined,
        waist: waist ? Number(waist) : undefined,
        hips: hips ? Number(hips) : undefined,
        favoriteColors: colorInput.trim() || undefined,
        category: selectedCategories.join(", ") || undefined,
      });
      setResults(data);
    } catch (e: any) {
      setError(e?.message || "Không thể lấy gợi ý. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setError(null);
  };

  return (
    <div className="min-h-screen py-10">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold/20 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-gold" />
          </div>
          <h1 className="font-display text-3xl font-semibold mb-2">
            Tư vấn phong cách AI
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Điền thông tin của bạn, AI sẽ gợi ý những trang phục phù hợp nhất
            từ bộ sưu tập của chúng tôi.
          </p>
        </div>

        {!results ? (
          <div className="border rounded-xl p-6 space-y-6">
            {/* Số đo */}
            <div>
              <h3 className="font-medium mb-4">📏 Số đo cơ thể</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>
                    Chiều cao (cm) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    placeholder="VD: 160"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>
                    Cân nặng (kg) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    placeholder="VD: 52"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Vòng ngực (cm)</Label>
                  <Input
                    type="number"
                    placeholder="VD: 84"
                    value={bust}
                    onChange={(e) => setBust(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Vòng eo (cm)</Label>
                  <Input
                    type="number"
                    placeholder="VD: 64"
                    value={waist}
                    onChange={(e) => setWaist(e.target.value)}
                  />
                </div>
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <Label>Vòng hông (cm)</Label>
                  <Input
                    type="number"
                    placeholder="VD: 90"
                    value={hips}
                    onChange={(e) => setHips(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Loại trang phục */}
            <div>
              <h3 className="font-medium mb-3">👗 Loại trang phục</h3>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() =>
                      toggleItem(selectedCategories, setSelectedCategories, c.value)
                    }
                    className={cn(
                      "px-3 py-1.5 rounded-full border text-sm transition-all",
                      selectedCategories.includes(c.value)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-accent"
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Có thể chọn nhiều loại. Bỏ trống để AI tự chọn.
              </p>
            </div>

            {/* Màu yêu thích */}
            <div>
              <h3 className="font-medium mb-3">🎨 Màu sắc yêu thích</h3>
              <Input
                type="text"
                placeholder="VD: màu hồng, đỏ đô, xanh pastel..."
                value={colorInput}
                onChange={(e) => setColorInput(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Điền màu bạn thích, AI sẽ tìm sản phẩm phù hợp nhất.
              </p>
            </div>

            {/* Dịp mặc - đã bỏ */}

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button
              variant="hero"
              size="xl"
              className="w-full"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  AI đang phân tích...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Gợi ý trang phục cho tôi
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                ✨ Gợi ý dành riêng cho bạn
              </h2>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Thử lại
              </Button>
            </div>

            {results.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Không tìm thấy sản phẩm phù hợp. Hãy thử điều chỉnh thông tin.
              </div>
            ) : (
              <div className="space-y-4">
                {results.map(({ product, reason }, i) => (
                  <div
                    key={product.id}
                    className="flex gap-4 border rounded-xl p-4 hover:bg-secondary/30 transition-colors"
                  >
                    {/* Rank badge */}
                    <div className="shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                      {i + 1}
                    </div>

                    {/* Image */}
                    <div className="shrink-0 w-20 h-24 rounded-lg overflow-hidden bg-muted">
                      <img
                        src={
                          product.imageUrl ||
                          "https://placehold.co/200x240?text=No+Image"
                        }
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{product.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {product.category} • {product.color}
                      </div>
                      {product.sizes.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Size: {product.sizes.join(", ")}
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground mt-2 italic">
                        "{reason}"
                      </p>
                      <div className="mt-2 text-sm font-medium">
                        {product.rentPricePerDay.toLocaleString("vi-VN")}đ/ngày
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="shrink-0 flex flex-col gap-2 justify-center">
                      <Button size="sm" asChild>
                        <Link to={`/products/${product.id}`}>
                          Xem
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/try-on?product=${product.id}`}>
                          Thử đồ
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
