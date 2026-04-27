import {
  Ruler,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export default function SizeGuidePage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("measure");

  const sizeCharts = {
    dress: {
      title: t("sizeGuide.charts.dress.title"),
      sizes: [
        { size: "XS", bust: "80-82", waist: "60-62", hip: "86-88" },
        { size: "S",  bust: "84-86", waist: "64-66", hip: "90-92" },
        { size: "M",  bust: "88-90", waist: "68-70", hip: "94-96" },
        { size: "L",  bust: "92-94", waist: "72-74", hip: "98-100" },
        { size: "XL", bust: "96-98", waist: "76-78", hip: "102-104" },
        { size: "XXL",bust: "100-102",waist: "80-82",hip: "106-108" },
      ],
    },
    top: {
      title: t("sizeGuide.charts.top.title"),
      sizes: [
        { size: "XS", bust: "80-82", waist: "60-62", shoulder: "36-37" },
        { size: "S",  bust: "84-86", waist: "64-66", shoulder: "37-38" },
        { size: "M",  bust: "88-90", waist: "68-70", shoulder: "38-39" },
        { size: "L",  bust: "92-94", waist: "72-74", shoulder: "39-40" },
        { size: "XL", bust: "96-98", waist: "76-78", shoulder: "40-41" },
        { size: "XXL",bust: "100-102",waist: "80-82",shoulder: "41-42" },
      ],
    },
    bottom: {
      title: t("sizeGuide.charts.bottom.title"),
      sizes: [
        { size: "XS", waist: "60-62", hip: "86-88",  length: "95-97" },
        { size: "S",  waist: "64-66", hip: "90-92",  length: "96-98" },
        { size: "M",  waist: "68-70", hip: "94-96",  length: "97-99" },
        { size: "L",  waist: "72-74", hip: "98-100", length: "98-100" },
        { size: "XL", waist: "76-78", hip: "102-104",length: "99-101" },
        { size: "XXL",waist: "80-82", hip: "106-108",length: "100-102" },
      ],
    },
  };

  const measurementSteps = [
    {
      title: t("sizeGuide.measurements.bust.title"),
      description: t("sizeGuide.measurements.bust.description"),
      tips: t("sizeGuide.measurements.bust.tips"),
    },
    {
      title: t("sizeGuide.measurements.waist.title"),
      description: t("sizeGuide.measurements.waist.description"),
      tips: t("sizeGuide.measurements.waist.tips"),
    },
    {
      title: t("sizeGuide.measurements.hip.title"),
      description: t("sizeGuide.measurements.hip.description"),
      tips: t("sizeGuide.measurements.hip.tips"),
    },
    {
      title: t("sizeGuide.measurements.shoulder.title"),
      description: t("sizeGuide.measurements.shoulder.description"),
      tips: t("sizeGuide.measurements.shoulder.tips"),
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl md:text-5xl font-semibold mb-6">
            {t("sizeGuide.title")}
          </h1>
          <p className="text-lg text-primary-foreground/70 max-w-3xl mx-auto leading-relaxed">
            {t("sizeGuide.subtitle")}
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          {/* Tabs */}
          <div className="flex justify-center mb-10">
            <div className="bg-secondary rounded-xl p-1.5 flex gap-1">
              <button
                onClick={() => setActiveTab("measure")}
                className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  activeTab === "measure"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground/60 hover:text-foreground"
                }`}
              >
                {t("sizeGuide.tabs.measure")}
              </button>
              <button
                onClick={() => setActiveTab("charts")}
                className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  activeTab === "charts"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground/60 hover:text-foreground"
                }`}
              >
                {t("sizeGuide.tabs.charts")}
              </button>
            </div>
          </div>

          {/* Measurement Guide */}
          {activeTab === "measure" && (
            <div className="space-y-8">
              {/* Important Tips */}
              <div className="bg-secondary border border-border rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-2">
                      {t("sizeGuide.importantTips.title")}
                    </h3>
                    <ul className="text-muted-foreground space-y-1 text-sm">
                      <li>• {t("sizeGuide.importantTips.tip1")}</li>
                      <li>• {t("sizeGuide.importantTips.tip2")}</li>
                      <li>• {t("sizeGuide.importantTips.tip3")}</li>
                      <li>• {t("sizeGuide.importantTips.tip4")}</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Measurement Steps */}
              <div className="grid md:grid-cols-2 gap-6">
                {measurementSteps.map((step, index) => (
                  <div key={index} className="bg-secondary rounded-2xl p-6 border border-border">
                    <div className="flex items-start gap-4">
                      <div className="w-9 h-9 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                        <p className="text-muted-foreground text-sm mb-3">{step.description}</p>
                        <div className="bg-accent/10 rounded-lg p-3">
                          <p className="text-foreground text-sm">💡 {step.tips}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Size Charts */}
          {activeTab === "charts" && (
            <div className="space-y-8">
              {Object.entries(sizeCharts).map(([key, chart]) => (
                <div key={key} className="bg-secondary rounded-2xl p-6 border border-border">
                  <h3 className="font-display text-2xl font-semibold mb-6 text-center">
                    {chart.title}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-primary text-primary-foreground">
                          <th className="px-4 py-3 text-left font-medium rounded-tl-lg">Size</th>
                          {Object.keys(chart.sizes[0])
                            .filter((k) => k !== "size")
                            .map((measurement) => (
                              <th key={measurement} className="px-4 py-3 text-center font-medium last:rounded-tr-lg capitalize">
                                {measurement === "bust"     ? t("sizeGuide.measurements.bust.label")
                                 : measurement === "waist"  ? t("sizeGuide.measurements.waist.label")
                                 : measurement === "hip"    ? t("sizeGuide.measurements.hip.label")
                                 : measurement === "shoulder"? t("sizeGuide.measurements.shoulder.label")
                                 : measurement === "length" ? t("sizeGuide.measurements.length.label")
                                 : measurement}
                              </th>
                            ))}
                        </tr>
                      </thead>
                      <tbody>
                        {chart.sizes.map((size, index) => (
                          <tr key={index} className={index % 2 === 0 ? "bg-background" : "bg-secondary/50"}>
                            <td className="px-4 py-3 font-semibold text-accent">{size.size}</td>
                            {Object.entries(size)
                              .filter(([k]) => k !== "size")
                              .map(([k, value]) => (
                                <td key={k} className="px-4 py-3 text-center text-muted-foreground">{value}</td>
                              ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              {/* Size Recommendation */}
              <div className="bg-secondary border border-border rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-2">{t("sizeGuide.recommendations.title")}</h3>
                    <ul className="text-muted-foreground space-y-1 text-sm">
                      <li>• {t("sizeGuide.recommendations.tip1")}</li>
                      <li>• {t("sizeGuide.recommendations.tip2")}</li>
                      <li>• {t("sizeGuide.recommendations.tip3")}</li>
                      <li>• {t("sizeGuide.recommendations.tip4")}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground py-20 text-center">
        <div className="container mx-auto px-4">
          <Ruler className="w-12 h-12 mx-auto mb-6 text-primary-foreground/70" />
          <h2 className="font-display text-3xl font-semibold mb-4">
            {t("sizeGuide.support.title")}
          </h2>
          <p className="text-primary-foreground/70 text-lg mb-8 max-w-xl mx-auto">
            {t("sizeGuide.support.description")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary">
              <a
                href="https://web.facebook.com/share/18n4kf3A4A/?mibextid=wwXIfr&_rdc=1&_rdr"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("sizeGuide.support.consultButton")}
              </a>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to="/products">{t("sizeGuide.support.viewProductsButton")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
