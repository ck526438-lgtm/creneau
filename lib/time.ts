export type WallParts = {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  weekday: number; // 0 = dimanche
  minutesOfDay: number;
};

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function formatter(tz: string) {
  let f = formatterCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hourCycle: 'h23',
      weekday: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatterCache.set(tz, f);
  }
  return f;
}

const WEEKDAYS: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export function isValidTimeZone(tz: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function utcToWall(date: Date, tz: string): WallParts {
  const parts = formatter(tz).formatToParts(date);
  const get = (t: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === t)?.value ?? '';
  const hour = Number(get('hour')) % 24;
  const minute = Number(get('minute'));
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    hour,
    minute,
    weekday: WEEKDAYS[get('weekday').slice(0, 3)] ?? 1,
    minutesOfDay: hour * 60 + minute,
  };
}

function naiveMs(y: number, mo: number, d: number, h: number, mi: number) {
  return Date.UTC(y, mo - 1, d, h, mi, 0, 0);
}

/** Wall-clock time in `tz` -> UTC instant. Converges in two passes for DST edges. */
export function wallToUtc(tz: string, y: number, mo: number, d: number, minutesOfDay: number): Date {
  const h = Math.floor(minutesOfDay / 60);
  const mi = minutesOfDay % 60;
  const target = naiveMs(y, mo, d, h, mi);
  let guess = Date.UTC(y, mo - 1, d, h, mi);
  for (let i = 0; i < 3; i++) {
    const w = utcToWall(new Date(guess), tz);
    const actual = naiveMs(w.year, w.month, w.day, w.hour, w.minute);
    if (actual === target) break;
    guess += target - actual;
  }
  return new Date(guess);
}

/** Wall date `y-mo-d` in tz, returned as the UTC instant of that local day at 00:00. */
export function localDayStartUtc(tz: string, y: number, mo: number, d: number) {
  return wallToUtc(tz, y, mo, d, 0);
}

export function addDaysToWallDate(y: number, mo: number, d: number, delta: number) {
  const dt = new Date(Date.UTC(y, mo - 1, d));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return {
    year: dt.getUTCFullYear(),
    month: dt.getUTCMonth() + 1,
    day: dt.getUTCDate(),
  };
}

export function wallDayKey(y: number, mo: number, d: number) {
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function formatWall(date: Date, tz: string, opts: Intl.DateTimeFormatOptions) {
  try {
    return new Intl.DateTimeFormat('fr-FR', { timeZone: tz, ...opts }).format(date);
  } catch {
    return new Intl.DateTimeFormat('fr-FR', opts).format(date);
  }
}

export function formatRange(startsAt: Date, endsAt: Date, tz: string) {
  const day = formatWall(startsAt, tz, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const t1 = formatWall(startsAt, tz, { hour: '2-digit', minute: '2-digit' });
  const t2 = formatWall(endsAt, tz, { hour: '2-digit', minute: '2-digit' });
  return `${day} à ${t1} – ${t2}`;
}

export function tzAbbrev(tz: string, date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    timeZoneName: 'short',
  }).formatToParts(date);
  return parts.find((p) => p.type === 'timeZoneName')?.value ?? tz;
}
