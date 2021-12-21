import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./i18n/en";

export const defaultNS = "home";
export const resources = {
  en,
} as const;

const namespaces = ["common", "home", "whoami", "claimForm"] as const;

i18n.use(LanguageDetector).use(initReactI18next).init({
  lng: "en",
  fallbackLng: "en",
  ns: namespaces,
  defaultNS,
  resources,
});

export default i18n;
