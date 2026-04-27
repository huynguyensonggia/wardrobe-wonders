import {
  CheckCircle,
  MessageCircle,
  Ruler,
  Truck,
  HelpCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export default function HowItWorksPage() {
  const { t } = useTranslation();

  const steps = [
    {
      icon: MessageCircle,
      title: t("howItWorks.steps.support.title"),
      description: t("howItWorks.steps.support.description"),
      details: t("howItWorks.steps.support.details", {
        returnObjects: true,
      }) as string[],
    },
    {
      icon: CheckCircle,
      title: t("howItWorks.steps.rental.title"),
      description: t("howItWorks.steps.rental.description"),
      details: t("howItWorks.steps.rental.details", {
        returnObjects: true,
      }) as string[],
    },
    {
      icon: Ruler,
      title: t("howItWorks.steps.sizing.title"),
      description: t("howItWorks.steps.sizing.description"),
      details: t("howItWorks.steps.sizing.details", {
        returnObjects: true,
      }) as string[],
    },
    {
      icon: Truck,
      title: t("howItWorks.steps.delivery.title"),
      description: t("howItWorks.steps.delivery.description"),
      details: t("howItWorks.steps.delivery.details", {
        returnObjects: true,
      }) as string[],
    },
    {
      icon: HelpCircle,
      title: t("howItWorks.steps.faq.title"),
      description: t("howItWorks.steps.faq.description"),
      details: t("howItWorks.steps.faq.details", {
        returnObjects: true,
      }) as string[],
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl md:text-5xl font-semibold mb-6">
            {t("howItWorks.title")}
          </h1>
          <p className="text-lg text-primary-foreground/70 max-w-3xl mx-auto leading-relaxed">
            {t("howItWorks.subtitle")}
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="space-y-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={index}
                  className="flex flex-col lg:flex-row items-start gap-8 p-8 bg-secondary rounded-2xl border border-border"
                >
                  {/* Step Number & Icon */}
                  <div className="flex-shrink-0 flex flex-col items-center gap-3">
                    <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center">
                      <Icon className="w-7 h-7 text-primary-foreground" />
                    </div>
                    <div className="w-7 h-7 bg-accent rounded-full flex items-center justify-center">
                      <span className="text-accent-foreground font-semibold text-xs">{index + 1}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="font-display text-2xl font-semibold mb-3">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground text-base mb-5 leading-relaxed">
                      {step.description}
                    </p>

                    <div className="grid md:grid-cols-2 gap-3">
                      {step.details.map((detail, detailIndex) => (
                        <div key={detailIndex} className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                          <span className="text-sm text-foreground/80">{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground py-20 text-center">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl font-semibold mb-4">
            {t("howItWorks.cta.title")}
          </h2>
          <p className="text-primary-foreground/70 text-lg mb-8 max-w-xl mx-auto">
            {t("howItWorks.cta.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary">
              <Link to="/products">{t("howItWorks.cta.viewCollection")}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
            >
              <a
                href="https://web.facebook.com/share/18n4kf3A4A/?mibextid=wwXIfr&_rdc=1&_rdr"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("howItWorks.cta.contact")}
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
