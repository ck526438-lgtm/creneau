import { db } from './db';
import { generateSlots } from './slots';
import {
  sendMail,
  bookingConfirmationMail,
  hostNotificationMail,
  hostRescheduleMail,
  cancellationMail,
} from './mail';
import { buildIcs } from './ics';
import { formatRange, isValidTimeZone } from './time';
import { locationLabel } from './constants';
import type { Booking, Service, User } from '@prisma/client';

export type HostBundle = {
  user: User;
  service: Service & { user: User };
  rules: { weekday: number; startMin: number; endMin: number }[];
};

/**
 * Verrou par hôte : la vérification « créneau libre » et l'écriture de la réservation s'exécutent
 * l'une après l'autre pour un même agenda. SQLite impose une seule instance du serveur, donc un
 * verrou en mémoire suffit à empêcher deux clients simultanés de prendre le même créneau.
 */
const hostLocks = new Map<string, Promise<unknown>>();

export async function withHostLock<T>(hostId: string, task: () => Promise<T>): Promise<T> {
  const previous = hostLocks.get(hostId) ?? Promise.resolve();
  const run = previous.then(task, task);
  const tail = run.catch(() => undefined);
  hostLocks.set(hostId, tail);
  try {
    return await run;
  } finally {
    if (hostLocks.get(hostId) === tail) hostLocks.delete(hostId);
  }
}

export function visitorZone(booking: Pick<Booking, 'visitorTz'>, host: Pick<User, 'timezone'>) {
  return booking.visitorTz && isValidTimeZone(booking.visitorTz) ? booking.visitorTz : host.timezone;
}

export async function loadService(serviceId: string): Promise<HostBundle | null> {
  const service = await db.service.findUnique({ where: { id: serviceId }, include: { user: true } });
  if (!service || !service.active) return null;
  const rules = await db.availability.findMany({ where: { userId: service.userId } });
  return { user: service.user, service, rules };
}

export function locationText(service: Pick<Service, 'locationKind' | 'locationValue' | 'id'>, host: User) {
  const value = service.locationValue.trim();
  switch (service.locationKind) {
    case 'VIDEO':
      return value || `Visioconférence — le lien sera envoyé par ${host.name}`;
    case 'OFFICE':
      return value || `Sur place — adresse communiquée par ${host.name}`;
    default:
      return `Appel téléphonique de ${host.name}`;
  }
}

async function conflictFree(
  bundle: HostBundle,
  startsAt: Date,
  ignoreBookingId?: string,
): Promise<boolean> {
  const windowEnd = new Date(startsAt.getTime() + (bundle.service.durationMin + 240) * 60_000);
  const [bookings, busy] = await Promise.all([
    db.booking.findMany({
      where: {
        userId: bundle.user.id,
        status: { not: 'CANCELLED' },
        endsAt: { gte: new Date(startsAt.getTime() - 12 * 3600_000) },
        startsAt: { lte: windowEnd },
      },
    }),
    db.busySlot.findMany({
      where: {
        userId: bundle.user.id,
        endsAt: { gte: new Date(startsAt.getTime() - 12 * 3600_000) },
        startsAt: { lte: windowEnd },
      },
    }),
  ]);
  const relevantBookings = bookings.filter((b) => b.id !== ignoreBookingId);
  const map = generateSlots({
    timezone: bundle.user.timezone,
    service: bundle.service,
    rules: bundle.rules,
    bookings: relevantBookings,
    busy,
    minNoticeMin: bundle.user.minNoticeMin,
    daysAhead: bundle.user.maxDaysAhead,
  });
  for (const list of map.values()) {
    if (list.some((s) => s.startsAt.getTime() === startsAt.getTime())) return true;
  }
  return false;
}

export type BookingResult = { ok: true; booking: Booking } | { ok: false; error: string };

export async function createBooking(input: {
  serviceId: string;
  startsAt: string;
  visitorName: string;
  visitorEmail: string;
  visitorPhone?: string;
  visitorNotes?: string;
  visitorTz?: string;
}): Promise<BookingResult> {
  const bundle = await loadService(input.serviceId);
  if (!bundle) return { ok: false, error: 'Cette prestation n’est plus disponible.' };

  const startsAt = new Date(input.startsAt);
  if (Number.isNaN(startsAt.getTime())) return { ok: false, error: 'Créneau invalide.' };

  if (bundle.user.requirePhone && !(input.visitorPhone ?? '').trim()) {
    return { ok: false, error: 'Le numéro de téléphone est obligatoire pour ce rendez-vous.' };
  }

  const created = await withHostLock(bundle.user.id, async () => {
    if (!(await conflictFree(bundle, startsAt))) return null;
    return db.booking.create({
    data: {
      userId: bundle.user.id,
      serviceId: bundle.service.id,
      visitorName: input.visitorName.trim(),
      visitorEmail: input.visitorEmail.trim().toLowerCase(),
      visitorPhone: (input.visitorPhone ?? '').trim(),
      visitorNotes: (input.visitorNotes ?? '').trim(),
      visitorTz: input.visitorTz ?? '',
      startsAt,
      endsAt: new Date(startsAt.getTime() + bundle.service.durationMin * 60_000),
      status: 'CONFIRMED',
    },
    });
  });
  if (!created) {
    return { ok: false, error: 'Ce créneau vient tout juste d’être réservé. Choisissez-en un autre.' };
  }

  await notifyBookingCreated(created, bundle);
  return { ok: true, booking: created };
}

export async function rescheduleBooking(
  bookingId: string,
  startsAtIso: string,
): Promise<BookingResult> {
  const existing = await db.booking.findUnique({ where: { id: bookingId } });
  if (!existing || existing.status === 'CANCELLED') {
    return { ok: false, error: 'Ce rendez-vous n’est plus modifiable.' };
  }
  if (existing.startsAt.getTime() <= Date.now()) {
    return { ok: false, error: 'Ce rendez-vous est déjà passé.' };
  }
  const bundle = await loadService(existing.serviceId);
  if (!bundle) return { ok: false, error: 'Prestation introuvable.' };

  const startsAt = new Date(startsAtIso);
  if (Number.isNaN(startsAt.getTime())) return { ok: false, error: 'Créneau invalide.' };

  const booking = await withHostLock(bundle.user.id, async () => {
    if (!(await conflictFree(bundle, startsAt, bookingId))) return null;
    return db.booking.update({
      where: { id: bookingId },
      data: {
        startsAt,
        endsAt: new Date(startsAt.getTime() + bundle.service.durationMin * 60_000),
        remindSentAt: null,
      },
    });
  });
  if (!booking) return { ok: false, error: 'Ce créneau n’est plus disponible.' };

  const when = formatRange(booking.startsAt, booking.endsAt, visitorZone(booking, bundle.user));
  const mail = bookingConfirmationMail({
    hostName: bundle.user.name,
    brandColor: bundle.user.brandColor,
    serviceTitle: bundle.service.title,
    when,
    location: locationText(bundle.service, bundle.user),
    visitorName: booking.visitorName,
    notes: booking.visitorNotes,
    cancelUrl: cancelUrl(booking.cancelToken),
    icsUrl: `${appUrl()}/api/ics/${booking.id}`,
  });
  await sendMail({ to: booking.visitorEmail, subject: `RDV reprogrammé : ${bundle.service.title}`, html: mail.html });
  await sendMail({
    to: bundle.user.email,
    ...hostRescheduleMail({
      brandColor: bundle.user.brandColor,
      visitorName: booking.visitorName,
      serviceTitle: bundle.service.title,
      before: formatRange(existing.startsAt, existing.endsAt, bundle.user.timezone),
      after: formatRange(booking.startsAt, booking.endsAt, bundle.user.timezone),
    }),
  });
  return { ok: true, booking };
}

export function cancelUrl(token: string) {
  return `${appUrl()}/r/${token}`;
}

export function appUrl() {
  return (process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}

export async function notifyBookingCreated(booking: Booking, bundle: HostBundle) {
  const when = formatRange(booking.startsAt, booking.endsAt, visitorZone(booking, bundle.user));
  const hostView = formatRange(booking.startsAt, booking.endsAt, bundle.user.timezone);
  const location = locationText(bundle.service, bundle.user);

  await sendMail({
    to: booking.visitorEmail,
    ...bookingConfirmationMail({
      hostName: bundle.user.name,
      brandColor: bundle.user.brandColor,
      serviceTitle: bundle.service.title,
      when,
      location,
      visitorName: booking.visitorName,
      notes: booking.visitorNotes,
      cancelUrl: cancelUrl(booking.cancelToken),
      icsUrl: `${appUrl()}/api/ics/${booking.id}`,
    }),
  });

  await sendMail({
    to: bundle.user.email,
    ...hostNotificationMail({
      brandColor: bundle.user.brandColor,
      hostName: bundle.user.name,
      visitorName: booking.visitorName,
      visitorEmail: booking.visitorEmail,
      visitorPhone: booking.visitorPhone,
      serviceTitle: bundle.service.title,
      when: hostView,
      notes: booking.visitorNotes,
    }),
  });
}

export async function cancelBookingByToken(token: string, reason: 'visitor' | 'host' = 'visitor') {
  const booking = await db.booking.findUnique({
    where: { cancelToken: token },
    include: { service: { include: { user: true } } },
  });
  if (!booking) return { ok: false as const, error: 'Rendez-vous introuvable ou déjà annulé.' };
  if (booking.status === 'CANCELLED') return { ok: true as const, already: true };
  if (reason === 'visitor' && booking.startsAt.getTime() <= Date.now()) {
    return { ok: false as const, error: 'Ce rendez-vous est déjà passé.' };
  }

  await db.booking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } });

  const user = booking.service.user;
  const cancelledBy = reason === 'visitor' ? booking.visitorName : user.name;

  // Un seul email par personne, chacun dans son propre fuseau.
  await sendMail({
    to: booking.visitorEmail,
    ...cancellationMail({
      brandColor: user.brandColor,
      greeting: booking.visitorName,
      serviceTitle: booking.service.title,
      when: formatRange(booking.startsAt, booking.endsAt, visitorZone(booking, user)),
      hostName: user.name,
      cancelledBy,
      rebookUrl: `${appUrl()}/b/${user.slug}`,
    }),
  });
  await sendMail({
    to: user.email,
    ...cancellationMail({
      brandColor: user.brandColor,
      greeting: user.name,
      serviceTitle: `${booking.service.title} — ${booking.visitorName}`,
      when: formatRange(booking.startsAt, booking.endsAt, user.timezone),
      hostName: user.name,
      cancelledBy: reason === 'visitor' ? booking.visitorName : 'vous',
    }),
  });

  return { ok: true as const };
}

export function bookingIcs(booking: Booking & { service: Service }, user: User, method: 'REQUEST' | 'CANCEL' = 'REQUEST') {
  return buildIcs({
    uid: booking.id,
    summary: `${booking.service.title} — ${user.name}`,
    description: `Réservé par ${booking.visitorName} (${booking.visitorEmail}) via Creneau.`,
    location: locationText(booking.service, user),
    startsAt: new Date(booking.startsAt),
    endsAt: new Date(booking.endsAt),
    organizerEmail: user.email,
    attendeeEmail: booking.visitorEmail,
    attendeeName: booking.visitorName,
    method,
  });
}
