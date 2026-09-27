export const supportedLocales = ["en", "es", "hi", "pt", "zh", "fr"] as const;

export type Locale = (typeof supportedLocales)[number];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  es: "Spanish",
  hi: "Hindi",
  pt: "Portuguese",
  zh: "Chinese",
  fr: "French",
};

export const isSupportedLocale = (value: unknown): value is Locale => {
  return typeof value === "string" && supportedLocales.includes(value as Locale);
};

export const getInitialLocale = (): Locale => {
  if (typeof window === "undefined") {
    return defaultLocale;
  }

  const storedLocale = window.localStorage.getItem("locale");
  if (isSupportedLocale(storedLocale)) {
    return storedLocale;
  }

  const browserLocale = window.navigator.language.split("-")[0];
  return isSupportedLocale(browserLocale) ? browserLocale : defaultLocale;
};
