import type { Availability, Booking, BusySlot, Service } from '@prisma/client';
import { addDaysToWallDate, utcToWall, wallToUtc } from './time';

export type Slot = { startsAt: Date; endsAt: Date };

export const MAX_DAYS_AHEAD = 60;
export const MIN_LEAD_MIN = 60;
export const MAX_SLOTS_PER_DAY = 40;

type Rule = Pick<Availability, 'weekday' | 'startMin' | 'endMin'>;

function windowsOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
}

/** Booked/blocked UTC windows for a user, service buffers already applied. */
export function occupiedWindows(
  bookings: Pick<Booking, 'startsAt' | 'endsAt'>[],
  busy: Pick<BusySlot, 'startsAt' | 'endsAt'>[],
  service: Pick<Service, 'bufferBeforeMin' | 'bufferAfterMin'>,
) {
  const before = service.bufferBeforeMin * 60_000;
  const after = service.bufferAfterMin * 60_000;
  const mapped = [...bookings, ...busy].map((b) => ({
    start: new Date(b.startsAt).getTime() - before,
    end: new Date(b.endsAt).getTime() + after,
  }));
  return mapped;
}

export type GenerateInput = {
  timezone: string;
  service: Pick<Service, 'durationMin' | 'bufferBeforeMin' | 'bufferAfterMin'>;
  rules: Rule[];
  bookings: Pick<Booking, 'startsAt' | 'endsAt'>[];
  busy: Pick<BusySlot, 'startsAt' | 'endsAt'>[];
  now?: Date;
  daysAhead?: number;
};

/**
 * Slots are generated against the host's wall clock, so a 09:00-17:00 rule means
 * 09:00-17:00 in the host's timezone regardless of the visitor's timezone.
 */
export function generateSlots(input: GenerateInput): Map<string, Slot[]> {
  const now = input.now ?? new Date();
  const daysAhead = Math.min(input.daysAhead ?? MAX_DAYS_AHEAD, MAX_DAYS_AHEAD);
  const duration = Math.max(5, input.service.durationMin);
  const before = input.service.bufferBeforeMin * 60_000;
  const after = input.service.bufferAfterMin * 60_000;
  const occupied = occupiedWindows(input.bookings, input.busy, input.service);
  const leadCutoff = now.getTime() + MIN_LEAD_MIN * 60_000;
  const today = utcToWall(now, input.timezone);
  const result = new Map<string, Slot[]>();

  for (let offset = 0; offset < daysAhead; offset++) {
    const wallDay = addDaysToWallDate(today.year, today.month, today.day, offset);
    const dayStartUtc = wallToUtc(input.timezone, wallDay.year, wallDay.month, wallDay.day, 0);
    const weekday = utcToWall(new Date(dayStartUtc.getTime() + 12 * 3600_000), input.timezone)
      .weekday;
    const dayRules = input.rules.filter((r) => r.weekday === weekday);
    if (dayRules.length === 0) continue;

    const key = `${wallDay.year}-${String(wallDay.month).padStart(2, '0')}-${String(
      wallDay.day,
    ).padStart(2, '0')}`;
    const slots: Slot[] = [];

    for (const rule of dayRules) {
      const windowStart = Math.max(rule.startMin, 0);
      const windowEnd = Math.min(rule.endMin, 24 * 60);
      for (
        let m = windowStart;
        m + duration <= windowEnd && slots.length < MAX_SLOTS_PER_DAY;
        m += duration
      ) {
        const start = new Date(dayStartUtc.getTime() + m * 60_000);
        const end = new Date(start.getTime() + duration * 60_000);
        if (start.getTime() < leadCutoff) continue;
        const guardStart = start.getTime() - before;
        const guardEnd = end.getTime() + after;
        if (occupied.some((w) => windowsOverlap(guardStart, guardEnd, w.start, w.end))) continue;
        slots.push({ startsAt: start, endsAt: end });
      }
    }

    if (slots.length > 0) {
      slots.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
      result.set(key, slots);
    }
  }

  return result;
}

export function flattenSlots(map: Map<string, Slot[]>, limit = 50): Slot[] {
  const all: Slot[] = [];
  for (const list of map.values()) all.push(...list);
  all.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  return all.slice(0, limit);
}
