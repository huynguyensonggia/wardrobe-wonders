import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  MessageCircle,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function FAQPage() {
  const { t } = useTranslation();
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const faqCategories = [
    {
      title: t("faq.categories.service.title"),
      questions: [
        {
          question: t(
            "faq.categories.service.questions.whatIsAiCloset.question"
          ),
          answer: t("faq.categories.service.questions.whatIsAiCloset.answer"),
        },
        {
          question: t(
            "faq.categories.service.questions.rentalDuration.question"
          ),
          answer: t("faq.categories.service.questions.rentalDuration.answer"),
        },
        {
          question: t("faq.categories.service.questions.howToRent.question"),
          answer: t("faq.categories.service.questions.howToRent.answer"),
        },
        {
          question: t("faq.categories.service.questions.deposit.question"),
          answer: t("faq.categories.service.questions.deposit.answer"),
        },
      ],
    },
    {
      title: t("faq.categories.sizeQuality.title"),
      questions: [
        {
          question: t(
            "faq.categories.sizeQuality.questions.sizeSelection.question"
          ),
          answer: t(
            "faq.categories.sizeQuality.questions.sizeSelection.answer"
          ),
        },
        {
          question: t(
            "faq.categories.sizeQuality.questions.cleanliness.question"
          ),
          answer: t("faq.categories.sizeQuality.questions.cleanliness.answer"),
        },
        {
          question: t("faq.categories.sizeQuality.questions.damage.question"),
          answer: t("faq.categories.sizeQuality.questions.damage.answer"),
        },
        {
          question: t(
            "faq.categories.sizeQuality.questions.tryBefore.question"
          ),
          answer: t("faq.categories.sizeQuality.questions.tryBefore.answer"),
        },
      ],
    },
    {
      title: t("faq.categories.deliveryPayment.title"),
      questions: [
        {
          question: t(
            "faq.categories.deliveryPayment.questions.deliveryArea.question"
          ),
          answer: t(
            "faq.categories.deliveryPayment.questions.deliveryArea.answer"
          ),
        },
        {
          question: t(
            "faq.categories.deliveryPayment.questions.deliveryTime.question"
          ),
          answer: t(
            "faq.categories.deliveryPayment.questions.deliveryTime.answer"
          ),
        },
        {
          question: t(
            "faq.categories.deliveryPayment.questions.paymentMethods.question"
          ),
          answer: t(
            "faq.categories.deliveryPayment.questions.paymentMethods.answer"
          ),
        },
        {
          question: t(
            "faq.categories.deliveryPayment.questions.notHome.question"
          ),
          answer: t("faq.categories.deliveryPayment.questions.notHome.answer"),
        },
      ],
    },
    {
      title: t("faq.categories.returnsPolicy.title"),
      questions: [
        {
          question: t(
            "faq.categories.returnsPolicy.questions.returnCases.question"
          ),
          answer: t(
            "faq.categories.returnsPolicy.questions.returnCases.answer"
          ),
        },
        {
          question: t(
            "faq.categories.returnsPolicy.questions.returnProcess.question"
          ),
          answer: t(
            "faq.categories.returnsPolicy.questions.returnProcess.answer"
          ),
        },
        {
          question: t(
            "faq.categories.returnsPolicy.questions.lateFee.question"
          ),
          answer: t("faq.categories.returnsPolicy.questions.lateFee.answer"),
        },
        {
          question: t(
            "faq.categories.returnsPolicy.questions.insurance.question"
          ),
          answer: t("faq.categories.returnsPolicy.questions.insurance.answer"),
        },
      ],
    },
    {
      title: t("faq.categories.promotionsMembership.title"),
      questions: [
        {
          question: t(
            "faq.categories.promotionsMembership.questions.promotions.question"
          ),
          answer: t(
            "faq.categories.promotionsMembership.questions.promotions.answer"
          ),
        },
        {
          question: t(
            "faq.categories.promotionsMembership.questions.vipMembership.question"
          ),
          answer: t(
            "faq.categories.promotionsMembership.questions.vipMembership.answer"
          ),
        },
        {
          question: t(
            "faq.categories.promotionsMembership.questions.referral.question"
          ),
          answer: t(
            "faq.categories.promotionsMembership.questions.referral.answer"
          ),
        },
        {
          question: t(
            "faq.categories.promotionsMembership.questions.styleConsultation.question"
          ),
          answer: t(
            "faq.categories.promotionsMembership.questions.styleConsultation.answer"
          ),
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {t("faq.title")}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {t("faq.subtitle")}
          </p>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {faqCategories.map((category, categoryIndex) => (
            <div
              key={categoryIndex}
              className="bg-white rounded-2xl p-8 shadow-lg"
            >
              <h2 className="font-display text-2xl font-bold text-gray-900 mb-6 text-center">
                {category.title}
              </h2>

              <div className="space-y-4">
                {category.questions.map((faq, faqIndex) => {
                  const itemIndex = categoryIndex * 100 + faqIndex;
                  const isOpen = openItems.includes(itemIndex);

                  return (
                    <div
                      key={faqIndex}
                      className="border border-gray-200 rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() => toggleItem(itemIndex)}
                        className="w-full px-6 py-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                      >
                        <h3 className="font-semibold text-gray-900 pr-4">
                          {faq.question}
                        </h3>
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-amber-600 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-amber-600 flex-shrink-0" />
                        )}
                      </button>

                      {isOpen && (
                        <div className="px-6 py-4 bg-white border-t border-gray-200">
                          <p className="text-gray-700 leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-3xl p-12 text-white">
            <HelpCircle className="w-16 h-16 mx-auto mb-6 opacity-90" />
            <h2 className="font-display text-3xl font-bold mb-4">
              {t("faq.cta.title")}
            </h2>
            <p className="text-xl mb-8 opacity-90">{t("faq.cta.subtitle")}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://web.facebook.com/share/18n4kf3A4A/?mibextid=wwXIfr&_rdc=1&_rdr"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white text-amber-600 px-8 py-4 rounded-2xl font-semibold hover:bg-gray-50 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                {t("faq.cta.chatFacebook")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
