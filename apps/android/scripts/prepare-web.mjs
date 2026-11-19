// Prépare le dossier www/ embarqué dans l'APK : écran hors ligne + adresse du serveur.
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';

const url = (process.env.APP_URL ?? '').replace(/\/$/, '');
mkdirSync('www', { recursive: true });
copyFileSync('../shared/offline.html', 'www/offline.html');
copyFileSync('../shared/offline.html', 'www/index.html');
copyFileSync('../assets/icon.png', 'www/icon.png');
writeFileSync('www/config.js', `window.CRENEAU_URL = ${JSON.stringify(url)};\n`);
console.log(url ? `Serveur : ${url}` : 'ATTENTION : APP_URL vide, l’appli affichera « Serveur non configuré ».');
