import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Conditions générales de vente — Creneau' };

export default function CgvPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">Conditions générales de vente</h1>
      <p className="mt-2 text-[13px] text-ink-500">
        Service actuellement fourni gratuitement — ces conditions règlent son usage et encadrent toute future
        offre payante.
      </p>

      <h2 className="mt-7 text-[15px] font-semibold text-ink-900">1. Objet</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-600">
        Creneau est un service en ligne d’agenda partagé : lien public de réservation, choix de créneaux
        calculés selon les disponibilités du praticien, confirmations et rappels par email, export calendrier
        (.ics). Le service est fourni « en mode SaaS », sans livraison de logiciel.
      </p>

      <h2 className="mt-7 text-[15px] font-semibold text-ink-900">2. Offre en cours</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-600">
        À la date de publication des présentes, Creneau est fourni <strong className="font-semibold text-ink-800">
        gratuitement</strong>, sans carte bancaire et sans engagement : lien public, prestations et blocages
        illimités, créneaux multi-fuseaux, confirmations et rappels par email, annulation et report autonomes,
        export .ics, page personnalisée. Aucune somme n’est due par le client.
      </p>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-600">
        Une offre payante pourra être commercialisée ultérieurement (domaine dédié, rappels par SMS, marque
        blanche, comptoir multi-praticiens). Elle fera l’objet de conditions particulières acceptées expressément,
        et les comptes ouverts pendant la période de gratuité conserveront l’accès aux fonctionnalités alors
        gratuites, sans modification rétroactive.
      </p>

      <h2 className="mt-7 text-[15px] font-semibold text-ink-900">3. Prix et paiement</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-600">
        Aucun paiement n’est demandé ni encaissé à ce jour : aucun moyen de paiement n’est collecté, aucune
        donnée bancaire n’est stockée. Si une offre payante était commercialisée, les prix seraient indiqués en
        euros TTC pour la France métropolitaine, payés d’avance mensuellement, avec TVA [numéro de TVA
        intracommunautaire].
      </p>

      <h2 className="mt-7 text-[15px] font-semibold text-ink-900">4. Durée et résiliation</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-600">
        Sans engagement : le client peut interrompre l’utilisation à tout moment et supprimer son compte depuis
        les réglages, ce qui efface définitivement prestations, disponibilités et rendez-vous. Les rendez-vous
        déjà confirmés restent valables jusqu’à leur échéance.
      </p>

      <h2 className="mt-7 text-[15px] font-semibold text-ink-900">5. Obligations du client</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-600">
        Le client garantit la véracité de ses disponibilités, détient les droits sur les textes et coordonnées
        publiés, et demeure seul responsable des rendez-vous conclus avec ses clients. Sont interdits : les
        activités illégales, la revente non autorisée de créneaux, la sollicitation commerciale non consentie.
      </p>

      <h2 className="mt-7 text-[15px] font-semibold text-ink-900">6. Garanties et limites</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-600">
        Objectif de disponibilité de 99,5 % hors maintenance planifiée. Une indisponibilité imputable à Creneau
        ouvre droit à un prorata de l’abonnement, sur demande, à l’exclusion de tout autre dommage et indirect.
        Creneau ne fournit aucune garantie de résultat commercial.
      </p>

      <h2 className="mt-7 text-[15px] font-semibold text-ink-900">7. Données personnelles</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-600">
        Conformément au RGPD, voir la <a href="/legal/confidentialite" className="underline">politique de
        confidentialité</a>. Le client agit en qualité de responsable de traitement vis-à-vis de ses propres
        clients ; Creneau agit en qualité de sous-traitant au sens de l’article 28 du RGPD.
      </p>

      <h2 className="mt-7 text-[15px] font-semibold text-ink-900">8. Droit applicable</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-600">
        Droit français. Médiation de la consommation : [nom du médiateur et coordonnées]. À défaut d’accord
        amiable, compétence du tribunal de commerce de [ville].
      </p>
    </>
  );
}
