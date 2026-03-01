import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { Locale, TranslationKeys } from './types';
import frTranslations from './translations/fr';
import dateFnsLocales from './dateFnsLocales';
import type { Locale as DateFnsLocale } from 'date-fns';

const STORAGE_KEY = 'app-locale';

const translations: Record<Locale, TranslationKeys> = {
  fr: frTranslations,
  // Lazy-loaded — filled on demand
  en: undefined as unknown as TranslationKeys,
  de: undefined as unknown as TranslationKeys,
  it: undefined as unknown as TranslationKeys,
  es: undefined as unknown as TranslationKeys,
};

// Eager-load all translations (they're small ~200 keys each)
import('./translations/en').then(m => { translations.en = m.default; });
import('./translations/de').then(m => { translations.de = m.default; });
import('./translations/it').then(m => { translations.it = m.default; });
import('./translations/es').then(m => { translations.es = m.default; });

function detectBrowserLocale(): Locale {
  const lang = navigator.language.split('-')[0];
  if (['fr', 'en', 'de', 'it', 'es'].includes(lang)) return lang as Locale;
  return 'fr';
}

function getInitialLocale(): Locale {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && ['fr', 'en', 'de', 'it', 'es'].includes(stored)) return stored as Locale;
  return detectBrowserLocale();
}

type TranslationKey = keyof TranslationKeys;

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  tp: (key: TranslationKey, count: number, params?: Record<string, string | number>) => string;
  dateFnsLocale: DateFnsLocale;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function interpolate(str: string, params?: Record<string, string | number>): string {
  if (!params) return str;
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => String(params[key] ?? `{{${key}}}`));
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const t = useCallback((key: TranslationKey, params?: Record<string, string | number>): string => {
    const dict = translations[locale] ?? translations.fr;
    const raw = dict[key] ?? translations.fr[key] ?? key;
    return interpolate(raw, params);
  }, [locale]);

  const tp = useCallback((key: TranslationKey, count: number, params?: Record<string, string | number>): string => {
    const dict = translations[locale] ?? translations.fr;
    const raw = dict[key] ?? translations.fr[key] ?? key;
    const parts = raw.split('|');
    let selected: string;
    if (parts.length === 3) {
      // "zero|singular|plural"
      selected = count === 0 ? parts[0] : count === 1 ? parts[1] : parts[2];
    } else if (parts.length === 2) {
      // "singular|plural"
      selected = count <= 1 ? parts[0] : parts[1];
    } else {
      selected = raw;
    }
    return interpolate(selected, { count, ...params });
  }, [locale]);

  const dateFnsLocale = useMemo(() => dateFnsLocales[locale], [locale]);

  const value = useMemo<I18nContextValue>(() => ({
    locale,
    setLocale,
    t,
    tp,
    dateFnsLocale,
  }), [locale, setLocale, t, tp, dateFnsLocale]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
