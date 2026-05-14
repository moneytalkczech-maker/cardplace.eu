import cs from "../locales/cs";
import en from "../locales/en";

const locales: Record<string, Record<string, string>> = { cs, en };

function detectLocale(): string {
  if (typeof window === "undefined") return "cs";
  const stored = localStorage.getItem("locale");
  if (stored && locales[stored]) return stored;
  const browserLang = navigator.language?.split("-")[0];
  if (browserLang && locales[browserLang]) return browserLang;
  return "cs";
}

export function useTranslation() {
  const locale = detectLocale();

  const t = (key: string, params?: Record<string, string | number>): string => {
    let text = locales[locale]?.[key] ?? locales["cs"]?.[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{${k}}`, String(v));
      }
    }
    return text;
  };

  const setLocale = (lang: string) => {
    if (locales[lang]) {
      localStorage.setItem("locale", lang);
      window.location.reload();
    }
  };

  return { t, locale, setLocale };
}
