import Link from 'next/link';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { formatWall, utcToWall, tzAbbrev } from '@/lib/time';
import { locationLabel, SERVICE_COLORS } from '@/lib/constants';
import { hostCancelAction } from '@/actions/booking';
import CancelBookingButton from '@/components/CancelBookingButton';

export const dynamic = 'force-dynamic';

function dayKey(d: Date, tz: string) {
  const w = utcToWall(d, tz);
  return `${w.year}-${String(w.month).padStart(2, '0')}-${String(w.day).padStart(2, '0')}`;
}

export default async function AgendaPage() {
  const user = await requireUser();
  const now = new Date();
  const [upcoming, services] = await Promise.all([
    db.booking.findMany({
      where: { userId: user.id, status: { not: 'CANCELLED' }, endsAt: { gte: now } },
      include: { service: true },
      orderBy: { startsAt: 'asc' },
      take: 60,
    }),
    db.service.count({ where: { userId: user.id } }),
  ]);

  const todayKey = dayKey(now, user.timezone);
  const groups = new Map<string, typeof upcoming>();
  for (const b of upcoming) {
    const key = dayKey(new Date(b.startsAt), user.timezone);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(b);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Agenda</h1>
          <p className="mt-1 text-[14px] text-ink-600">
            {upcoming.length} rendez-vous à venir · horaires en {user.timezone.replace(/_/g, ' ')} (
            {tzAbbrev(user.timezone, now)})
          </p>
        </div>
        <Link href="/dashboard/services" className="btn-secondary">
          Gérer mes prestations
        </Link>
      </div>

      {upcoming.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-[15px] font-semibold text-ink-900">Aucun rendez-vous pour l’instant</p>
          <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-ink-600">
            Partagez votre lien de réservation : dès qu’un client réserve, le créneau apparaît ici et
            la confirmation part toute seule.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href={`/b/${user.slug}`} className="btn-primary">
              Ouvrir ma page de réservation
            </Link>
            {services === 0 && (
              <Link href="/dashboard/services" className="btn-secondary">
                Créer une prestation
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {[...groups.entries()].map(([key, bookings]) => (
          <section key={key}>
            <h2 className="mb-2 flex items-center gap-2 text-[13px] font-semibold tracking-wide text-ink-500 uppercase">
              {formatWall(new Date(bookings[0].startsAt), user.timezone, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
              {key === todayKey && (
                <span className="rounded-full bg-ink-900 px-2 py-0.5 text-[11px] font-semibold text-white normal-case">
                  Aujourd’hui
                </span>
              )}
            </h2>
            <div className="card divide-y divide-ink-200">
              {bookings.map((b) => {
                const color = SERVICE_COLORS[b.service.colorIndex % SERVICE_COLORS.length];
                return (
                  <div key={b.id} className="flex flex-wrap items-center gap-4 p-4">
                    <span className="h-10 w-1 shrink-0 rounded-full" style={{ background: color }} />
                    <div className="w-16 shrink-0">
                      <p className="text-[15px] font-semibold text-ink-900">
                        {formatWall(new Date(b.startsAt), user.timezone, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <p className="text-[12px] text-ink-500">
                        {b.service.durationMin} min
                      </p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold text-ink-900">
                        {b.visitorName}
                      </p>
                      <p className="truncate text-[13px] text-ink-600">
                        {b.service.title} · {locationLabel(b.service.locationKind)}
                        {b.service.locationValue ? ` · ${b.service.locationValue}` : ''}
                      </p>
                      {b.visitorNotes && (
                        <p className="mt-1 truncate text-[13px] text-ink-500 italic">
                          « {b.visitorNotes} »
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[13px]">
                      <a
                        href={`mailto:${b.visitorEmail}`}
                        className="truncate text-ink-600 hover:text-ink-900"
                      >
                        {b.visitorEmail}
                      </a>
                      {b.visitorPhone && (
                        <a href={`tel:${b.visitorPhone}`} className="text-ink-600 hover:text-ink-900">
                          {b.visitorPhone}
                        </a>
                      )}
                      <a href={`/api/ics/${b.id}`} className="btn-ghost px-2 py-1 text-[13px]">
                        .ics
                      </a>
                      <CancelBookingButton action={hostCancelAction} id={b.id} label="Annuler" />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
