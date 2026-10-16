import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { sendMail, reminderMail } from '@/lib/mail';
import { locationText } from '@/lib/bookings';
import { formatRange } from '@/lib/time';
import { isValidTimeZone } from '@/lib/time';

export const dynamic = 'force-dynamic';

/** A brancher sur un cron externe (Railway cron, GitHub Action, crontab) toutes les heures. */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get('authorization');
  if (secret && header !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const windowEnd = new Date(now.getTime() + 26 * 3600_000);
  const candidates = await db.booking.findMany({
    where: {
      status: 'CONFIRMED',
      remindSentAt: null,
      startsAt: { gte: now, lte: windowEnd },
      user: { remindersOn: true },
    },
    include: { service: true, user: true },
    take: 200,
  });

  let sent = 0;
  for (const booking of candidates) {
    const tz =
      booking.visitorTz && isValidTimeZone(booking.visitorTz) ? booking.visitorTz : booking.user.timezone;
    const ok = await sendMail({
      to: booking.visitorEmail,
      ...reminderMail({
        brandColor: booking.user.brandColor,
        visitorName: booking.visitorName,
        serviceTitle: booking.service.title,
        when: formatRange(booking.startsAt, booking.endsAt, tz),
        location: locationText(booking.service, booking.user),
        hostName: booking.user.name,
      }),
    });
    if (ok) {
      await db.booking.update({ where: { id: booking.id }, data: { remindSentAt: now } });
      sent++;
    }
  }

  return NextResponse.json({ scheduled: candidates.length, sent });
}
