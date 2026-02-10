import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en/common.json";
import vi from "./locales/vi/common.json";
import ja from "./locales/ja/common.json";

const STORAGE_KEY = "lang";

// ưu tiên: localStorage -> ngôn ngữ trình duyệt -> en
const savedLang =
  (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY)) ||
  (typeof navigator !== "undefined" ? navigator.language : "en");

i18n.use(initReactI18next).init({
  resources: {
    en: { common: en },
    vi: { common: vi },
    ja: { common: ja },
  },

  lng: savedLang,          // ✅ dùng ngôn ngữ đã lưu / browser
  fallbackLng: "en",

  ns: ["common"],
  defaultNS: "common",

  // ✅ nếu browser là en-US/vi-VN/ja-JP thì vẫn map về en/vi/ja
  load: "languageOnly",
  supportedLngs: ["en", "vi", "ja"],

  interpolation: { escapeValue: false },

  // debug: import.meta.env.DEV, // bật log khi dev (tuỳ bạn)
});

// ✅ tự lưu khi đổi ngôn ngữ
i18n.on("languageChanged", (lng) => {
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    // ignore
  }
});

export default i18n;
