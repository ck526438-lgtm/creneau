import type { Metadata } from 'next';
import Link from 'next/link';
import AuthShell from '@/components/AuthShell';
import AuthForm from '@/components/AuthForm';
import { loginAction } from '@/actions/auth';

export const metadata: Metadata = { title: 'Connexion — Creneau' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; expired?: string }>;
}) {
  const { next, expired } = await searchParams;
  return (
    <AuthShell
      title="Content de vous revoir"
      subtitle="Connectez-vous pour retrouver votre agenda et votre lien de réservation."
      altText="Pas encore de compte ?"
      altLink="/signup"
      altLabel="Créer un compte"
      notice={expired ? 'Votre session a expiré. Reconnectez-vous.' : undefined}
    >
      <AuthForm action={loginAction} submitLabel="Se connecter" mode="login" next={next} />
      <p className="mt-3 text-center">
        <Link
          href="/forgot-password"
          className="text-[13px] text-ink-500 underline-offset-4 transition hover:text-ink-900 hover:underline"
        >
          Mot de passe oublié ?
        </Link>
      </p>
    </AuthShell>
  );
}
