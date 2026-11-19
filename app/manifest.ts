import type { MetadataRoute } from 'next';

/** Installable depuis le navigateur (iPhone : Partager → « Sur l'écran d'accueil »). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Creneau — prise de rendez-vous',
    short_name: 'Creneau',
    description: 'Votre agenda de rendez-vous en ligne : lien public, créneaux en temps réel, rappels.',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    background_color: '#f2f6f1',
    theme_color: '#39503a',
    lang: 'fr',
    icons: [
      { src: '/app-icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/app-icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/app-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
