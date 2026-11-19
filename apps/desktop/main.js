// Creneau pour Windows : une fenêtre native sur le serveur Creneau en ligne.
const { app, BrowserWindow, Menu, shell, session, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

function serverUrl() {
  if (process.env.CRENEAU_URL) return process.env.CRENEAU_URL.replace(/\/$/, '');
  try {
    const raw = fs.readFileSync(path.join(__dirname, 'web', 'config.json'), 'utf8');
    return (JSON.parse(raw).url || '').replace(/\/$/, '');
  } catch {
    return '';
  }
}

const SERVER = serverUrl();
const ORIGIN = SERVER ? new URL(SERVER).origin : '';
const OFFLINE = path.join(__dirname, 'web', 'offline.html');

let win = null;

function isInternal(target) {
  try {
    return ORIGIN && new URL(target).origin === ORIGIN;
  } catch {
    return false;
  }
}

function openExternal(target) {
  // Seuls les liens web, mail, téléphone et WhatsApp sortent vers le système.
  if (/^(https?:|mailto:|tel:|whatsapp:)/i.test(target)) shell.openExternal(target);
}

function loadHome() {
  if (!win) return;
  if (SERVER) win.loadURL(`${SERVER}/dashboard`);
  else win.loadFile(OFFLINE);
}

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 380,
    minHeight: 560,
    title: 'Creneau',
    icon: path.join(__dirname, 'web', 'icon.png'),
    backgroundColor: '#f2f6f1',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true,
    },
  });

  win.once('ready-to-show', () => win.show());

  // Liens target=_blank (WhatsApp, Ouvrir ma page…) : le site Creneau reste dans l'appli,
  // le reste s'ouvre dans le navigateur ou l'appli du système.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isInternal(url)) {
      win.loadURL(url);
    } else {
      openExternal(url);
    }
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    // « Réessayer » depuis l'écran hors ligne : le chargement est fait par le processus principal
    // (une navigation fichier local → site lancée par la page elle-même fait planter le rendu).
    if (win.webContents.getURL().startsWith('file:') && isInternal(url)) {
      event.preventDefault();
      // après l'annulation de la navigation en cours, sinon les deux se télescopent
      setTimeout(() => win.loadURL(url), 0);
      return;
    }
    if (url.startsWith('file:') || isInternal(url)) return;
    event.preventDefault();
    openExternal(url);
  });

  // Pas de réseau / serveur injoignable : écran local avec « Réessayer ».
  win.webContents.on('did-fail-load', (_e, code, _desc, url, isMainFrame) => {
    if (!isMainFrame || code === -3 /* navigation annulée */) return;
    if (url && url.startsWith('file:')) return;
    win.loadFile(OFFLINE);
  });

  loadHome();
}

function buildMenu() {
  const template = [
    {
      label: 'Creneau',
      submenu: [
        { label: 'Agenda', accelerator: 'CmdOrCtrl+1', click: () => SERVER && win.loadURL(`${SERVER}/dashboard`) },
        { label: 'Prestations', accelerator: 'CmdOrCtrl+2', click: () => SERVER && win.loadURL(`${SERVER}/dashboard/services`) },
        { label: 'Disponibilités', accelerator: 'CmdOrCtrl+3', click: () => SERVER && win.loadURL(`${SERVER}/dashboard/availability`) },
        { label: 'Réglages', accelerator: 'CmdOrCtrl+4', click: () => SERVER && win.loadURL(`${SERVER}/dashboard/settings`) },
        { type: 'separator' },
        { label: 'Quitter', role: 'quit' },
      ],
    },
    {
      label: 'Édition',
      submenu: [
        { label: 'Annuler', role: 'undo' },
        { label: 'Rétablir', role: 'redo' },
        { type: 'separator' },
        { label: 'Couper', role: 'cut' },
        { label: 'Copier', role: 'copy' },
        { label: 'Coller', role: 'paste' },
        { label: 'Tout sélectionner', role: 'selectAll' },
      ],
    },
    {
      label: 'Affichage',
      submenu: [
        { label: 'Actualiser', accelerator: 'F5', click: () => win && win.webContents.reload() },
        { label: 'Précédent', accelerator: 'Alt+Left', click: () => win && win.webContents.navigationHistory.goBack() },
        { type: 'separator' },
        { label: 'Zoom avant', role: 'zoomIn' },
        { label: 'Zoom arrière', role: 'zoomOut' },
        { label: 'Taille normale', role: 'resetZoom' },
        { type: 'separator' },
        { label: 'Plein écran', role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Aide',
      submenu: [
        { label: 'Ouvrir Creneau dans le navigateur', click: () => SERVER && shell.openExternal(SERVER) },
        {
          label: 'À propos',
          click: () =>
            dialog.showMessageBox(win, {
              type: 'info',
              title: 'Creneau',
              message: `Creneau ${app.getVersion()}`,
              detail: SERVER ? `Serveur : ${SERVER}` : 'Serveur non configuré',
            }),
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// Une seule fenêtre : relancer l'appli remet la fenêtre existante au premier plan.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.focus();
  });

  app.whenReady().then(() => {
    app.setAppUserModelId('app.creneau.desktop');
    // Aucune permission sensible demandée par le site (caméra, micro, position…).
    session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
      callback(permission === 'clipboard-sanitized-write' || permission === 'notifications');
    });
    buildMenu();
    createWindow();
  });

  app.on('window-all-closed', () => app.quit());
}
