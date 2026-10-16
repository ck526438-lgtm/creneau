'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { cancelBookingByToken, createBooking, rescheduleBooking, type BookingResult } from '@/lib/bookings';
import { clientIp, tooMuch } from '@/lib/rate';

export async function createBookingAction(input: {
  serviceId: string;
  startsAt: string;
  visitorName: string;
  visitorEmail: string;
  visitorPhone: string;
  visitorNotes: string;
  visitorTz: string;
  rescheduleToken?: string;
}): Promise<BookingResult> {
  if (!input.rescheduleToken) {
    const ip = await clientIp();
    if (tooMuch(`book:${ip}:${input.serviceId}`, 10, 10 * 60_000)) {
      return { ok: false, error: 'Trop de tentatives depuis votre connexion. Réessayez dans quelques minutes.' };
    }
    return createBooking({
      serviceId: input.serviceId,
      startsAt: input.startsAt,
      visitorName: input.visitorName,
      visitorEmail: input.visitorEmail,
      visitorPhone: input.visitorPhone,
      visitorNotes: input.visitorNotes,
      visitorTz: input.visitorTz,
    });
  }

  const booking = await db.booking.findUnique({ where: { cancelToken: input.rescheduleToken } });
  if (!booking) return { ok: false, error: 'Lien de reprogrammation invalide.' };
  return rescheduleBooking(booking.id, input.startsAt);
}

export async function cancelByTokenAction(token: string) {
  const result = await cancelBookingByToken(token, 'visitor');
  revalidatePath('/dashboard');
  if (!result.ok) redirect(`/r/${token}?status=notfound`);
  redirect(`/r/${token}?status=cancelled`);
}

export async function hostCancelAction(bookingId: string) {
  const user = await requireUser();
  const booking = await db.booking.findFirst({ where: { id: bookingId, userId: user.id } });
  if (!booking) return;
  await cancelBookingByToken(booking.cancelToken, 'host');
  revalidatePath('/dashboard');
}
