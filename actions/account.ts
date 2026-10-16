'use server';

import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { currentUser, destroySession, verifyPassword } from '@/lib/auth';
import { cancellationMail, sendMail } from '@/lib/mail';
import { formatRange } from '@/lib/time';

export type AccountState = { error?: string };

export async function deleteAccountAction(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const user = await currentUser();
  if (!user) return { error: 'Session expirée, reconnectez-vous.' };

  const password = String(formData.get('password') ?? '');
  if (!password) return { error: 'Saisissez votre mot de passe pour confirmer.' };
  if (!(await verifyPassword(password, user.passwordHash))) return { error: 'Mot de passe incorrect.' };

  const upcoming = await db.booking.findMany({
    where: { userId: user.id, status: { not: 'CANCELLED' }, endsAt: { gt: new Date() } },
    include: { service: true },
    orderBy: { startsAt: 'asc' },
  });

  if (upcoming.length > 0 && formData.get('confirmUpcoming') !== 'on') {
    return {
      error: `${upcoming.length} rendez-vous à venir seront annulés et vos clients prévenus par email. Cochez la case pour confirmer.`,
    };
  }

  for (const booking of upcoming) {
    await sendMail({
      to: booking.visitorEmail,
      ...cancellationMail({
        brandColor: user.brandColor,
        visitorName: booking.visitorName,
        serviceTitle: booking.service.title,
        when: formatRange(booking.startsAt, booking.endsAt, booking.visitorTz || user.timezone),
        hostName: user.name,
      }),
    });
  }

  await db.user.delete({ where: { id: user.id } });
  await destroySession();
  redirect('/');
}
