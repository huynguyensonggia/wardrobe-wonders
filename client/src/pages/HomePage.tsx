import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/products/ProductCard";
import { ArrowRight, Sparkles, Shield, Truck, RefreshCw } from "lucide-react";

import heroImage from "@/assets/hero-fashion.jpg";
import dressesImg from "@/assets/product-dress.jpg";
import blazerImg from "@/assets/product-blazer.jpg";
import shirtImg from "@/assets/product-shirt.jpg";
import pantsImg from "@/assets/product-pants.jpg";

import { productsApi, categoriesApi } from "@/lib/api";
import type { Product, Category } from "@/types";
import { useTranslation } from "react-i18next";

export default function HomePage() {
  const { t } = useTranslation();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // ✅ ảnh category cố định
  const categoryImages: Record<string, string> = {
    dresses: dressesImg,
    outerwear: blazerImg,
    tops: shirtImg,
    pants: pantsImg,
  };

  // ✅ featured lấy từ data thật
  const featuredProducts = useMemo(() => {
    const featured = products.filter((p: any) => p?.featured === true);
    return (featured.length ? featured : products).slice(0, 4);
  }, [products]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const [cats, prods] = await Promise.all([
          categoriesApi.getAll(),
          productsApi.getAll(),
        ]);

        if (!mounted) return;
        setCategories(cats);
        setProducts(prods);
      } catch (e: any) {
        if (!mounted) return;
        setErr(e?.message ?? t("home.errors.loadHomepage"));
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [t]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt={t("home.hero.imageAlt")}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl">
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-semibold leading-tight animate-slide-up">
              {t("home.hero.titleLine1")}
              <br />
              <span className="text-gradient-gold">{t("home.hero.titleHighlight")}</span>
            </h1>

            <p
              className="mt-6 text-lg md:text-xl text-muted-foreground max-w-lg animate-slide-up"
              style={{ animationDelay: "0.1s" }}
            >
              {t("home.hero.subtitle")}
            </p>

            <div
              className="mt-8 flex flex-wrap gap-4 animate-slide-up"
              style={{ animationDelay: "0.2s" }}
            >
              <Button variant="hero" size="xl" asChild>
                <Link to="/products">
                  {t("home.hero.ctaExplore")}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>

              <Button variant="hero-outline" size="xl" asChild>
                <Link to="/style-advisor">
                  <Sparkles className="w-5 h-5 mr-2" />
                  {t("home.hero.ctaTryOn")}
                </Link>
              </Button>
            </div>

            {/* trạng thái load/error */}
            {loading && (
              <p className="mt-6 text-sm text-muted-foreground">
                {t("home.loading")}
              </p>
            )}
            {err && <p className="mt-6 text-sm text-red-500">{err}</p>}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Sparkles,
                title: t("home.features.ai.title"),
                desc: t("home.features.ai.desc"),
              },
              {
                icon: Truck,
                title: t("home.features.delivery.title"),
                desc: t("home.features.delivery.desc"),
              },
              {
                icon: Shield,
                title: t("home.features.insured.title"),
                desc: t("home.features.insured.desc"),
              },
              {
                icon: RefreshCw,
                title: t("home.features.returns.title"),
                desc: t("home.features.returns.desc"),
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="text-center p-6 animate-fade-in"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-accent/20 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-display text-lg font-medium mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-semibold mb-4">
              {t("home.categories.title")}
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              {t("home.categories.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.slice(0, 4).map((category, i) => (
              <Link
                key={category.id}
                to={`/products?category=${category.slug}`}
                className="group relative aspect-[4/5] overflow-hidden rounded-lg bg-secondary hover-lift animate-scale-in"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <img
                  src={categoryImages[category.slug] ?? dressesImg}
                  alt={category.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="font-display text-xl text-white font-medium">
                    {category.name}
                  </h3>
                  <p className="text-sm text-white/80 mt-1">
                    {category.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-semibold mb-4">
                {t("home.featured.title")}
              </h2>
              <p className="text-muted-foreground">{t("home.featured.subtitle")}</p>
            </div>

            <Button variant="outline" asChild className="hidden md:flex">
              <Link to="/products">
                {t("home.featured.viewAll")}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {featuredProducts.map((product, i) => (
              <div
                key={product.id}
                className="animate-slide-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>

          <div className="mt-8 text-center md:hidden">
            <Button variant="outline" asChild>
              <Link to="/products">
                {t("home.featured.viewAllMobile")}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* AI Try-On CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gold/20 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-gold" />
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-semibold mb-4">
              {t("home.tryOnCta.title")}
            </h2>
            <p className="text-lg text-primary-foreground/70 mb-8 max-w-xl mx-auto">
              {t("home.tryOnCta.desc")}
            </p>
            <Button variant="gold" size="xl" asChild>
              <Link to="/style-advisor">
                {t("home.tryOnCta.button")}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <blockquote className="font-display text-2xl md:text-3xl italic leading-relaxed">
              {t("home.testimonial.quote")}
            </blockquote>
            <div className="mt-6">
              <p className="font-medium">{t("home.testimonial.name")}</p>
              <p className="text-sm text-muted-foreground">{t("home.testimonial.title")}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
