import Link from 'next/link';
import Logo from '@/components/Logo';

export default function NotFound() {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-ink-50 px-5">
      <div className="pointer-events-none absolute -left-28 -top-24 h-72 w-72 animate-float-slow rounded-full bg-sage-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-24 h-72 w-72 animate-float rounded-full bg-copper-400/15 blur-3xl" />
      <div className="card relative w-full max-w-md animate-fade-up p-8 text-center">
        <Logo size={56} className="mx-auto mb-5 animate-float shadow-lg ring-1 ring-black/5" />
        <p className="text-[13px] font-semibold uppercase tracking-wide text-ink-500">404</p>
        <h1 className="mt-2 text-xl font-bold text-ink-900">Page ou lien introuvable</h1>
        <p className="mt-3 text-[14px] leading-relaxed text-ink-600">
          Ce lien de réservation n’existe pas (encore). Vérifiez l’adresse, ou créez votre propre lien en
          deux minutes.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/signup" className="btn-primary">
            Créer mon lien
          </Link>
          <Link href="/" className="btn-secondary">
            Accueil
          </Link>
        </div>
      </div>
    </main>
  );
}
