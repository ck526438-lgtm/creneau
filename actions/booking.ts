'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { cancelBookingByToken, createBooking, rescheduleBooking, type BookingResult } from '@/lib/bookings';
import { clientIp, tooMuch } from '@/lib/rate';

const visitorSchema = z.object({
  serviceId: z.string().min(1),
  startsAt: z.string().min(1, 'Choisissez un créneau.'),
  visitorName: z.string().trim().min(2, 'Indiquez votre nom.').max(100, 'Nom trop long.'),
  visitorEmail: z.string().trim().toLowerCase().email('Adresse email invalide.').max(200),
  visitorPhone: z
    .string()
    .trim()
    .max(30, 'Numéro de téléphone trop long.')
    .regex(/^[+0-9 ().-]*$/, 'Numéro de téléphone invalide.')
    .default(''),
  visitorNotes: z.string().trim().max(1000, 'Message trop long (1000 caractères max).').default(''),
  visitorTz: z.string().max(64).default(''),
});

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
  const parsed = visitorSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Formulaire incomplet.' };
  const v = parsed.data;

  if (!input.rescheduleToken) {
    const ip = await clientIp();
    if (tooMuch(`book:${ip}:${input.serviceId}`, 10, 10 * 60_000)) {
      return { ok: false, error: 'Trop de tentatives depuis votre connexion. Réessayez dans quelques minutes.' };
    }
    return createBooking(v);
  }

  const ip = await clientIp();
  if (tooMuch(`reschedule:${ip}`, 10, 10 * 60_000)) {
    return { ok: false, error: 'Trop de tentatives depuis votre connexion. Réessayez dans quelques minutes.' };
  }
  const booking = await db.booking.findUnique({ where: { cancelToken: input.rescheduleToken } });
  if (!booking || booking.serviceId !== v.serviceId) {
    return { ok: false, error: 'Lien de reprogrammation invalide.' };
  }
  return rescheduleBooking(booking.id, v.startsAt);
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
