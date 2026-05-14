import cs from "../locales/cs";

type TranslationKey = keyof typeof cs;

const translations: Record<string, Record<string, string>> = { cs };

export function useTranslation() {
  const locale = "cs";

  const t = (key: TranslationKey | string, params?: Record<string, string | number>): string => {
    let text = translations[locale]?.[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{${k}}`, String(v));
      }
    }
    return text;
  };

  return { t, locale };
}
