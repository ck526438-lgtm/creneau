import { db } from './db';
import { generateSlots } from './slots';
import { sendMail, bookingConfirmationMail, hostNotificationMail, cancellationMail, escapeHtml } from './mail';
import { buildIcs } from './ics';
import { formatRange, isValidTimeZone } from './time';
import { locationLabel } from './constants';
import type { Booking, Service, User } from '@prisma/client';

export type HostBundle = {
  user: User;
  service: Service & { user: User };
  rules: { weekday: number; startMin: number; endMin: number }[];
};

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

  if (!(await conflictFree(bundle, startsAt))) {
    return { ok: false, error: 'Ce créneau vient tout juste d’être réservé. Choisissez-en un autre.' };
  }

  const booking = await db.booking.create({
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

  await notifyBookingCreated(booking, bundle);
  return { ok: true, booking };
}

export async function rescheduleBooking(
  bookingId: string,
  startsAtIso: string,
): Promise<BookingResult> {
  const existing = await db.booking.findUnique({ where: { id: bookingId } });
  if (!existing || existing.status === 'CANCELLED') {
    return { ok: false, error: 'Ce rendez-vous n’est plus modifiable.' };
  }
  const bundle = await loadService(existing.serviceId);
  if (!bundle) return { ok: false, error: 'Prestation introuvable.' };

  const startsAt = new Date(startsAtIso);
  if (Number.isNaN(startsAt.getTime())) return { ok: false, error: 'Créneau invalide.' };
  if (!(await conflictFree(bundle, startsAt, bookingId))) {
    return { ok: false, error: 'Ce créneau n’est plus disponible.' };
  }

  const booking = await db.booking.update({
    where: { id: bookingId },
    data: {
      startsAt,
      endsAt: new Date(startsAt.getTime() + bundle.service.durationMin * 60_000),
      remindSentAt: null,
    },
  });

  const visitorTz =
    booking.visitorTz && isValidTimeZone(booking.visitorTz) ? booking.visitorTz : bundle.user.timezone;
  const when = formatRange(booking.startsAt, booking.endsAt, visitorTz);
  await sendMail({
    to: booking.visitorEmail,
    subject: `RDV reprogrammé : ${bundle.service.title}`,
    html: bookingConfirmationMail({
      hostName: bundle.user.name,
      brandColor: bundle.user.brandColor,
      serviceTitle: bundle.service.title,
      when,
      location: locationText(bundle.service, bundle.user),
      visitorName: booking.visitorName,
      notes: booking.visitorNotes,
      cancelUrl: cancelUrl(booking.cancelToken),
      icsUrl: `${appUrl()}/api/ics/${booking.id}`,
    }).html,
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
  const visitorTz =
    booking.visitorTz && isValidTimeZone(booking.visitorTz) ? booking.visitorTz : bundle.user.timezone;
  const when = formatRange(booking.startsAt, booking.endsAt, visitorTz);
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

  await db.booking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } });

  const user = booking.service.user;
  const when = formatRange(booking.startsAt, booking.endsAt, user.timezone);
  const target = reason === 'visitor' ? user.email : booking.visitorEmail;

  await sendMail({
    to: target,
    ...cancellationMail({
      brandColor: user.brandColor,
      visitorName: reason === 'visitor' ? user.name : booking.visitorName,
      serviceTitle: booking.service.title,
      when,
      hostName: user.name,
    }),
  });

  await sendMail({
    to: reason === 'visitor' ? booking.visitorEmail : user.email,
    subject: `RDV annulé : ${booking.service.title}`,
    html: `<p>Le rendez-vous <strong>${escapeHtml(booking.service.title)}</strong> du <strong>${escapeHtml(when)}</strong> a été annulé.</p>`,
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
