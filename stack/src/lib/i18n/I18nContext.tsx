import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  defaultLocale,
  getInitialLocale,
  isSupportedLocale,
  type Locale,
  supportedLocales,
} from "./config";
import { translations } from "./translations";

type TranslationValues = Record<string, string | number>;

type I18nContextValue = {
  locale: Locale;
  locales: readonly Locale[];
  isReady: boolean;
  setLocale: (locale: Locale) => void;
  t: (key: string, values?: TranslationValues) => string;
  formatDate: (value: Date | number | string, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const replaceValues = (message: string, values: TranslationValues = {}) => {
  return message.replace(/\{(\w+)\}/g, (match, key: string) => {
    return Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match;
  });
};

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initialLocale = getInitialLocale();
    setLocaleState(initialLocale);
    document.documentElement.lang = initialLocale;
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    window.localStorage.setItem("locale", locale);
    document.documentElement.lang = locale;
  }, [isReady, locale]);

  const setLocale = (nextLocale: Locale) => {
    if (isSupportedLocale(nextLocale)) {
      setLocaleState(nextLocale);
    }
  };

  const t = (key: string, values?: TranslationValues) => {
    const message = translations[locale][key] || translations[defaultLocale][key] || key;
    return replaceValues(message, values);
  };

  const formatDate = (
    value: Date | number | string,
    options?: Intl.DateTimeFormatOptions
  ) => new Intl.DateTimeFormat(locale, options).format(new Date(value));

  const formatNumber = (value: number, options?: Intl.NumberFormatOptions) =>
    new Intl.NumberFormat(locale, options).format(value);

  return (
    <I18nContext.Provider
      value={{
        locale,
        locales: supportedLocales,
        isReady,
        setLocale,
        t,
        formatDate,
        formatNumber,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider");
  }
  return context;
};
