import Link from 'next/link';
import Logo from '@/components/Logo';
import Reveal from '@/components/Reveal';

const SPARKS = [
  { top: '12%', left: '8%', d: '0s', s: 6 },
  { top: '22%', left: '88%', d: '0.7s', s: 5 },
  { top: '68%', left: '5%', d: '1.3s', s: 4 },
  { top: '78%', left: '92%', d: '0.4s', s: 6 },
  { top: '8%', left: '55%', d: '1.8s', s: 4 },
  { top: '45%', left: '95%', d: '2.2s', s: 3 },
  { top: '52%', left: '2%', d: '1.1s', s: 3 },
];

const STEPS = [
  ['Partagez votre lien', 'creneau.app/b/votre-nom. En bio Instagram, en signature email, sur Google Maps — un seul lien suffit.'],
  ['Vos clients choisissent', 'Ils voient uniquement vos vrais créneaux, dans leur fuseau horaire. Sans compte, sans friction.'],
  ['Tout s’automatise', 'Confirmation immédiate, ajout à l’agenda, rappels 24 h avant, annulations et reports gérés seuls.'],
];

const FEATURES = [
  ['Fuseaux automatiques', 'Vos horaires s’affichent dans le temps local du client, même à l’international.'],
  ['Tampons intelligents', 'Gardez 15 minutes entre deux RDV pour souffler, sans le demander deux fois.'],
  ['Agenda verrouillable', 'Bloquez une plage (vacances, réunion) : les créneaux disparaissent instantanément.'],
  ['Rappels automatiques', 'Un email de rappel la veille divise généralement les oublis par deux.'],
  ['Export .ics', 'Chaque RDV part dans Google Agenda, Apple Calendar ou Outlook en un clic.'],
  ['Page à votre marque', 'Couleur, accroche, bio : la page de réservation ressemble à votre cabinet.'],
];

export default function Home() {
  return (
    <main className="overflow-clip">
      {/* ===== HERO ===== */}
      <section className="relative bg-[linear-gradient(160deg,#eef3ec_0%,#dce8da_38%,#c3d6c0_70%,#a9c2a6_100%)]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 h-96 w-96 animate-float-slow rounded-full bg-sage-500/30 blur-3xl" />
          <div className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] animate-float rounded-full bg-copper-400/25 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 animate-float-slow rounded-full bg-sage-300/40 blur-3xl [animation-delay:2s]" />
          {SPARKS.map((p, i) => (
            <span
              key={i}
              className="absolute animate-sparkle rounded-full bg-copper-400 shadow-[0_0_12px_2px_rgba(207,155,109,0.65)]"
              style={{ top: p.top, left: p.left, width: p.s, height: p.s, animationDelay: p.d }}
            />
          ))}
        </div>

        <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex animate-fade-up items-center gap-2.5 text-[17px] font-bold tracking-tight text-sage-900">
            <Logo size={34} className="shadow-md ring-1 ring-black/5" />
            Creneau
          </div>
          <nav className="flex animate-fade-up items-center gap-2 [animation-delay:80ms]">
            <Link href="/login" className="btn-ghost text-sage-800 hover:bg-white/60 hover:text-sage-900">
              Connexion
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-sage-900 px-4 py-2 text-[15px] font-semibold text-sage-50 shadow-lg shadow-sage-900/25 transition hover:-translate-y-0.5 hover:bg-sage-800 hover:shadow-xl active:translate-y-0"
            >
              Gratuit, sans carte
            </Link>
          </nav>
        </header>

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 pb-24 pt-12 lg:grid-cols-[1.1fr_0.9fr] lg:pb-32 lg:pt-16">
          <div>
            <p className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-sage-600/20 bg-white/50 px-3.5 py-1.5 text-[13px] font-medium text-sage-800 backdrop-blur">
              <span className="h-1.5 w-1.5 animate-sparkle rounded-full bg-copper-500" />
              Pour indépendants, praticiens, coachs, agences
            </p>
            <h1 className="mt-5 max-w-2xl animate-fade-up text-4xl font-bold leading-[1.08] tracking-tight text-sage-900 [animation-delay:100ms] sm:text-[52px]">
              Vos rendez-vous se prennent{' '}
              <span className="bg-[linear-gradient(110deg,#b87333,#e6b98c,#b87333)] bg-[length:200%_auto] bg-clip-text text-transparent animate-shine">
                tout seuls
              </span>
              , 24 h sur 24.
            </h1>
            <p className="mt-5 max-w-xl animate-fade-up text-[17px] leading-relaxed text-sage-800/90 [animation-delay:200ms]">
              Fini les allers-retours « vous êtes dispo mardi ? ». Un lien, un agenda, des confirmations
              et des rappels automatiques. Vous gardez votre métier, Creneau garde votre agenda.
            </p>
            <div className="mt-8 flex animate-fade-up flex-wrap items-center gap-3 [animation-delay:300ms]">
              <Link
                href="/signup"
                className="group relative overflow-hidden rounded-xl bg-sage-900 px-6 py-3.5 text-base font-semibold text-sage-50 shadow-xl shadow-sage-900/30 transition hover:-translate-y-0.5 hover:shadow-2xl active:translate-y-0"
              >
                <span className="relative z-10">Créer mon lien de réservation</span>
                <span className="absolute inset-0 -translate-x-full bg-[linear-gradient(105deg,transparent,rgba(230,185,140,0.35),transparent)] transition-transform duration-700 group-hover:translate-x-full" />
              </Link>
              <Link
                href="/b/demo-cabinet"
                className="rounded-xl border border-sage-700/25 bg-white/60 px-6 py-3.5 text-base font-semibold text-sage-900 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white active:translate-y-0"
              >
                Voir une démo live →
              </Link>
            </div>
            <p className="mt-4 animate-fade-up text-[13px] text-sage-700 [animation-delay:380ms]">
              2 minutes à installer · aucune carte bancaire · annulable quand vous voulez
            </p>
          </div>

          {/* Mock produit */}
          <div className="relative mx-auto w-full max-w-md animate-fade-up [animation-delay:250ms] lg:max-w-none">
            <div className="absolute -inset-6 animate-glow rounded-[2rem] bg-white/40 blur-2xl" />
            <div className="relative animate-float rounded-3xl border border-white/60 bg-white/85 p-5 shadow-2xl shadow-sage-900/20 backdrop-blur">
              <div className="flex items-center gap-3 border-b border-ink-100 pb-4">
                <Logo size={40} className="shadow ring-1 ring-black/5" />
                <div>
                  <p className="text-[15px] font-bold text-ink-900">Camille Laurent</p>
                  <p className="text-[12px] text-ink-500">Ostéopathe D.O. · Paris 11</p>
                </div>
                <span className="ml-auto rounded-full bg-sage-100 px-2.5 py-1 text-[11px] font-semibold text-sage-700">
                  En ligne
                </span>
              </div>
              <p className="mt-4 text-[13px] font-semibold text-ink-800">Séance d’ostéopathie · 60 min</p>
              <div className="mt-3 flex gap-1.5">
                {['Jeu 15', 'Ven 16', 'Sam 17', 'Lun 19', 'Mar 20'].map((d, i) => (
                  <span
                    key={d}
                    className={`rounded-lg px-2.5 py-1.5 text-[12px] font-medium ${
                      i === 1 ? 'bg-sage-800 text-white shadow' : 'bg-ink-50 text-ink-600'
                    }`}
                  >
                    {d}
                  </span>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-1.5">
                {['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'].map((t, i) => (
                  <span
                    key={t}
                    className={`animate-sparkle rounded-lg border px-2 py-2 text-center text-[12px] font-semibold ${
                      i === 4
                        ? 'border-transparent bg-copper-500 text-white shadow-lg shadow-copper-500/40 [animation-delay:0.5s]'
                        : 'border-ink-100 bg-white text-ink-700'
                    }`}
                    style={{ animationDelay: `${i * 0.35}s` }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-4 rounded-xl bg-sage-50 p-3 text-[12px] leading-relaxed text-sage-800">
                ✓ Vendredi 16 octobre à 15:00 — confirmation et rappel envoyés automatiquement.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ÉTAPES ===== */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <Reveal>
          <h2 className="text-center text-3xl font-bold tracking-tight text-ink-900">
            Trois étapes, et c’est réglé
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {STEPS.map(([title, body], i) => (
            <Reveal key={title} delay={i * 120}>
              <div className="group h-full rounded-2xl border border-ink-200 bg-white p-6 transition duration-300 hover:-translate-y-1.5 hover:border-sage-300 hover:shadow-xl hover:shadow-sage-900/10">
                <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-[radial-gradient(circle_at_30%_30%,#8ba583,#4d674a)] text-[15px] font-bold text-white shadow-md transition group-hover:scale-110">
                  {i + 1}
                </div>
                <h3 className="text-[16px] font-semibold text-ink-900">{title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-600">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== FONCTIONNALITÉS ===== */}
      <section className="border-y border-ink-200 bg-ink-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight text-ink-900">
              Tout ce qu’un vrai outil de RDV doit avoir
            </h2>
            <p className="mt-3 max-w-xl text-[15px] text-ink-600">
              Pas une usine à gaz : les fonctions pour lesquelles vos clients paieront, rien d’autre.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(([title, body], i) => (
              <Reveal key={title} delay={(i % 3) * 110}>
                <div className="group relative h-full overflow-hidden rounded-2xl border border-ink-200 bg-white p-5 transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-sage-900/10">
                  <span className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-[linear-gradient(90deg,#4d674a,#b87333)] transition-transform duration-500 group-hover:scale-x-100" />
                  <div className="mb-3 flex items-center gap-2.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-copper-500 transition group-hover:animate-sparkle group-hover:shadow-[0_0_10px_2px_rgba(184,115,51,0.5)]" />
                    <h3 className="text-[15px] font-semibold text-ink-900">{title}</h3>
                  </div>
                  <p className="text-[14px] leading-relaxed text-ink-600">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TARIFS ===== */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <Reveal>
          <h2 className="text-center text-3xl font-bold tracking-tight text-ink-900">
            Gratuit. Vraiment gratuit.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-[15px] leading-relaxed text-ink-600">
            Aucune carte bancaire, aucune limite cachée, aucune fonctionnalité retenue en otage. Tout ce qui
            est décrit sur cette page est inclus dès aujourd’hui.
          </p>
        </Reveal>
        <Reveal delay={120}>
          <div className="relative mx-auto mt-10 max-w-3xl overflow-hidden rounded-2xl border-2 border-sage-700 bg-white p-7 shadow-xl shadow-sage-900/15 sm:p-9">
            <span className="absolute right-5 top-5 rounded-full bg-copper-500 px-2.5 py-1 text-[11px] font-bold text-white">
              Offre de lancement
            </span>
            <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
              <p className="text-4xl font-bold tracking-tight text-ink-900">0 €</p>
              <p className="pb-1.5 text-[14px] text-ink-500">pour toujours, tant que vous utilisez le service</p>
            </div>
            <ul className="mt-6 grid gap-x-8 gap-y-2.5 text-[14px] text-ink-600 sm:grid-cols-2">
              {[
                'Lien public à votre nom',
                'Prestations et blocages illimités',
                'Créneaux en temps réel, fuseaux horaires',
                'Anti double-booking revalidé côté serveur',
                'Confirmation visiteur + notification hôte',
                'Rappels automatiques J-1',
                'Annulation et report autonomes par vos clients',
                'Export calendrier .ics',
                'Page à votre marque : couleur, accroche, bio',
                'Export et suppression de vos données en 1 clic',
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-0.5 shrink-0 text-sage-600">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Link
                href="/signup"
                className="group relative overflow-hidden rounded-xl bg-sage-900 px-6 py-3 text-[15px] font-semibold text-sage-50 shadow-lg shadow-sage-900/25 transition hover:-translate-y-0.5 hover:bg-sage-800"
              >
                <span className="relative z-10">Créer mon lien gratuit</span>
                <span className="absolute inset-0 -translate-x-full bg-[linear-gradient(105deg,transparent,rgba(230,185,140,0.35),transparent)] transition-transform duration-700 group-hover:translate-x-full" />
              </Link>
              <p className="max-w-sm text-[13px] leading-relaxed text-ink-500">
                Une offre payante viendra plus tard (domaine dédié, SMS, marque blanche). Les comptes créés
                aujourd’hui restent gratuits.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section className="relative overflow-hidden bg-[radial-gradient(120%_140%_at_20%_0%,#4d674a_0%,#26372b_70%)] py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 right-1/4 h-72 w-72 animate-float rounded-full bg-copper-500/20 blur-3xl" />
          <div className="absolute bottom-0 left-10 h-56 w-56 animate-float-slow rounded-full bg-sage-300/15 blur-3xl" />
        </div>
        <Reveal className="relative mx-auto max-w-2xl px-6 text-center">
          <Logo size={56} className="mx-auto animate-float shadow-2xl ring-1 ring-white/20" />
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-sage-50 sm:text-4xl">
            Récupérez les 5 heures par mois perdues en allers-retours
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-sage-100/80">
            Le premier client qui réserve via votre lien vous dira si l’outil vous fait gagner du temps. Et il
            ne vous en coûtera rien.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/signup"
              className="group relative overflow-hidden rounded-xl bg-copper-500 px-6 py-3.5 text-base font-semibold text-white shadow-xl shadow-copper-600/40 transition hover:-translate-y-0.5 hover:bg-copper-600"
            >
              <span className="relative z-10">Commencer gratuitement</span>
              <span className="absolute inset-0 -translate-x-full bg-[linear-gradient(105deg,transparent,rgba(255,255,255,0.35),transparent)] transition-transform duration-700 group-hover:translate-x-full" />
            </Link>
            <Link
              href="/b/demo-cabinet"
              className="rounded-xl border border-sage-100/30 px-6 py-3.5 text-base font-semibold text-sage-50 transition hover:-translate-y-0.5 hover:bg-white/10"
            >
              Tester la démo
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-6 text-left">
            {[
              ['2 min', 'le temps de créer votre lien'],
              ['18/18', 'contrôles techniques au vert'],
              ['0', 'compétence technique requise'],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-lg font-bold text-copper-400">{k}</p>
                <p className="text-[13px] leading-snug text-sage-100/70">{v}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-ink-200 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 text-[13px] text-ink-500">
          <div className="flex items-center gap-2 font-semibold text-ink-800">
            <Logo size={22} className="rounded-md" />
            © {new Date().getFullYear()} Creneau
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="transition hover:text-ink-900">
              Connexion
            </Link>
            <Link href="/signup" className="transition hover:text-ink-900">
              Créer un compte
            </Link>
            <Link href="/b/demo-cabinet" className="transition hover:text-ink-900">
              Démo
            </Link>
          </div>
          <div className="flex w-full flex-wrap gap-4 border-t border-ink-100 pt-4 text-[12px] text-ink-400">
            <Link href="/legal/mentions" className="transition hover:text-ink-700">
              Mentions légales
            </Link>
            <Link href="/legal/confidentialite" className="transition hover:text-ink-700">
              Confidentialité
            </Link>
            <Link href="/legal/cgv" className="transition hover:text-ink-700">
              Conditions de vente
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
