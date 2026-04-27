import { useTranslation } from "react-i18next";
import { Shield } from "lucide-react";

export default function PrivacyPage() {
  const { t } = useTranslation();

  const sections = t("privacy.sections", { returnObjects: true }) as {
    title: string;
    content: string;
  }[];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-primary-foreground/70" />
          <h1 className="font-display text-4xl md:text-5xl font-semibold mb-4">
            {t("privacy.title")}
          </h1>
          <p className="text-primary-foreground/60 text-sm">
            {t("privacy.lastUpdated")}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-14">
        <div className="container mx-auto px-4 max-w-3xl">
          <p className="text-muted-foreground leading-relaxed mb-10">
            {t("privacy.intro")}
          </p>

          <div className="space-y-10">
            {sections.map((section, i) => (
              <div key={i}>
                <h2 className="font-display text-xl font-semibold mb-3">
                  {i + 1}. {section.title}
                </h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {section.content}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 bg-secondary rounded-xl border border-border text-sm text-muted-foreground">
            {t("privacy.contact")}
          </div>
        </div>
      </section>
    </div>
  );
}
