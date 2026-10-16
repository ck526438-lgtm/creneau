import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import ProfileForm from '@/components/ProfileForm';
import AccountDanger from '@/components/AccountDanger';
import { timeZones } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const user = await requireUser();
  const upcoming = await db.booking.count({
    where: { userId: user.id, status: { not: 'CANCELLED' }, endsAt: { gt: new Date() } },
  });
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">Réglages</h1>
      <p className="mt-1 mb-6 text-[14px] text-ink-600">
        Votre identité sur la page de réservation, votre lien public et votre fuseau horaire.
      </p>
      <ProfileForm
        zones={timeZones()}
        initial={{
          name: user.name,
          headline: user.headline,
          slug: user.slug,
          timezone: user.timezone,
          brandColor: user.brandColor,
          bio: user.bio,
          remindersOn: user.remindersOn,
        }}
      />
      <AccountDanger upcoming={upcoming} />
    </div>
  );
}
