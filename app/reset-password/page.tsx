import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import AuthShell from '@/components/AuthShell';
import ResetPasswordForm from '@/components/ResetPasswordForm';

export const metadata: Metadata = { title: 'Nouveau mot de passe — Creneau' };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const record = token
    ? await db.passwordReset.findUnique({ where: { token }, select: { usedAt: true, expiresAt: true } })
    : null;
  const valid = !!record && !record.usedAt && record.expiresAt > new Date();

  return (
    <AuthShell
      title="Nouveau mot de passe"
      subtitle="Choisissez un mot de passe d’au moins 8 caractères. Vous serez connecté immédiatement."
      altText="Lien expiré ?"
      altLink="/forgot-password"
      altLabel="Demander un nouveau lien"
    >
      {valid ? (
        <ResetPasswordForm token={token!} />
      ) : (
        <p className="rounded-xl bg-rose-50 px-3.5 py-3 text-[14px] leading-relaxed text-rose-700">
          Ce lien n’est plus valide — il a expiré ou a déjà servi.{' '}
          <Link href="/forgot-password" className="font-semibold underline underline-offset-4">
            Demandez-en un nouveau
          </Link>
          .
        </p>
      )}
    </AuthShell>
  );
}
