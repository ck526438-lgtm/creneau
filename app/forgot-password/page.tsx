import type { Metadata } from 'next';
import AuthShell from '@/components/AuthShell';
import ForgotPasswordForm from '@/components/ForgotPasswordForm';

export const metadata: Metadata = { title: 'Mot de passe oublié — Creneau' };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Mot de passe oublié"
      subtitle="Indiquez l’email de votre compte : vous recevrez un lien pour choisir un nouveau mot de passe."
      altText="Vous vous souvenez de votre mot de passe ?"
      altLink="/login"
      altLabel="Se connecter"
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
