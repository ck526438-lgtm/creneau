import { db } from '../lib/db';
import { generateSlots } from '../lib/slots';
import { wallToUtc, utcToWall } from '../lib/time';
import { createBooking, rescheduleBooking, cancelBookingByToken, loadService, bookingIcs } from '../lib/bookings';

const ok = (label: string, cond: boolean, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'} — ${label}${extra ? ' :: ' + extra : ''}`);
  if (!cond) process.exitCode = 1;
};

async function main() {
  const host = await db.user.findUniqueOrThrow({ where: { slug: 'demo-cabinet' } });
  const service = await db.service.findFirstOrThrow({ where: { slug: 'seance-osteopathie', userId: host.id } });
  const rules = await db.availability.findMany({ where: { userId: host.id } });
  const bookings = await db.booking.findMany({ where: { userId: host.id, status: 'CONFIRMED' } });
  const busy = await db.busySlot.findMany({ where: { userId: host.id } });

  // 1. conversions de fuseau autour du changement d'heure (Paris passe à UTC+1 le 25/10/2026)
  const beforeDst = wallToUtc('Europe/Paris', 2026, 10, 20, 9 * 60);
  const afterDst = wallToUtc('Europe/Paris', 2026, 10, 27, 9 * 60);
  ok('9h Paris avant DST = 07:00Z', beforeDst.toISOString().startsWith('2026-10-20T07:00'), beforeDst.toISOString());
  ok('9h Paris après DST = 08:00Z', afterDst.toISOString().startsWith('2026-10-27T08:00'), afterDst.toISOString());
  ok('aller-retour wall', utcToWall(afterDst, 'Europe/Paris').minutesOfDay === 9 * 60);

  // 2. moteur de créneaux
  const map = generateSlots({ timezone: host.timezone, service, rules, bookings, busy });
  const all = [...map.values()].flat();
  ok('des créneaux sont générés', all.length > 0, `${all.length} créneaux`);
  ok('60 jours de marge max', all.every((s) => s.startsAt.getTime() < Date.now() + 61 * 86_400_000));
  ok('durée du RDV respectée', all.every((s) => s.endsAt.getTime() - s.startsAt.getTime() === service.durationMin * 60_000));
  const seeded = bookings.find((b) => new Date(b.startsAt).getTime() > Date.now());
  if (seeded) {
    ok('créneau déjà pris excluded', !all.some((s) => s.startsAt.getTime() === new Date(seeded.startsAt).getTime()));
    ok('marge avant protégée', !all.some((s) => {
      const end = s.endsAt.getTime();
      const withBuf = new Date(seeded.startsAt).getTime() - service.bufferBeforeMin * 60_000;
      return end > withBuf && s.startsAt.getTime() < new Date(seeded.endsAt).getTime() + service.bufferAfterMin * 60_000;
    }));
  }
  const busyDay = new Date(busy[0].startsAt);
  const busyKey = `${utcToWall(busyDay, host.timezone).year}-${String(utcToWall(busyDay, host.timezone).month).padStart(2, '0')}-${String(utcToWall(busyDay, host.timezone).day).padStart(2, '0')}`;
  ok('plage bloquée retirée', (map.get(busyKey) ?? []).length === 0, busyKey);
  const sundaySlots = all.filter((s) => utcToWall(s.startsAt, host.timezone).weekday === 0);
  ok('dimanche fermé (démo)', sundaySlots.length === 0);

  // 3. réservation + anti double-booking
  const target = all[3];
  const first = await createBooking({
    serviceId: service.id,
    startsAt: target.startsAt.toISOString(),
    visitorName: 'Test Unitaire',
    visitorEmail: 'test-unitaire@example.com',
    visitorPhone: '06 00 00 00 00',
    visitorNotes: 'crée par le script de contrôle',
    visitorTz: 'Europe/London',
  });
  ok('création de RDV', first.ok, first.ok ? '' : first.error);
  const dup = await createBooking({
    serviceId: service.id,
    startsAt: target.startsAt.toISOString(),
    visitorName: 'Test Doublon',
    visitorEmail: 'dup@example.com',
  });
  ok('double réservation refusée', !dup.ok, dup.ok ? 'accepté à tort' : (dup as any).error);

  // 4. reprogrammation
  if (first.ok) {
    const iso = all[6].startsAt.toISOString();
    const moved = await rescheduleBooking(first.booking.id, iso);
    ok('reprogrammation', moved.ok, moved.ok ? '' : moved.error);
    if (moved.ok) {
      ok('nouvelle heure appliquée', new Date(moved.booking.startsAt).toISOString() === iso);
    }
    // 5. annulation
    const cancelled = await cancelBookingByToken(first.booking.cancelToken, 'visitor');
    ok('annulation par token', cancelled.ok);
    const status = await db.booking.findUnique({ where: { id: first.booking.id } });
    ok('statut annulé en base', status?.status === 'CANCELLED');
    const again = await cancelBookingByToken(first.booking.cancelToken, 'visitor');
    ok('double annulation inoffensive', again.ok && 'already' in again);
  }

  // 6. ics
  const some = await db.booking.findFirst({ where: { userId: host.id }, include: { service: true } });
  if (some) {
    const ics = bookingIcs(some, host);
    ok('ICS valide', ics.includes('BEGIN:VCALENDAR') && ics.includes('DTSTART:') && ics.includes('END:VEVENT'));
  }

  // 7. nettoyage
  await db.booking.deleteMany({ where: { visitorEmail: { in: ['test-unitaire@example.com', 'dup@example.com'] } } });
  console.log('contrôles terminés, RDV de test supprimés');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(() => db.$disconnect());
