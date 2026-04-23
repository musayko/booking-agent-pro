import React, { createContext, useContext, useState, useCallback } from "react";
import type { Language } from "./types";
import { TRANSLATIONS } from "./constants";

type TranslationKey = keyof typeof TRANSLATIONS.en;

interface I18nContextValue {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>("en");

  const t = useCallback(
    (key: TranslationKey): string => {
      return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key;
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}
