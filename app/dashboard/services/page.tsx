import Link from 'next/link';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { locationLabel, priceLabel, SERVICE_COLORS } from '@/lib/constants';
import { deleteServiceAction, toggleServiceAction } from '@/actions/config';
import DeleteWithAction from '@/components/DeleteWithAction';
import ToggleRow from '@/components/ToggleRow';

export const dynamic = 'force-dynamic';

export default async function ServicesPage() {
  const user = await requireUser();
  const services = await db.service.findMany({
    where: { userId: user.id },
    orderBy: [{ position: 'asc' }],
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Prestations</h1>
          <p className="mt-1 text-[14px] text-ink-600">
            Ce que vos clients peuvent réserver, avec la durée et le lieu de chaque rendez-vous.
          </p>
        </div>
        <Link href="/dashboard/services/new" className="btn-primary">
          + Nouvelle prestation
        </Link>
      </div>

      {services.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-[15px] font-semibold text-ink-900">Aucune prestation</p>
          <p className="mx-auto mt-2 max-w-md text-[14px] text-ink-600">
            Créez au moins une prestation pour que votre lien de réservation fonctionne.
          </p>
          <Link href="/dashboard/services/new" className="btn-primary mt-5">
            Créer ma première prestation
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {services.map((s) => (
            <div key={s.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-9 w-9 shrink-0 rounded-xl"
                    style={{ background: SERVICE_COLORS[s.colorIndex % SERVICE_COLORS.length] }}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-ink-900">{s.title}</p>
                    <p className="truncate text-[13px] text-ink-600">
                      {s.durationMin} min · {locationLabel(s.locationKind)} ·{' '}
                      {priceLabel(s.priceCents)}
                    </p>
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${
                    s.active ? 'bg-emerald-50 text-emerald-700' : 'bg-ink-100 text-ink-500'
                  }`}
                >
                  {s.active ? 'En ligne' : 'Masquée'}
                </span>
              </div>
              {s.description && (
                <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-ink-600">
                  {s.description}
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-ink-200 pt-3">
                <Link href={`/dashboard/services/edit/${s.id}`} className="btn-secondary px-3 py-1.5 text-[13px]">
                  Modifier
                </Link>
                <ToggleRow
                  action={toggleServiceAction}
                  id={s.id}
                  active={s.active}
                  labelOn="Masquer"
                  labelOff="Publier"
                />
                <DeleteWithAction
                  action={deleteServiceAction}
                  id={s.id}
                  confirmText={`Supprimer « ${s.title} » ? Les rendez-vous passés seront supprimés avec.`}
                />
                <Link
                  href={`/b/${user.slug}?service=${s.slug}`}
                  className="btn-ghost ml-auto px-2 py-1.5 text-[13px]"
                >
                  Voir
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
