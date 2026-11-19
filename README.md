# Creneau

Prise de rendez-vous en ligne pour indépendants et TPE : un lien public, des créneaux en temps réel,
confirmations et rappels automatiques. Next.js 15 + Prisma/SQLite + Tailwind.

## Démarrer en local

```bash
npm install
cp .env.example .env      # ajuster SESSION_SECRET et APP_URL
npm run setup             # crée la base SQLite + le compte de démo
npm run dev               # http://localhost:3000
```

Compte de démo : `demo@creneau.app` / `demo1234` — page publique `http://localhost:3000/b/demo-cabinet`.

## Contrôles

```bash
npx tsx scripts/check.ts  # 29 vérifications : fuseaux/DST, buffers, réservations simultanées, délai de
                          # prévenance, horizon, téléphone obligatoire, RDV passés, devises (FCFA…), WhatsApp
npx tsc --noEmit
npm run build
```

Le workflow `.github/workflows/ci.yml` lance ces trois contrôles à chaque push et pull request.

## Emails

Sans SMTP configuré, les emails sont écrits dans `./outbox/<date>.log` (parfait pour la démo).
Pour envoyer pour de vrai, renseigner dans `.env` :

```
SMTP_HOST=smtp.brevo.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
MAIL_FROM="Creneau <no-reply@mondomaine.fr>"
```

Les rappels J-1 partent via l'endpoint `GET /api/cron/reminders` (à déclencher une fois par heure
par un cron externe, avec `Authorization: Bearer <CRON_SECRET>`). En production, l'endpoint répond 503 tant
que `CRON_SECRET` n'est pas défini : il n'est jamais ouvert à tous.

## Parcourir le produit

| Écran | URL |
|---|---|
| Landing | `/` |
| Connexion / inscription | `/login`, `/signup` |
| Mot de passe oublié | `/forgot-password` puis `/reset-password?token=…` (45 min, usage unique) |
| Agenda, prestations, disponibilités, réglages | `/dashboard` |
| Page publique de réservation | `/b/demo-cabinet` |
| Gestion d'un RDV (annuler / reprogrammer) | `/r/<token>` reçu par email |
| Export de ses données (RGPD) | `/api/export` (depuis Réglages) |
| Suppression du compte | Réglages → « Supprimer le compte » |
| Sitemap, robots, image sociale | `/sitemap.xml`, `/robots.txt`, `/opengraph-image` |
| Sonde de déploiement | `/api/health` |
| Pages légales (modèles à compléter) | `/legal/mentions`, `/legal/confidentialite`, `/legal/cgv` |

## Applis Android et Windows

`apps/android` (Capacitor) et `apps/desktop` (Electron) sont des applis natives qui ouvrent le serveur Creneau
en ligne : mêmes comptes, mêmes rendez-vous, et chaque mise à jour du site est visible dans les applis sans
les republier. Sans réseau, elles affichent un écran « Pas de connexion » avec un bouton Réessayer. Les liens
WhatsApp, email et téléphone s'ouvrent dans les applis du système ; les fichiers `.ics` et l'export de données
se téléchargent normalement. Page publique de téléchargement : `/applis` (aussi installable en PWA sur iPhone).

Elles sont construites par GitHub Actions (`.github/workflows/apps.yml`) :

1. **Variable `APP_URL`** (repo → Settings → Secrets and variables → Actions → *Variables*) : l'adresse du
   serveur, ex. `https://creneau.up.railway.app`. C'est la même variable que pour les rappels J-1.
2. **Publier une version** : `git tag v1.0.0 && git push origin v1.0.0`. Le workflow construit
   `Creneau.apk`, `Creneau-Setup.exe` et `Creneau-Portable.exe` et les attache à une release GitHub ; les
   boutons de `/applis` pointent vers `…/releases/latest/download/…` et suivent toujours la dernière version.
3. Chaque push sur `main` touchant `apps/` produit aussi les fichiers (onglet Actions → *Artifacts*), sans release.

**Signature Android (fortement conseillée avant de distribuer)** : sans clé, l'APK est signé avec une clé de
debug différente à chaque build, et vos utilisateurs devront désinstaller l'appli pour la mettre à jour. Créez
une clé une seule fois et gardez-la précieusement :

```bash
keytool -genkeypair -v -keystore creneau-release.jks -alias creneau -keyalg RSA -keysize 2048 -validity 10000
base64 -w0 creneau-release.jks   # → secret ANDROID_KEYSTORE_BASE64
```

Secrets à ajouter : `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` (`creneau`),
`ANDROID_KEY_PASSWORD`. Le workflow produit alors un APK release signé et un `Creneau.aab` pour le Play Store.

**Windows** : l'installateur n'est pas signé (un certificat de signature de code coûte ~100-300 €/an), donc
SmartScreen affiche un avertissement au premier lancement ; la page `/applis` explique comment passer outre.

Icônes : `apps/assets/` (remplacez `icon.png`, 1024×1024, pour changer l'icône des deux applis).

Développement local : `cd apps/desktop && npm install && APP_URL=http://localhost:3000 npm start`.

## Modèle économique : gratuit

Aucune facturation n'est branchée : pas de Stripe, pas de moyen de paiement collecté, aucune fonctionnalité
verrouillée. Le champ `plan` de l'utilisateur est réservé pour plus tard et n'a aucun effet. La landing, les
CGV et l'image Open Graph disent la même chose (« 0 €, offre de lancement ») — ne les contredisez pas en
ajoutant un prix sans brancher le paiement.

## Déploiement sur Railway

SQLite impose un disque persistant : ni Vercel ni serverless. Railway convient (image Docker + volume).

**Coût réel** : l'essai Railway donne 5 $ de crédits pendant 30 jours, sans carte ; le plan Trial comme le
plan Free incluent **0,5 Go de volume** (largement assez pour cette base SQLite) et limitent le service à
1 vCPU / 0,5 Go de RAM, ce que `next start` occupe sans problème. Ensuite, comptez 1-5 $/mois selon l'usage
(≈2-4 €/mois pour cette app), le volume au-delà de 0,5 Go étant facturé 0,15 $/Go/mois. Pour rester à 0 €,
Fly.io (volume + free allowance) ou un VPS mutualisé font le même travail.

### 1. Créer le service

Depuis le dashboard : **New project → Deploy from GitHub repo**, repo `ck526438-lgtm/creneau`, branche
`main` (installer l'App Railway sur le repo quand il le demande). Chaque push redéploie.

Ou depuis le CLI :

```bash
npm i -g @railway/cli
railway login
railway init                 # ou railway link sur un projet déjà créé
railway up                   # construit et déploie le dossier courant
railway domain               # génère https://<nom>.up.railway.com
```

Railway lit `railway.json` : builder `DOCKERFILE`, healthcheck `/api/health`, redémarrage `ON_FAILURE`.

### 2. Attacher le volume — obligatoire

Onglet **Volumes** du service → nouveau volume, mount path **exactement `/data`**. Sans ça, la base est
effacée à chaque redéploiement. Le conteneur y écrit `dev.db` (`DATABASE_URL=file:/data/dev.db`, déjà la
valeur par défaut de l'image).

### 3. Variables du service

| Variable | Valeur | Rôle |
|---|---|---|
| `SESSION_SECRET` | `openssl rand -hex 32` | signé les sessions ; l'app refuse de démarrer sans en production |
| `APP_URL` | `https://<domaine>` | liens d'annulation et de report dans les emails |
| `CRON_SECRET` | une autre chaîne aléatoire | protège `GET /api/cron/reminders` (obligatoire : sans lui, pas de rappels) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `MAIL_FROM` | Brevo, Resend… | sinon les emails sont écrits dans `outbox/`, un dossier éphémère du conteneur : personne ne les reçoit |
| `SEED_DEMO` | `1`, seulement au premier boot | crée `demo@creneau.app` / `demo1234` et la page `/b/demo-cabinet` ; à retirer ensuite (mot de passe public) |
| `DATABASE_URL` | `file:/data/dev.db` | utile uniquement si vous changez le mount path |

### 4. Domaine public puis redéploiement

Settings → Networking → **Generate Domain**, recopier l'URL dans `APP_URL`, redéployer (les emails déjà
envoyés gardent l'ancienne URL).

### 5. Vérifier

```bash
curl -s https://<domaine>/api/health
# {"ok":true,"db":"up","email":"smtp"}   → "outbox" signifie SMTP absent
```

Puis réserver un créneau sur `/b/demo-cabinet` (ou son propre lien après inscription) : confirmation par
email, deuxième clic rejeté par l'anti double-booking, annulation et report possibles via `/r/<token>`.

### 6. Rappels J-1

`.github/workflows/reminders.yml` appelle `/api/cron/reminders` à chaque heure. Pour l'activer : repo →
Settings → Secrets and variables → Actions → secret `CRON_SECRET` + variable `APP_URL`, onglet Actions →
« rappels J-1 » → *Run workflow* pour tester. Sans cron déclenché, aucun rappel ne part.

### 7. Sauvegardes

Le volume survvit aux redéploiements mais pas à la suppression du projet : snapshot **Backup/Restore** du
volume dans le dashboard, ou sauvegarde quotidienne de `/data/dev.db` (une seule base fichier).

## Déploiement Docker (VPS, Fly.io, machine locale)

Le `Dockerfile` pousse le schéma au démarrage, attend un disque persistant sur `/data`, écoute sur
`$PORT` (défaut 3000) et déclare `/api/health` en healthcheck.

```bash
docker build -t creneau .
docker run -d --name creneau -p 3000:3000 -v creneau-data:/data \
  -e SESSION_SECRET="$(openssl rand -hex 32)" -e APP_URL=https://mondomaine.fr \
  -e CRON_SECRET="$(openssl rand -hex 16)" \
  -e SMTP_HOST=... -e SMTP_USER=... -e SMTP_PASS=... -e MAIL_FROM=... \
  creneau
```

Sauvegarde : `sqlite3 /data/dev.db ".backup /backups/creneau-$(date +%F).db"` dans une tâche quotidienne.

Postgres/Turso : le schéma Prisma est presque transposable, mais il faudra changer le `provider`, remplacer
les requêtes SQLite et revoir `DATABASE_URL` — à prévoir seulement si vous sortez du disque persistant.

## Mise en ligne gratuite (0 €/mois ou presque)

Pour héberger sans payer dès le départ :

| Besoin | Solution gratuite |
|---|---|
| Serveur + disque persistant | Fly.io (free allowance, volume) ou un VPS mutualisé (~3 €/mois si vous voulez vraiment dormir tranquille) |
| Emails transactionnels | Brevo (300/jour) ou Resend (3 000/mois) — SPF/DKIM à valider sur votre domaine |
| Cron des rappels | `cron-job.org` / GitHub Actions toutes les heures sur `/api/cron/reminders` |
| Sauvegarde | tâche quotidienne `sqlite3 .backup` + push du fichier vers un dépôt privé ou rclone |
| HTTPS + domaine | gérés par l’hébergeur (Let’s Encrypt) |

## Avant de mettre en ligne

1. Compléter les pages légales (les crochets `[…]`) et créer le compte SMTP.
2. Renseigner `SESSION_SECRET`, `APP_URL`, `CRON_SECRET`, puis activer le cron des rappels.
3. Sauvegardes automatiques de `/data/dev.db` dès le premier utilisateur réel.
4. Plus tard, si vous voulez encaisser : Stripe (abonnements) + affichage du prix réel. Rien n’est branché
   aujourd’hui, et le produit est annoncé gratuit — ne changez pas l’un sans l’autre.

## Ce qui est vendu

| | |
|---|---|
| Lien public | `/b/identifiant`, page à la marque (nom, accroche, bio, couleur) |
| Prestations | durée, marge avant/après, lieu (visio, sur place, téléphone), prix affiché |
| Créneaux | générés dans le fuseau de l'hôte, affichés dans celui du client |
| Anti double-booking | revalidation serveur à chaque réservation + marge tampon |
| Blocages | plages indisponibles (congés, formation) qui retirent les créneaux |
| Automatisation | email de confirmation visiteur, notification hôte, rappel J-1, lien d'annulation et de report, export .ics |
| Prix et devises | prix affiché par prestation, en FCFA (XOF/XAF), €, dirham, dinar, CHF, CAD, USD… ; devise proposée selon le fuseau à l'inscription ; paiement hors ligne |
| Règles de réservation | délai minimum avant un RDV (0 à 48 h), horizon (7 à 365 jours), téléphone obligatoire |
| WhatsApp | bouton « Envoyer sur WhatsApp » pour partager son lien ; bouton WhatsApp sur chaque RDV dont le numéro est au format international |
| Démarrage | guide en 4 étapes sur l'agenda jusqu'à la première réservation |
| Compte | inscription (fuseau détecté automatiquement), connexion, session signée, mot de passe oublié / réinitialisation, changement de mot de passe qui déconnecte les autres appareils |
| Sécurité | réservations sérialisées par agenda (deux clients ne peuvent pas prendre le même créneau), validation serveur des formulaires, limitation de débit, en-têtes anti-clickjacking (la page `/b/…` reste intégrable en iframe), jetons de gestion jamais transmis en Referer |
