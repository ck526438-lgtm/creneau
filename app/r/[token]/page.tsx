import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { formatRange, formatWall, isValidTimeZone } from '@/lib/time';
import { locationText } from '@/lib/bookings';
import { cancelByTokenAction } from '@/actions/booking';
import CancelTokenForm from '@/components/CancelTokenForm';
import Logo from '@/components/Logo';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ token: string }>; searchParams: Promise<{ status?: string }> };

export const metadata: Metadata = { title: 'Gérer mon rendez-vous — Creneau' };

export default async function ManageBookingPage(props: Props) {
  const [{ token }, { status }] = await Promise.all([props.params, props.searchParams]);
  const booking = await db.booking.findUnique({
    where: { cancelToken: token },
    include: { service: { include: { user: true } } },
  });

  if (!booking) {
    return (
      <Wrapper>
        <h1 className="text-xl font-bold text-ink-900">Lien invalide</h1>
        <p className="mt-2 text-[14px] text-ink-600">
          Ce lien de gestion de rendez-vous n’existe plus ou a déjà été utilisé.
        </p>
      </Wrapper>
    );
  }

  const host = booking.service.user;
  const tz = booking.visitorTz && isValidTimeZone(booking.visitorTz) ? booking.visitorTz : host.timezone;
  const cancelled = booking.status === 'CANCELLED';
  const when = formatRange(new Date(booking.startsAt), new Date(booking.endsAt), tz);

  return (
    <Wrapper>
      {cancelled ? (
        <>
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-ink-100 text-[20px]">🗑️</div>
          <h1 className="text-xl font-bold text-ink-900">Rendez-vous annulé</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-600">
            « {booking.service.title} » avec {host.name} du {when} est bien annulé. Personne n’a besoin d’être
            prévenu une seconde fois.
          </p>
          <a
            href={`/api/ics/${booking.id}`}
            className="btn-secondary mt-6"
            aria-label="Télécharger l'annulation au format agenda"
          >
            Retirer de mon agenda (.ics)
          </a>
        </>
      ) : (
        <>
          <p className="text-[13px] font-medium uppercase tracking-wide text-ink-500">Votre rendez-vous</p>
          <h1 className="mt-2 text-xl font-bold text-ink-900">{booking.service.title}</h1>
          <div className="mt-4 rounded-xl border border-ink-200 bg-ink-50 p-4 text-[14px] text-ink-700">
            <p className="font-semibold text-ink-900">{when}</p>
            <p className="mt-1 capitalize">Avec {host.name}</p>
            <p className="mt-1">{locationText(booking.service, host)}</p>
            {booking.visitorNotes && <p className="mt-2 text-[13px] italic">« {booking.visitorNotes} »</p>}
          </div>

          {status === 'cancelled' && (
            <p className="mt-4 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-[14px] text-emerald-700">
              Annulation prise en compte, {host.name} est prévenu par email.
            </p>
          )}
          {status === 'notfound' && (
            <p className="mt-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-[14px] text-rose-700">
              Ce rendez-vous n’était plus modifiable.
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/b/${host.slug}?token=${token}`} className="btn-primary" style={{ background: host.brandColor }}>
              Reprogrammer
            </Link>
            <CancelTokenForm action={cancelByTokenAction} token={token} />
          </div>
          <p className="mt-4 text-[12px] text-ink-500">
            Le créneau sera de nouveau réservé : {formatWall(new Date(booking.endsAt), tz, { hour: '2-digit', minute: '2-digit' })}
          </p>
        </>
      )}
    </Wrapper>
  );
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-ink-50 px-4 py-10 sm:py-16">
      <div className="pointer-events-none absolute -left-28 -top-28 h-72 w-72 animate-float-slow rounded-full bg-sage-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-24 h-72 w-72 animate-float rounded-full bg-copper-400/15 blur-3xl" />
      <div className="relative mx-auto max-w-lg">
        <div className="card animate-fade-up p-7 sm:p-8">{children}</div>
        <p className="mt-6 flex animate-fade-in items-center justify-center gap-1.5 text-[12px] text-ink-400 [animation-delay:400ms]">
          <Logo size={16} className="rounded-md ring-1 ring-black/5" />
          Creneau — gestion de rendez-vous
        </p>
      </div>
    </main>
  );
}
