import { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { recommendationsApi, type RecommendResult } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ErrorState } from "@/components/common";
import { getLocalizedProductName } from "@/utils/i18n";

export default function StyleAdvisorPage() {
  const { t, i18n } = useTranslation();

  const CATEGORIES = [
    { label: t("styleAdvisor.categories.dresses"),   value: "Dresses" },
    { label: t("styleAdvisor.categories.tops"),      value: "Tops" },
    { label: t("styleAdvisor.categories.pants"),     value: "Pants" },
    { label: t("styleAdvisor.categories.outerwear"), value: "Outerwear" },
    { label: t("styleAdvisor.categories.aodai"),     value: "Áo dài" },
  ];

  const OCCASIONS = [
    { label: t("styleAdvisor.occasions.wedding"),  value: "wedding" },
    { label: t("styleAdvisor.occasions.party"),    value: "party" },
    { label: t("styleAdvisor.occasions.casual"),   value: "casual" },
    { label: t("styleAdvisor.occasions.work"),     value: "work" },
    { label: t("styleAdvisor.occasions.dating"),   value: "dating" },
  ];

  const STYLES = [
    { label: t("styleAdvisor.styles.elegant"),   value: "elegant" },
    { label: t("styleAdvisor.styles.feminine"),  value: "feminine" },
    { label: t("styleAdvisor.styles.modern"),    value: "modern" },
    { label: t("styleAdvisor.styles.cute"),      value: "cute" },
    { label: t("styleAdvisor.styles.bold"),      value: "bold" },
  ];

  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bust, setBust] = useState("");
  const [waist, setWaist] = useState("");
  const [hips, setHips] = useState("");
  const [colorInput, setColorInput] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);

  const [results, setResults] = useState<RecommendResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  };

  const handleSubmit = async () => {
    if (!height || !weight) {
      setError(t("styleAdvisor.errors.heightWeightRequired"));
      return;
    }
    const h = Number(height);
    const w = Number(weight);
    if (isNaN(h) || h < 100 || h > 250) { setError(t("styleAdvisor.errors.invalidHeight")); return; }
    if (isNaN(w) || w < 30  || w > 200) { setError(t("styleAdvisor.errors.invalidWeight")); return; }
    if (bust  && (Number(bust)  < 50 || Number(bust)  > 200)) { setError(t("styleAdvisor.errors.invalidMeasurement")); return; }
    if (waist && (Number(waist) < 40 || Number(waist) > 200)) { setError(t("styleAdvisor.errors.invalidMeasurement")); return; }
    if (hips  && (Number(hips)  < 50 || Number(hips)  > 200)) { setError(t("styleAdvisor.errors.invalidMeasurement")); return; }

    setError(null);
    setLoading(true);
    setResults(null);

    try {
      const data = await recommendationsApi.recommend({
        height: h,
        weight: w,
        bust:   bust  ? Number(bust)  : undefined,
        waist:  waist ? Number(waist) : undefined,
        hips:   hips  ? Number(hips)  : undefined,
        favoriteColors:  colorInput.trim() || undefined,
        category:        selectedCategories.join(", ") || undefined,
        occasion:        selectedOccasions.join(", ") || undefined,
        stylePreference: selectedStyles.join(", ") || undefined,
        language:        i18n.language,
      });
      setResults(data);
    } catch (e: any) {
      setError(e?.message || t("styleAdvisor.errors.fetchFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => { setResults(null); setError(null); };

  return (
    <div className="min-h-screen py-10">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold/20 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-gold" />
          </div>
          <h1 className="font-display text-3xl font-semibold mb-2">{t("styleAdvisor.title")}</h1>
          <p className="text-muted-foreground max-w-md mx-auto">{t("styleAdvisor.subtitle")}</p>
        </div>

        {!results ? (
          <div className="border rounded-xl p-6 space-y-6">
            {/* Số đo */}
            <div>
              <h3 className="font-medium mb-4">{t("styleAdvisor.form.measurements.title")}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>{t("styleAdvisor.form.measurements.height")} <span className="text-destructive">*</span></Label>
                  <Input type="number" placeholder={t("styleAdvisor.form.measurements.heightPlaceholder")} value={height} min={100} max={250} onChange={(e) => setHeight(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>{t("styleAdvisor.form.measurements.weight")} <span className="text-destructive">*</span></Label>
                  <Input type="number" placeholder={t("styleAdvisor.form.measurements.weightPlaceholder")} value={weight} min={30} max={200} onChange={(e) => setWeight(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>{t("styleAdvisor.form.measurements.bust")}</Label>
                  <Input type="number" placeholder={t("styleAdvisor.form.measurements.bustPlaceholder")} value={bust} onChange={(e) => setBust(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>{t("styleAdvisor.form.measurements.waist")}</Label>
                  <Input type="number" placeholder={t("styleAdvisor.form.measurements.waistPlaceholder")} value={waist} onChange={(e) => setWaist(e.target.value)} />
                </div>
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <Label>{t("styleAdvisor.form.measurements.hips")}</Label>
                  <Input type="number" placeholder={t("styleAdvisor.form.measurements.hipsPlaceholder")} value={hips} onChange={(e) => setHips(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Dịp mặc */}
            <div>
              <h3 className="font-medium mb-3">{t("styleAdvisor.form.occasion.title")}</h3>
              <div className="flex flex-wrap gap-2">
                {OCCASIONS.map((o) => (
                  <button key={o.value} type="button"
                    onClick={() => toggle(selectedOccasions, setSelectedOccasions, o.value)}
                    className={cn("px-3 py-1.5 rounded-full border text-sm transition-all",
                      selectedOccasions.includes(o.value)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-accent"
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t("styleAdvisor.form.occasion.hint")}</p>
            </div>

            {/* Phong cách */}
            <div>
              <h3 className="font-medium mb-3">{t("styleAdvisor.form.style.title")}</h3>
              <div className="flex flex-wrap gap-2">
                {STYLES.map((s) => (
                  <button key={s.value} type="button"
                    onClick={() => toggle(selectedStyles, setSelectedStyles, s.value)}
                    className={cn("px-3 py-1.5 rounded-full border text-sm transition-all",
                      selectedStyles.includes(s.value)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-accent"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t("styleAdvisor.form.style.hint")}</p>
            </div>

            {/* Loại trang phục */}
            <div>
              <h3 className="font-medium mb-3">{t("styleAdvisor.form.category.title")}</h3>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button key={c.value} type="button"
                    onClick={() => toggle(selectedCategories, setSelectedCategories, c.value)}
                    className={cn("px-3 py-1.5 rounded-full border text-sm transition-all",
                      selectedCategories.includes(c.value)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-accent"
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t("styleAdvisor.form.category.hint")}</p>
            </div>

            {/* Màu yêu thích */}
            <div>
              <h3 className="font-medium mb-3">{t("styleAdvisor.form.colors.title")}</h3>
              <Input type="text" placeholder={t("styleAdvisor.form.colors.placeholder")} value={colorInput} onChange={(e) => setColorInput(e.target.value)} />
              <p className="text-xs text-muted-foreground mt-1">{t("styleAdvisor.form.colors.hint")}</p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button variant="hero" size="xl" className="w-full" onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t("styleAdvisor.form.submit.loading")}</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" />{t("styleAdvisor.form.submit.label")}</>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{t("styleAdvisor.results.title")}</h2>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RefreshCw className="w-4 h-4 mr-1" />
                {t("styleAdvisor.results.reset")}
              </Button>
            </div>

            {error ? (
              <ErrorState message={error} onRetry={handleSubmit} retryLabel={t("common.retry")} />
            ) : results.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">{t("styleAdvisor.results.empty")}</div>
            ) : (
              <div className="space-y-4">
                {results.map(({ product, reason }, i) => (
                  <div key={product.id} className="flex gap-4 border rounded-xl p-4 hover:bg-secondary/30 transition-colors">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                      {i + 1}
                    </div>
                    <div className="shrink-0 w-20 h-24 rounded-lg overflow-hidden bg-muted">
                      <img
                        src={product.imageUrl || "https://placehold.co/200x240?text=No+Image"}
                        alt={getLocalizedProductName(product, i18n.language, product.name)}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {getLocalizedProductName(product, i18n.language, product.name)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {product.category} • {product.color}
                      </div>
                      {product.sizes.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {t("styleAdvisor.results.size")}: {product.sizes.join(", ")}
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground mt-2 italic">"{reason}"</p>
                      <div className="mt-2 text-sm font-medium">
                        {product.rentPricePerDay.toLocaleString("vi-VN")}đ{t("styleAdvisor.results.perDay")}
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col gap-2 justify-center">
                      <Button size="sm" asChild>
                        <Link to={`/products/${product.id}`}>
                          {t("styleAdvisor.results.view")}
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/try-on?product=${product.id}`}>
                          {t("styleAdvisor.results.tryOn")}
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
