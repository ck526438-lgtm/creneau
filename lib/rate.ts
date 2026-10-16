import { headers } from 'next/headers';

const buckets = new Map<string, number[]>();

/** IP côté client (proxy/forwarded) ou 'local' en direct. */
export async function clientIp() {
  const h = await headers();
  const forwarded = h.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return h.get('x-real-ip') ?? 'local';
}

/**
 * Fenêtre glissante en mémoire : suffisant pour un serveur unique (SQLite impose une seule instance).
 * Retourne true quand le quota est dépassé.
 */
export function tooMuch(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return true;
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 2000) {
    for (const [k, v] of buckets) {
      if (!v.some((t) => now - t < windowMs)) buckets.delete(k);
    }
  }
  return false;
}
