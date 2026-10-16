import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import BookingFlow from '@/components/BookingFlow';
import { locationLabel } from '@/lib/constants';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ token?: string }> };

async function load(props: Props) {
  const { slug } = await props.params;
  const { token } = await props.searchParams;
  const user = await db.user.findUnique({
    where: { slug },
    include: { services: { where: { active: true }, orderBy: [{ position: 'asc' }] } },
  });
  if (!user || user.services.length === 0) return null;

  let locked = null;
  if (token) {
    const booking = await db.booking.findFirst({
      where: { cancelToken: token, userId: user.id, status: { not: 'CANCELLED' } },
    });
    if (booking) {
      locked = {
        token,
        serviceId: booking.serviceId,
        startsAt: new Date(booking.startsAt).toISOString(),
      };
    }
  }
  return { user, locked };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const data = await load(props);
  if (!data) return { title: 'Lien introuvable — Creneau' };
  return {
    title: `Prendre rendez-vous avec ${data.user.name}`,
    description: data.user.headline || data.user.bio || 'Réservation en ligne, créneaux en temps réel.',
  };
}

export default async function PublicBookingPage(props: Props) {
  const data = await load(props);
  if (!data) notFound();
  const { user, locked } = data;

  return (
    <BookingFlow
      host={{
        name: user.name,
        headline: user.headline,
        bio: user.bio,
        brandColor: user.brandColor,
        timezone: user.timezone,
      }}
      services={user.services.map((s) => ({
        id: s.id,
        slug: s.slug,
        title: s.title,
        description: s.description,
        durationMin: s.durationMin,
        priceCents: s.priceCents,
        locationKind: s.locationKind,
        locationLabel: locationLabel(s.locationKind),
        locationValue: s.locationValue,
      }))}
      locked={locked}
    />
  );
}
