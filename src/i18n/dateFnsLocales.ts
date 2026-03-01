import { fr } from 'date-fns/locale/fr';
import { enUS } from 'date-fns/locale/en-US';
import { de } from 'date-fns/locale/de';
import { it } from 'date-fns/locale/it';
import { es } from 'date-fns/locale/es';
import type { Locale as DateFnsLocale } from 'date-fns';
import type { Locale } from './types';

const dateFnsLocales: Record<Locale, DateFnsLocale> = {
  fr,
  en: enUS,
  de,
  it,
  es,
};

export default dateFnsLocales;
