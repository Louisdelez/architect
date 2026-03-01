const LOCALE_MAP: Record<string, string> = {
  fr: 'fr-FR',
  en: 'en-US',
  de: 'de-DE',
  it: 'it-IT',
  es: 'es-ES',
};

export function formatTimestamp(iso: string, locale?: string): string {
  const d = new Date(iso);
  const loc = LOCALE_MAP[locale ?? 'fr'] ?? 'fr-FR';
  return d.toLocaleDateString(loc, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
