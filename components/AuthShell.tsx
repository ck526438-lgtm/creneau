import Link from 'next/link';
import Logo from '@/components/Logo';

export default function AuthShell({
  title,
  subtitle,
  children,
  altText,
  altLink,
  altLabel,
  notice,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  altText: string;
  altLink: string;
  altLabel: string;
  notice?: string;
}) {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-ink-50">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 animate-float rounded-full bg-sage-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 animate-float-slow rounded-full bg-copper-400/20 blur-3xl" />
      <div className="relative mx-auto flex max-w-md flex-col px-5 py-10 sm:py-16">
        <Link href="/" className="mb-8 flex animate-fade-up items-center gap-2.5 text-[17px] font-bold text-ink-900">
          <Logo size={36} className="shadow-md ring-1 ring-black/5" />
          Creneau
        </Link>
        <div className="card animate-fade-up p-7 [animation-delay:120ms] sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">{title}</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-600">{subtitle}</p>
          <div className="mt-6">{children}</div>
          {notice && (
            <p className="mt-5 rounded-xl bg-copper-400/15 px-3.5 py-2.5 text-[13px] text-copper-600">{notice}</p>
          )}
        </div>
        <p className="mt-5 text-center text-[14px] text-ink-600">
          {altText}{' '}
          <Link href={altLink} className="font-semibold text-ink-900 underline-offset-4 hover:underline">
            {altLabel}
          </Link>
        </p>
      </div>
    </main>
  );
}
