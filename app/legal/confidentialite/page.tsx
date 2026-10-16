import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Confidentialité — Creneau' };

export default function ConfidentialitePage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">Politique de confidentialité</h1>
      <p className="mt-2 text-[13px] text-ink-500">
        Traitement des données personnelles des praticiens et de leurs clients.
      </p>

      <h2 className="mt-7 text-[15px] font-semibold text-ink-900">Responsable de traitement</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-600">
        [Raison sociale], [adresse], contact : [email]. Le praticien qui utilise Creneau pour son activité est
        responsable de traitement des données qu’il collecte auprès de ses propres clients.
      </p>

      <h2 className="mt-7 text-[15px] font-semibold text-ink-900">Données collectées</h2>
      <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-ink-600">
        <li>
          <strong className="font-semibold text-ink-800">Compte praticien</strong> : nom, email, mot de passe
          (haché avec bcrypt), fuseau horaire, présentation, prestations et disponibilités.
        </li>
        <li>
          <strong className="font-semibold text-ink-800">Réservation client</strong> : nom, email, téléphone
          (facultatif), notes transmises librement, adresse IP le temps de la requête, fuseau horaire du
          navigateur.
        </li>
        <li>
          <strong className="font-semibold text-ink-800">Technique</strong> : un cookie de session
          <code className="mx-1 rounded bg-ink-100 px-1.5 py-0.5 text-[13px]">creneau_session</code> (JWT
          HS256, 30 jours, httpOnly) et les jetons d’annulation contenus dans les liens envoyés par email.
        </li>
      </ul>

      <h2 className="mt-7 text-[15px] font-semibold text-ink-900">Finalités et base légale</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-600">
        Exécution du service de réservation (contrat), envoi des confirmations et rappels (obligation
        contractuelle), sécurité et prévention des abus (intérêt légitime). Aucun profilage, aucune revente de
        données, aucune publicité tierce.
      </p>

      <h2 className="mt-7 text-[15px] font-semibold text-ink-900">Durées de conservation</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-600">
        Compte et rendez-vous : tant que le compte est actif, puis suppression sur demande. Rendez-vous
        annulés : 12 mois maximum. Emails transactionnels : 12 mois. Aucun cookie analytique n’est déposé.
      </p>

      <h2 className="mt-7 text-[15px] font-semibold text-ink-900">Sous-traitants</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-600">
        Hébergeur ([nom], UE) et prestataire d’envoi d’emails ([Brevo / Resend / SMTP maison], UE). Aucun
        transfert hors UE.
      </p>

      <h2 className="mt-7 text-[15px] font-semibold text-ink-900">Vos droits</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-600">
        Accès, rectification, effacement, limitation, portabilité et opposition : écrivez à [email]. Une
        suppression immédiate de votre compte est possible depuis Réglages. Réclamation auprès de la CNIL :
        3 place de Fontenoy, TSA 80715, 75334 Paris cedex 07.
      </p>

      <h2 className="mt-7 text-[15px] font-semibold text-ink-900">Sécurité</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-600">
        Mots de passe hachés, sessions signées, cookies <code className="rounded bg-ink-100 px-1.5 py-0.5 text-[13px]">httpOnly</code>{' '}
        et <code className="rounded bg-ink-100 px-1.5 py-0.5 text-[13px]">sameSite</code>, HTTPS obligatoire en
        production, sauvegardes chiffrées de la base.
      </p>
    </>
  );
}
