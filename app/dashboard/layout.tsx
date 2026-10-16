import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentUser, destroySession } from '@/lib/auth';
import { db } from '@/lib/db';
import CopyLinkButton from '@/components/CopyLinkButton';
import Logo from '@/components/Logo';

const NAV = [
  { href: '/dashboard', label: 'Agenda' },
  { href: '/dashboard/services', label: 'Prestations' },
  { href: '/dashboard/availability', label: 'Disponibilités' },
  { href: '/dashboard/settings', label: 'Réglages' },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect('/login?expired=1');
  const upcoming = await db.booking.count({
    where: { userId: user.id, status: { not: 'CANCELLED' }, endsAt: { gte: new Date() } },
  });

  return (
    <div className="min-h-dvh bg-ink-50">
      <div className="mx-auto flex max-w-6xl gap-8 px-5 py-6 lg:py-10">
        <aside className="hidden w-52 shrink-0 lg:block">
          <Link href="/" className="mb-8 flex items-center gap-2.5 text-[16px] font-bold text-ink-900">
            <Logo size={30} className="shadow-sm ring-1 ring-black/5" />
            Creneau
          </Link>
          <nav className="space-y-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between rounded-xl px-3 py-2 text-[14px] font-medium text-ink-600 transition hover:bg-white hover:text-ink-900"
              >
                {item.label}
                {item.href === '/dashboard' && upcoming > 0 && (
                  <span className="rounded-full bg-ink-900 px-2 py-0.5 text-[11px] font-semibold text-white">
                    {upcoming}
                  </span>
                )}
              </Link>
            ))}
          </nav>
          <div className="mt-6 rounded-xl border border-sage-600/25 bg-sage-50 p-3 text-[12px] leading-relaxed text-sage-800">
            <p className="font-semibold">Offre de lancement · 0 €</p>
            <p className="mt-0.5 text-sage-700">
              Toutes les fonctions sont incluses, sans carte bancaire.
            </p>
          </div>
          <div className="mt-6 border-t border-ink-200 pt-5 text-[13px] text-ink-500">
            <p className="truncate font-medium text-ink-800">{user.name}</p>
            <p className="truncate">{user.email}</p>
            <form
              action={async () => {
                'use server';
                await destroySession();
                redirect('/login');
              }}
              className="mt-3"
            >
              <button className="btn-ghost -ml-1 px-2 py-1 text-[13px]">Se déconnecter</button>
            </form>
          </div>
        </aside>

        <main className="min-w-0 flex-1 animate-fade-up">
          <div className="mb-6 flex items-center justify-between gap-3 lg:hidden">
            <Link href="/" className="flex items-center gap-2 font-bold text-ink-900">
              <Logo size={28} className="shadow-sm ring-1 ring-black/5" />
              Creneau
            </Link>
          </div>
          <div className="mb-6 flex flex-wrap gap-1.5 lg:hidden">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl border border-ink-200 bg-white px-3 py-1.5 text-[13px] font-medium text-ink-700"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[13px] text-ink-500">Votre lien public</p>
            <CopyLinkButton slug={user.slug} />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
