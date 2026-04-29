import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sparkles, Shirt, Brain, Heart, Users, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-24">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm uppercase tracking-widest text-primary-foreground/60 mb-4">
            {t("about.hero.eyebrow")}
          </p>
          <h1 className="font-display text-4xl md:text-6xl font-semibold mb-6 leading-tight">
            {t("about.hero.title")}
          </h1>
          <p className="text-lg text-primary-foreground/70 max-w-2xl mx-auto leading-relaxed">
            {t("about.hero.subtitle")}
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display text-3xl font-semibold mb-6 text-center">
              {t("about.story.title")}
            </h2>
            <div className="space-y-5 text-muted-foreground leading-relaxed text-base">
              <p>{t("about.story.p1")}</p>
              <p>{t("about.story.p2")}</p>
              <p>{t("about.story.p3")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-secondary py-20">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl font-semibold text-center mb-12">
            {t("about.values.title")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Brain className="w-7 h-7 text-accent" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{t("about.values.ai.title")}</h3>
              <p className="text-sm text-muted-foreground">{t("about.values.ai.desc")}</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Shirt className="w-7 h-7 text-accent" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{t("about.values.quality.title")}</h3>
              <p className="text-sm text-muted-foreground">{t("about.values.quality.desc")}</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Heart className="w-7 h-7 text-accent" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{t("about.values.accessible.title")}</h3>
              <p className="text-sm text-muted-foreground">{t("about.values.accessible.desc")}</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-accent" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{t("about.values.community.title")}</h3>
              <p className="text-sm text-muted-foreground">{t("about.values.community.desc")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* What makes us different */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-display text-3xl font-semibold mb-6">
                {t("about.diff.title")}
              </h2>
              <ul className="space-y-5">
                {(["tryon", "inventory", "delivery", "support"] as const).map((key) => (
                  <li key={key} className="flex gap-4">
                    <Sparkles className="w-5 h-5 text-accent mt-1 shrink-0" />
                    <div>
                      <p className="font-medium">{t(`about.diff.items.${key}.title`)}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t(`about.diff.items.${key}.desc`)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-secondary rounded-2xl p-10 flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <MapPin className="w-6 h-6 text-accent shrink-0" />
                <div>
                  <p className="font-semibold">{t("about.location.title")}</p>
                  <p className="text-sm text-muted-foreground">{t("about.location.desc")}</p>
                </div>
              </div>
              <div className="border-t border-border pt-6 grid grid-cols-2 gap-6 text-center">
                <div>
                  <p className="font-display text-3xl font-semibold">100+</p>
                  <p className="text-sm text-muted-foreground mt-1">{t("about.stats.products")}</p>
                </div>
                <div>
                  <p className="font-display text-3xl font-semibold">AI</p>
                  <p className="text-sm text-muted-foreground mt-1">{t("about.stats.tryon")}</p>
                </div>
                <div>
                  <p className="font-display text-3xl font-semibold">3</p>
                  <p className="text-sm text-muted-foreground mt-1">{t("about.stats.languages")}</p>
                </div>
                <div>
                  <p className="font-display text-3xl font-semibold">100%</p>
                  <p className="text-sm text-muted-foreground mt-1">{t("about.stats.clean")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground py-20 text-center">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl font-semibold mb-4">{t("about.cta.title")}</h2>
          <p className="text-primary-foreground/70 mb-8 max-w-xl mx-auto">
            {t("about.cta.subtitle")}
          </p>
          <div className="flex justify-center">
            <Button asChild size="lg" variant="secondary">
              <Link to="/products">{t("about.cta.explore")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
