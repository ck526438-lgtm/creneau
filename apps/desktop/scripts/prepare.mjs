// Embarque l'écran hors ligne, l'icône et l'adresse du serveur (APP_URL) dans l'appli.
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';

const url = (process.env.APP_URL ?? '').replace(/\/$/, '');
mkdirSync('web', { recursive: true });
mkdirSync('build', { recursive: true });
copyFileSync('../shared/offline.html', 'web/offline.html');
copyFileSync('../assets/icon.png', 'web/icon.png');
copyFileSync('../assets/icon.png', 'build/icon.png');
writeFileSync('web/config.js', `window.CRENEAU_URL = ${JSON.stringify(url)};\n`);
writeFileSync('web/config.json', JSON.stringify({ url }));
console.log(url ? `Serveur : ${url}` : 'ATTENTION : APP_URL vide, l’appli affichera « Serveur non configuré ».');
