import { NextResponse, type NextRequest } from 'next/server';
import { loadService } from '@/lib/bookings';
import { generateSlots } from '@/lib/slots';
import { db } from '@/lib/db';
import { isValidTimeZone, wallToUtc } from '@/lib/time';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const serviceId = params.get('serviceId');
  const day = params.get('day'); // YYYY-MM-DD dans le fuseau du visiteur
  const visitorTz = params.get('tz');
  const token = params.get('token'); // reprogrammation : on ignore le RDV en cours

  if (!serviceId) return NextResponse.json({ error: 'serviceId manquant' }, { status: 400 });

  const bundle = await loadService(serviceId);
  if (!bundle) return NextResponse.json({ error: 'prestation introuvable' }, { status: 404 });

  const tz = visitorTz && isValidTimeZone(visitorTz) ? visitorTz : bundle.user.timezone;
  const [y, mo, d] = (day ?? '').split('-').map(Number);
  const validDay = Boolean(y && mo && d && d <= 31);
  const rangeStart = validDay ? wallToUtc(tz, y, mo, d, 0) : null;
  const rangeEnd = rangeStart ? new Date(rangeStart.getTime() + 24 * 3600_000) : null;

  let ignoreId: string | undefined;
  if (token) {
    const existing = await db.booking.findUnique({ where: { cancelToken: token }, select: { id: true } });
    ignoreId = existing?.id;
  }

  const [bookings, busy] = await Promise.all([
    db.booking.findMany({
      where: {
        userId: bundle.user.id,
        status: { not: 'CANCELLED' },
        endsAt: { gte: new Date(Date.now() - 7 * 86_400_000) },
      },
    }),
    db.busySlot.findMany({
      where: { userId: bundle.user.id, endsAt: { gte: new Date(Date.now() - 86_400_000) } },
    }),
  ]);

  const grouped = generateSlots({
    timezone: bundle.user.timezone,
    service: bundle.service,
    rules: bundle.rules,
    bookings: bookings.filter((b) => b.id !== ignoreId),
    busy,
  });

  const slots: { startsAt: string; endsAt: string }[] = [];
  for (const list of grouped.values()) {
    for (const slot of list) {
      if (rangeStart && rangeEnd && (slot.startsAt < rangeStart || slot.startsAt >= rangeEnd)) continue;
      slots.push({ startsAt: slot.startsAt.toISOString(), endsAt: slot.endsAt.toISOString() });
    }
  }

  return NextResponse.json({
    hostTz: bundle.user.timezone,
    slots,
  });
}
