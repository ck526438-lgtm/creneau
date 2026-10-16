import type { Metadata } from 'next';
import AuthShell from '@/components/AuthShell';
import AuthForm from '@/components/AuthForm';
import { signupAction } from '@/actions/auth';

export const metadata: Metadata = { title: 'Créer un compte — Creneau' };

export default function SignupPage() {
  return (
    <AuthShell
      title="Créez votre lien de réservation"
      subtitle="Deux minutes, et vos clients peuvent réserver. Un service d’appel découverte et vos disponibilités types sont créés automatiquement."
      altText="Vous avez déjà un compte ?"
      altLink="/login"
      altLabel="Se connecter"
    >
      <AuthForm action={signupAction} submitLabel="Créer mon compte gratuit" mode="signup" />
    </AuthShell>
  );
}
