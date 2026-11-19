/** Fichiers publiés par le workflow « Applis Android et Windows » sur la dernière release GitHub. */
const base = (
  process.env.APPS_DOWNLOAD_URL ?? 'https://github.com/ck526438-lgtm/creneau/releases/latest/download'
).replace(/\/$/, '');

export const APP_DOWNLOADS = {
  android: `${base}/Creneau.apk`,
  windowsSetup: `${base}/Creneau-Setup.exe`,
  windowsPortable: `${base}/Creneau-Portable.exe`,
};
