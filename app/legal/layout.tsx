import Link from 'next/link';
import Logo from '@/components/Logo';

const LINKS = [
  { href: '/legal/mentions', label: 'Mentions légales' },
  { href: '/legal/confidentialite', label: 'Confidentialité' },
  { href: '/legal/cgv', label: 'CGV' },
];

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh bg-ink-50">
      <div className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
        <Link
          href="/"
          className="mb-8 flex animate-fade-up items-center gap-2.5 text-[17px] font-bold text-ink-900"
        >
          <Logo size={34} className="shadow-md ring-1 ring-black/5" />
          Creneau
        </Link>
        <nav className="mb-8 flex animate-fade-up flex-wrap gap-2 [animation-delay:100ms]">
          {LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl border border-ink-200 bg-white px-3 py-1.5 text-[13px] font-medium text-ink-700 transition hover:-translate-y-0.5 hover:border-ink-300 hover:text-ink-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <article className="card animate-fade-up p-7 [animation-delay:180ms] sm:p-9">{children}</article>
        <p className="mt-6 text-[12px] leading-relaxed text-ink-400">
          Ces pages sont des modèles pré-remplis pour une mise en production rapide. Faites-les relire par un
          juriste : les champs entre crochets doivent être complétés avec votre situation réelle.
        </p>
      </div>
    </main>
  );
}
