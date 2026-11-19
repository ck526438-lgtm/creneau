import type { Metadata } from 'next';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { APP_DOWNLOADS } from '@/lib/apps';

export const metadata: Metadata = {
  title: 'Applis Android et Windows — Creneau',
  description: 'Installez Creneau sur votre téléphone Android ou votre PC Windows : votre agenda toujours à portée de main.',
};

export default function AppsPage() {
  return (
    <main className="min-h-dvh bg-ink-50 px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="mb-8 inline-flex items-center gap-2.5 text-[16px] font-bold text-ink-900">
          <Logo size={30} className="shadow-sm ring-1 ring-black/5" />
          Creneau
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-ink-900">Creneau sur votre téléphone et votre PC</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-600">
          Les applis ouvrent votre compte Creneau : mêmes rendez-vous, mêmes réglages, synchronisés en temps
          réel avec le site. Connectez-vous avec votre email et votre mot de passe habituels.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <section className="card p-6">
            <img src="/app-icon-192.png" alt="" width={56} height={56} className="rounded-2xl" />
            <h2 className="mt-4 text-[18px] font-bold text-ink-900">Android</h2>
            <p className="mt-1 text-[14px] text-ink-600">Téléphones et tablettes, Android 7 ou plus récent.</p>
            <a href={APP_DOWNLOADS.android} className="btn-primary mt-5 w-full">
              Télécharger l’APK
            </a>
            <ol className="mt-5 list-decimal space-y-1.5 pl-5 text-[13px] leading-relaxed text-ink-600">
              <li>Ouvrez le fichier <strong>Creneau.apk</strong> téléchargé.</li>
              <li>
                Si Android le demande, autorisez l’installation depuis votre navigateur (« sources inconnues »).
              </li>
              <li>Ouvrez Creneau et connectez-vous.</li>
            </ol>
          </section>

          <section className="card p-6">
            <img src="/app-icon-192.png" alt="" width={56} height={56} className="rounded-2xl" />
            <h2 className="mt-4 text-[18px] font-bold text-ink-900">Windows</h2>
            <p className="mt-1 text-[14px] text-ink-600">Windows 10 et 11, 64 bits.</p>
            <a href={APP_DOWNLOADS.windowsSetup} className="btn-primary mt-5 w-full">
              Télécharger l’installateur
            </a>
            <a href={APP_DOWNLOADS.windowsPortable} className="btn-secondary mt-2 w-full">
              Version portable (sans installation)
            </a>
            <p className="mt-5 text-[13px] leading-relaxed text-ink-600">
              Si Windows affiche « Windows a protégé votre ordinateur », cliquez sur{' '}
              <strong>Informations complémentaires</strong> puis <strong>Exécuter quand même</strong>.
            </p>
          </section>
        </div>

        <section className="card mt-5 p-6">
          <h2 className="text-[16px] font-bold text-ink-900">iPhone, iPad ou autre appareil</h2>
          <p className="mt-1 text-[14px] leading-relaxed text-ink-600">
            Ouvrez Creneau dans Safari ou Chrome, puis <strong>Partager → Sur l’écran d’accueil</strong> (iPhone)
            ou <strong>⋮ → Installer l’application</strong> (Chrome) : Creneau s’ouvre ensuite comme une appli.
          </p>
          <Link href="/login" className="btn-secondary mt-4">
            Ouvrir Creneau
          </Link>
        </section>
      </div>
    </main>
  );
}
