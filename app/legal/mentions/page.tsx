import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Mentions légales — Creneau' };

export default function MentionsPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">Mentions légales</h1>
      <p className="mt-2 text-[13px] text-ink-500">Informations légales relatives à l’éditeur du service.</p>

      <h2 className="mt-7 text-[15px] font-semibold text-ink-900">Éditeur du site</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-600">
        Creneau est édité par [Nom / Prénom ou raison sociale], [forme juridique] au capital de [montant],
        immatriculée au RCS de [ville] sous le numéro [SIREN], dont le siège social est situé [adresse
        complète]. Responsable de publication : [nom]. Contact : [email] — [téléphone].
      </p>

      <h2 className="mt-7 text-[15px] font-semibold text-ink-900">Hébergement</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-600">
        Le service est hébergé par [Railway / Fly.io / OVH / Scaleway — raison sociale et adresse], dont les
        serveurs sont situés dans l’Union européenne. Les données sont stockées sur une base SQLite chiffrée
        au repos par l’hébergeur ([localisation]).
      </p>

      <h2 className="mt-7 text-[15px] font-semibold text-ink-900">Propriété intellectuelle</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-600">
        L’ensemble des éléments du service (marque, logo, interface, code source) est protégé. Toute
        reproduction, représentation ou distribution, totale ou partielle, sans autorisation écrite préalable
        est illicite (articles L.122-4 et L.335-2 du Code de la propriété intellectuelle).
      </p>

      <h2 className="mt-7 text-[15px] font-semibold text-ink-900">Responsabilité</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-600">
        Creneau est un outil de mise en relation d’agenda : les rendez-vous sont conclus entre le praticien et
        son client. L’éditeur ne peut être tenu responsable des annulations, retards, absences ou litiges
        commerciaux entre les deux parties, ni d’une indisponibilité du service.
      </p>

      <h2 className="mt-7 text-[15px] font-semibold text-ink-900">Signalement</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-600">
        Tout contenu manifestement illicite peut être signalé à [email]. Conformément à la LCEN, les
        signalements sont traités sans délai et l’auteur de la démarche est informé de la suite donnée.
      </p>
    </>
  );
}
