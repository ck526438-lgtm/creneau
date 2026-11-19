import { db } from '../lib/db';
import { generateSlots } from '../lib/slots';
import { wallToUtc, utcToWall } from '../lib/time';
import { createBooking, rescheduleBooking, cancelBookingByToken, bookingIcs } from '../lib/bookings';
import { parsePrice, priceLabel, whatsappLink } from '../lib/constants';

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

  // 7. deux clients cliquent au même instant sur le même créneau : un seul passe
  const race = all[10];
  const racers = await Promise.all(
    ['race-a@example.com', 'race-b@example.com', 'race-c@example.com'].map((email) =>
      createBooking({ serviceId: service.id, startsAt: race.startsAt.toISOString(), visitorName: 'Course', visitorEmail: email }),
    ),
  );
  ok('réservations simultanées : une seule acceptée', racers.filter((r) => r.ok).length === 1, `${racers.filter((r) => r.ok).length} acceptées`);

  // 8. règles de l'hôte : délai de prévenance et horizon
  const strict = generateSlots({ timezone: host.timezone, service, rules, bookings, busy, minNoticeMin: 48 * 60, daysAhead: 7 });
  const strictAll = [...strict.values()].flat();
  ok('délai de prévenance 48 h respecté', strictAll.every((s) => s.startsAt.getTime() >= Date.now() + 48 * 3600_000 - 60_000));
  ok('horizon 7 jours respecté', strictAll.every((s) => s.startsAt.getTime() < Date.now() + 8 * 86_400_000), `${strictAll.length} créneaux`);

  // 9. téléphone obligatoire
  await db.user.update({ where: { id: host.id }, data: { requirePhone: true } });
  const noPhone = await createBooking({ serviceId: service.id, startsAt: all[12].startsAt.toISOString(), visitorName: 'Sans Tel', visitorEmail: 'race-a@example.com' });
  ok('téléphone obligatoire appliqué côté serveur', !noPhone.ok);
  await db.user.update({ where: { id: host.id }, data: { requirePhone: false } });

  // 10. RDV passé : plus annulable ni reprogrammable par le client
  const past = await db.booking.create({
    data: { userId: host.id, serviceId: service.id, visitorName: 'Passé', visitorEmail: 'race-b@example.com', startsAt: new Date(Date.now() - 2 * 3600_000), endsAt: new Date(Date.now() - 3600_000) },
  });
  ok('RDV passé non annulable par le client', !(await cancelBookingByToken(past.cancelToken, 'visitor')).ok);
  ok('RDV passé non reprogrammable', !(await rescheduleBooking(past.id, all[14].startsAt.toISOString())).ok);

  // 11. prix et devises
  ok('prix FCFA', priceLabel(1_500_000, 'XOF') === '15 000 FCFA', priceLabel(1_500_000, 'XOF'));
  ok('prix euro avec centimes', priceLabel(4990, 'EUR') === '49,90 €', priceLabel(4990, 'EUR'));
  ok('saisie de prix', parsePrice('15 000') === 1_500_000 && parsePrice('49,90') === 4990 && Number.isNaN(parsePrice('abc')));
  ok('lien WhatsApp international', whatsappLink('+225 07 08 09 10 11') === 'https://wa.me/2250708091011');
  ok('pas de lien WhatsApp sans indicatif', whatsappLink('07 08 09 10 11') === null);

  // 12. nettoyage
  await db.booking.deleteMany({
    where: {
      visitorEmail: {
        in: ['test-unitaire@example.com', 'dup@example.com', 'race-a@example.com', 'race-b@example.com', 'race-c@example.com'],
      },
    },
  });
  console.log('contrôles terminés, RDV de test supprimés');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(() => db.$disconnect());
