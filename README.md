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
npx tsx scripts/check.ts  # 18 vérifications : fuseaux/DST, buffers, anti double-booking, annulation…
npx tsc --noEmit
npm run build
```

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
par un cron externe, avec `Authorization: Bearer <CRON_SECRET>`).

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
| `CRON_SECRET` | une autre chaîne aléatoire | protège `GET /api/cron/reminders` |
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
| Compte | inscription, connexion, session signée, mot de passe oublié / réinitialisation |
