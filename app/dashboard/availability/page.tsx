import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import AvailabilityEditor from '@/components/AvailabilityEditor';
import BusyManager from '@/components/BusyManager';
import { formatWall } from '@/lib/time';

export const dynamic = 'force-dynamic';

export default async function AvailabilityPage() {
  const user = await requireUser();
  const [rules, busy] = await Promise.all([
    db.availability.findMany({ where: { userId: user.id }, orderBy: [{ weekday: 'asc' }, { startMin: 'asc' }] }),
    db.busySlot.findMany({
      where: { userId: user.id, endsAt: { gte: new Date() } },
      orderBy: { startsAt: 'asc' },
      take: 30,
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">Disponibilités</h1>
      <p className="mt-1 mb-6 text-[14px] text-ink-600">
        Les horaires sont exprimés dans votre fuseau ({user.timezone.replace(/_/g, ' ')}). Vos clients,
        eux, voient toujours leurs heures locales.
      </p>

      <AvailabilityEditor
        initial={rules.map((r) => ({ weekday: r.weekday, startMin: r.startMin, endMin: r.endMin }))}
      />

      <section className="mt-10">
        <h2 className="text-lg font-bold tracking-tight text-ink-900">Bloquer une plage</h2>
        <p className="mt-1 mb-4 text-[14px] text-ink-600">
          Vacances, réunion, formation : ces créneaux disparaissent de votre lien de réservation.
        </p>
        <BusyManager
          timezone={user.timezone}
          blocks={busy.map((b) => ({
            id: b.id,
            label: b.label,
            from: formatWall(new Date(b.startsAt), user.timezone, {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            }),
            to: formatWall(new Date(b.endsAt), user.timezone, {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            }),
          }))}
        />
      </section>
    </div>
  );
}
