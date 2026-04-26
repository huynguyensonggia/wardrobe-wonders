import {
  Ruler,
  User,
  AlertCircle,
  CheckCircle2,
  Video,
  MessageCircle,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function SizeGuidePage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("measure");

  const sizeCharts = {
    dress: {
      title: t("sizeGuide.charts.dress.title"),
      sizes: [
        { size: "XS", bust: "80-82", waist: "60-62", hip: "86-88" },
        { size: "S", bust: "84-86", waist: "64-66", hip: "90-92" },
        { size: "M", bust: "88-90", waist: "68-70", hip: "94-96" },
        { size: "L", bust: "92-94", waist: "72-74", hip: "98-100" },
        { size: "XL", bust: "96-98", waist: "76-78", hip: "102-104" },
        { size: "XXL", bust: "100-102", waist: "80-82", hip: "106-108" },
      ],
    },
    top: {
      title: t("sizeGuide.charts.top.title"),
      sizes: [
        { size: "XS", bust: "80-82", waist: "60-62", shoulder: "36-37" },
        { size: "S", bust: "84-86", waist: "64-66", shoulder: "37-38" },
        { size: "M", bust: "88-90", waist: "68-70", shoulder: "38-39" },
        { size: "L", bust: "92-94", waist: "72-74", shoulder: "39-40" },
        { size: "XL", bust: "96-98", waist: "76-78", shoulder: "40-41" },
        { size: "XXL", bust: "100-102", waist: "80-82", shoulder: "41-42" },
      ],
    },
    bottom: {
      title: t("sizeGuide.charts.bottom.title"),
      sizes: [
        { size: "XS", waist: "60-62", hip: "86-88", length: "95-97" },
        { size: "S", waist: "64-66", hip: "90-92", length: "96-98" },
        { size: "M", waist: "68-70", hip: "94-96", length: "97-99" },
        { size: "L", waist: "72-74", hip: "98-100", length: "98-100" },
        { size: "XL", waist: "76-78", hip: "102-104", length: "99-101" },
        { size: "XXL", waist: "80-82", hip: "106-108", length: "100-102" },
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {t("sizeGuide.title")}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {t("sizeGuide.subtitle")}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-12">
          <div className="bg-white rounded-2xl p-2 shadow-lg">
            <button
              onClick={() => setActiveTab("measure")}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === "measure"
                  ? "bg-amber-500 text-white shadow-md"
                  : "text-gray-600 hover:text-amber-500"
              }`}
            >
              {t("sizeGuide.tabs.measure")}
            </button>
            <button
              onClick={() => setActiveTab("charts")}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === "charts"
                  ? "bg-amber-500 text-white shadow-md"
                  : "text-gray-600 hover:text-amber-500"
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
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-amber-800 mb-2">
                    {t("sizeGuide.importantTips.title")}
                  </h3>
                  <ul className="text-amber-700 space-y-1 text-sm">
                    <li>• {t("sizeGuide.importantTips.tip1")}</li>
                    <li>• {t("sizeGuide.importantTips.tip2")}</li>
                    <li>• {t("sizeGuide.importantTips.tip3")}</li>
                    <li>• {t("sizeGuide.importantTips.tip4")}</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Measurement Steps */}
            <div className="grid md:grid-cols-2 gap-8">
              {measurementSteps.map((step, index) => (
                <div key={index} className="bg-white rounded-2xl p-6 shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg mb-2">
                        {step.title}
                      </h3>
                      <p className="text-gray-600 mb-3">{step.description}</p>
                      <div className="bg-amber-50 rounded-lg p-3">
                        <p className="text-amber-700 text-sm font-medium">
                          💡 {step.tips}
                        </p>
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
              <div key={key} className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="font-display text-2xl font-bold text-gray-900 mb-6 text-center">
                  {chart.title}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">
                          Size
                        </th>
                        {Object.keys(chart.sizes[0])
                          .filter((k) => k !== "size")
                          .map((measurement) => (
                            <th
                              key={measurement}
                              className="px-4 py-3 text-center font-semibold text-gray-900 capitalize"
                            >
                              {measurement === "bust"
                                ? t("sizeGuide.measurements.bust.label")
                                : measurement === "waist"
                                  ? t("sizeGuide.measurements.waist.label")
                                  : measurement === "hip"
                                    ? t("sizeGuide.measurements.hip.label")
                                    : measurement === "shoulder"
                                      ? t(
                                          "sizeGuide.measurements.shoulder.label"
                                        )
                                      : measurement === "length"
                                        ? t(
                                            "sizeGuide.measurements.length.label"
                                          )
                                        : measurement}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                      {chart.sizes.map((size, index) => (
                        <tr
                          key={index}
                          className={
                            index % 2 === 0 ? "bg-gray-25" : "bg-white"
                          }
                        >
                          <td className="px-4 py-3 font-semibold text-amber-600">
                            {size.size}
                          </td>
                          {Object.entries(size)
                            .filter(([k]) => k !== "size")
                            .map(([key, value]) => (
                              <td
                                key={key}
                                className="px-4 py-3 text-center text-gray-700"
                              >
                                {value}
                              </td>
                            ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            {/* Size Recommendation */}
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-green-800 mb-2">
                    {t("sizeGuide.recommendations.title")}
                  </h3>
                  <ul className="text-green-700 space-y-1 text-sm">
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

        {/* Support Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-3xl p-12 text-white">
            <Ruler className="w-16 h-16 mx-auto mb-6 opacity-90" />
            <h2 className="font-display text-3xl font-bold mb-4">
              {t("sizeGuide.support.title")}
            </h2>
            <p className="text-xl mb-8 opacity-90">
              {t("sizeGuide.support.description")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://web.facebook.com/share/18n4kf3A4A/?mibextid=wwXIfr&_rdc=1&_rdr"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-amber-600 px-8 py-4 rounded-2xl font-semibold hover:bg-gray-50 transition-colors"
              >
                {t("sizeGuide.support.consultButton")}
              </a>
              <a
                href="/products"
                className="border-2 border-white text-white px-8 py-4 rounded-2xl font-semibold hover:bg-white hover:text-amber-600 transition-colors"
              >
                {t("sizeGuide.support.viewProductsButton")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
