import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Creneau — la prise de rendez-vous en ligne sans friction',
  description:
    'Partagez un lien, laissez vos clients choisir un créneau, recevez confirmation et rappels automatiques.',
  metadataBase: new URL(process.env.APP_URL ?? 'http://localhost:3000'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
