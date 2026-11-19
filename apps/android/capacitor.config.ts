import type { CapacitorConfig } from '@capacitor/cli';

/**
 * L'appli est une fenêtre native sur le serveur Creneau en ligne : mêmes comptes, mêmes RDV,
 * mises à jour du site visibles immédiatement sans republier l'APK.
 * APP_URL est fournie au build (variable GitHub « APP_URL »).
 */
const appUrl = (process.env.APP_URL ?? '').replace(/\/$/, '');

const config: CapacitorConfig = {
  appId: 'app.creneau.android',
  appName: 'Creneau',
  webDir: 'www',
  server: appUrl
    ? {
        url: `${appUrl}/dashboard`,
        // Écran local affiché si le serveur est injoignable (pas de réseau…)
        errorPath: 'offline.html',
        androidScheme: 'https',
      }
    : { androidScheme: 'https' },
  android: {
    allowMixedContent: false,
    backgroundColor: '#f2f6f1',
  },
};

export default config;
