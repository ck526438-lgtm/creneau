import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await currentUser();
  if (!user) {
    return Response.json({ error: 'Vous devez être connecté pour exporter vos données.' }, { status: 401 });
  }

  const [services, availability, busySlots, bookings] = await Promise.all([
    db.service.findMany({ where: { userId: user.id }, orderBy: { position: 'asc' } }),
    db.availability.findMany({ where: { userId: user.id }, orderBy: [{ weekday: 'asc' }, { startMin: 'asc' }] }),
    db.busySlot.findMany({ where: { userId: user.id }, orderBy: { startsAt: 'asc' } }),
    db.booking.findMany({
      where: { userId: user.id },
      orderBy: { startsAt: 'desc' },
      include: { service: { select: { title: true, slug: true, durationMin: true } } },
    }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    service: 'Creneau',
    compte: {
      nom: user.name,
      email: user.email,
      lienPublic: user.slug,
      fuseau: user.timezone,
      accroche: user.headline,
      bio: user.bio,
      couleur: user.brandColor,
      rappels: user.remindersOn,
      inscritLe: user.createdAt,
    },
    prestations: services.map(({ id, userId, ...rest }) => rest),
    disponibilites: availability.map(({ id, userId, ...rest }) => rest),
    blocages: busySlots.map(({ id, userId, ...rest }) => rest),
    rendezVous: bookings.map(({ id, userId, serviceId, cancelToken, ...rest }) => rest),
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': `attachment; filename="creneau-${user.slug}.json"`,
      'cache-control': 'no-store',
    },
  });
}
