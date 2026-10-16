export const LOCATION_KINDS = [
  { value: 'VIDEO', label: 'Visioconférence', hint: 'Un lien que vous fournissez (Meet, Zoom, Teams…)' },
  { value: 'OFFICE', label: 'Sur place', hint: 'Adresse de votre cabinet, bureau ou boutique' },
  { value: 'PHONE', label: 'Par téléphone', hint: 'Vous appelez le client au numéro indiqué' },
] as const;

export type LocationKindValue = (typeof LOCATION_KINDS)[number]['value'];

export function locationLabel(kind: string) {
  return LOCATION_KINDS.find((k) => k.value === kind)?.label ?? 'Rendez-vous';
}

/** index = JS weekday (0 = dimanche), display order Monday-first */
export const WEEKDAYS = [
  { index: 1, short: 'Lun', long: 'Lundi' },
  { index: 2, short: 'Mar', long: 'Mardi' },
  { index: 3, short: 'Mer', long: 'Mercredi' },
  { index: 4, short: 'Jeu', long: 'Jeudi' },
  { index: 5, short: 'Ven', long: 'Vendredi' },
  { index: 6, short: 'Sam', long: 'Samedi' },
  { index: 0, short: 'Dim', long: 'Dimanche' },
];

export const SERVICE_COLORS = ['#4f46e5', '#0ea5e9', '#059669', '#d97706', '#db2777', '#7c3aed'];

export const DURATIONS = [15, 20, 30, 45, 60, 90, 120];

export function timeZones(): string[] {
  try {
    return (Intl as unknown as { supportedValuesOf(k: string): string[] }).supportedValuesOf('timeZone');
  } catch {
    return ['Europe/Paris', 'Europe/London', 'Europe/Lisbon', 'America/New_York', 'UTC'];
  }
}

export function slugify(input: string) {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

export function priceLabel(cents: number) {
  if (!cents) return 'Gratuit';
  return `${(cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: cents % 100 ? 2 : 0 })} €`;
}

export function toMinutes(value: string) {
  const [h, m] = value.split(':').map(Number);
  if (Number.isNaN(h)) return 0;
  return h * 60 + (Number.isNaN(m) ? 0 : m);
}

export function fromMinutes(minutes: number) {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
