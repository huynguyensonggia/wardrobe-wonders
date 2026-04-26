import {
  CheckCircle,
  MessageCircle,
  Ruler,
  Truck,
  HelpCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";

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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {t("howItWorks.title")}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {t("howItWorks.subtitle")}
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="flex flex-col lg:flex-row items-start gap-8 p-8 bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {/* Step Number & Icon */}
                <div className="flex-shrink-0 flex flex-col items-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center mb-4">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="w-8 h-8 bg-amber-800 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="font-display text-2xl font-bold text-gray-900 mb-4">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                    {step.description}
                  </p>

                  {/* Details */}
                  <div className="grid md:grid-cols-2 gap-3">
                    {step.details.map((detail, detailIndex) => (
                      <div key={detailIndex} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-gray-700">{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-3xl p-12 text-white">
            <h2 className="font-display text-3xl font-bold mb-4">
              {t("howItWorks.cta.title")}
            </h2>
            <p className="text-xl mb-8 opacity-90">
              {t("howItWorks.cta.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/products"
                className="bg-white text-amber-600 px-8 py-4 rounded-2xl font-semibold hover:bg-gray-50 transition-colors"
              >
                {t("howItWorks.cta.viewCollection")}
              </a>
              <a
                href="https://web.facebook.com/share/18n4kf3A4A/?mibextid=wwXIfr&_rdc=1&_rdr"
                target="_blank"
                rel="noopener noreferrer"
                className="border-2 border-white text-white px-8 py-4 rounded-2xl font-semibold hover:bg-white hover:text-amber-600 transition-colors"
              >
                {t("howItWorks.cta.contact")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
