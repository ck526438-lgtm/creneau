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

/** Devises proposées : zone euro, Afrique francophone (FCFA, dirham, dinar…), Amérique du Nord, Suisse. */
export const CURRENCIES = [
  { code: 'EUR', label: 'Euro (€)', decimals: 2 },
  { code: 'XOF', label: 'Franc CFA BCEAO (Côte d’Ivoire, Sénégal, Mali, Burkina, Bénin, Togo, Niger)', decimals: 0 },
  { code: 'XAF', label: 'Franc CFA BEAC (Cameroun, Gabon, Congo, Tchad, Centrafrique)', decimals: 0 },
  { code: 'MAD', label: 'Dirham marocain', decimals: 2 },
  { code: 'TND', label: 'Dinar tunisien', decimals: 3 },
  { code: 'DZD', label: 'Dinar algérien', decimals: 2 },
  { code: 'GNF', label: 'Franc guinéen', decimals: 0 },
  { code: 'CDF', label: 'Franc congolais', decimals: 2 },
  { code: 'MGA', label: 'Ariary malgache', decimals: 0 },
  { code: 'CHF', label: 'Franc suisse', decimals: 2 },
  { code: 'CAD', label: 'Dollar canadien', decimals: 2 },
  { code: 'USD', label: 'Dollar américain', decimals: 2 },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]['code'];

export function isCurrency(code: string): code is CurrencyCode {
  return CURRENCIES.some((c) => c.code === code);
}

/**
 * Les prix sont stockés en centièmes (priceCents = montant × 100), quelle que soit la devise :
 * 15 000 FCFA → 1 500 000. L'affichage arrondit selon la devise (pas de centimes en FCFA).
 */
export function priceLabel(cents: number, currency = 'EUR') {
  if (!cents) return 'Gratuit';
  const code = isCurrency(currency) ? currency : 'EUR';
  const amount = cents / 100;
  const label =
    code === 'XOF' || code === 'XAF'
      ? `${Math.round(amount).toLocaleString('fr-FR')} FCFA`
      : new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: code,
          minimumFractionDigits: Number.isInteger(amount) ? 0 : undefined,
        }).format(amount);
  // Intl utilise des espaces insécables fines : on les normalise pour les emails et les PDF.
  return label.replace(/[\u202f\u00a0]/g, ' ');
}

/** Montant saisi par l'hôte (« 15000 », « 49,90 ») → centièmes. NaN si illisible. */
export function parsePrice(input: string) {
  const cleaned = input.replace(/[\s\u202f\u00a0]/g, '').replace(',', '.');
  if (cleaned === '') return 0;
  if (!/^\d+(\.\d{1,3})?$/.test(cleaned)) return Number.NaN;
  return Math.round(Number(cleaned) * 100);
}

/** Délais de prévenance proposés (minutes). */
export const NOTICE_OPTIONS = [
  { value: 0, label: 'Aucun' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 heure' },
  { value: 120, label: '2 heures' },
  { value: 240, label: '4 heures' },
  { value: 720, label: '12 heures' },
  { value: 1440, label: '24 heures' },
  { value: 2880, label: '48 heures' },
];

/** Horizons de réservation proposés (jours). */
export const HORIZON_OPTIONS = [7, 14, 30, 60, 90, 180, 365];

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

/** centièmes → valeur du champ de saisie (« 15000 », « 49,9 »). */
export function priceInput(cents: number) {
  if (!cents) return '';
  return String(cents / 100).replace('.', ',');
}

/**
 * Lien WhatsApp (wa.me) pour un numéro au format international (+225…, 00225…).
 * Sans indicatif pays, on ne devine pas : retourne null.
 */
export function whatsappLink(phone: string, text = '') {
  const trimmed = phone.trim();
  if (!/^(\+|00)/.test(trimmed)) return null;
  const digits = trimmed.replace(/^00/, '').replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) return null;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}
