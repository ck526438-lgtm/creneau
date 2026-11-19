import Link from 'next/link';
import ShareLinkActions from '@/components/ShareLinkActions';

type Props = {
  slug: string;
  shareUrl: string;
  hostName: string;
  profileDone: boolean;
  servicesDone: boolean;
  hasActiveService: boolean;
};

/** Affiché tant que le compte n'a reçu aucune réservation : les 4 étapes pour être prêt. */
export default function OnboardingChecklist({
  slug,
  shareUrl,
  hostName,
  profileDone,
  servicesDone,
  hasActiveService,
}: Props) {
  const steps = [
    {
      done: profileDone,
      title: 'Présentez-vous',
      text: 'Métier, courte présentation et couleur : ce que vos clients voient en premier.',
      href: '/dashboard/settings',
      cta: 'Personnaliser ma page',
    },
    {
      done: servicesDone,
      title: 'Décrivez vos prestations',
      text: 'Durée, prix (en FCFA, €…), lieu : une prestation par type de rendez-vous.',
      href: '/dashboard/services',
      cta: 'Gérer mes prestations',
    },
    {
      done: false,
      title: 'Vérifiez vos horaires',
      text: 'Par défaut : lundi-vendredi, 9 h-12 h 30 et 13 h 30-18 h. Ajoutez vos congés en blocage.',
      href: '/dashboard/availability',
      cta: 'Mes disponibilités',
    },
    {
      done: false,
      title: 'Faites une réservation test',
      text: 'Réservez-vous un créneau pour voir exactement ce que reçoit votre client.',
      href: `/b/${slug}`,
      cta: 'Ouvrir ma page',
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <section className="card mb-8 overflow-hidden">
      <div className="border-b border-ink-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[17px] font-bold text-ink-900">Bienvenue ! Prêt en 5 minutes</h2>
            <p className="mt-1 text-[14px] text-ink-600">
              Ce guide disparaît dès votre première réservation. {doneCount}/{steps.length} étapes faites.
            </p>
          </div>
          <div className="h-2 w-40 overflow-hidden rounded-full bg-ink-100" aria-hidden>
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${(doneCount / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
      <ol className="divide-y divide-ink-200">
        {steps.map((step, i) => (
          <li key={step.title} className="flex flex-wrap items-center gap-4 p-5">
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[13px] font-bold ${
                step.done ? 'bg-emerald-500 text-white' : 'bg-ink-100 text-ink-600'
              }`}
            >
              {step.done ? '✓' : i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className={`text-[15px] font-semibold ${step.done ? 'text-ink-500 line-through' : 'text-ink-900'}`}>
                {step.title}
              </p>
              <p className="text-[13px] text-ink-600">{step.text}</p>
            </div>
            <Link href={step.href} className="btn-secondary px-3 py-1.5 text-[13px]">
              {step.cta}
            </Link>
          </li>
        ))}
      </ol>
      <div className="border-t border-ink-200 bg-ink-50 p-5">
        <p className="text-[15px] font-semibold text-ink-900">Partagez votre lien</p>
        <p className="mb-3 text-[13px] text-ink-600">
          Dans votre bio Instagram/Facebook, votre statut WhatsApp, votre signature email ou sur une affiche.
        </p>
        {hasActiveService ? (
          <ShareLinkActions url={shareUrl} hostName={hostName} />
        ) : (
          <p className="text-[13px] text-rose-600">
            Activez au moins une prestation : sans elle, votre page affiche « lien introuvable ».
          </p>
        )}
      </div>
    </section>
  );
}
