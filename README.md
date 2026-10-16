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

## Déploiement

SQLite impose un disque persistant : Railway, Fly.io, un VPS, ou Docker (le `Dockerfile` pousse le
schéma au démarrage, monte `/data` pour la base et déclare `/api/health` en healthcheck).

```bash
docker build -t creneau .
docker run -p 3000:3000 -v creneau-data:/data \
  -e SESSION_SECRET="$(openssl rand -hex 32)" -e APP_URL=https://mondomaine.fr \
  -e SMTP_HOST=... -e SMTP_USER=... -e SMTP_PASS=... -e CRON_SECRET=... \
  creneau
```

Sauvegarde : une seule base fichier, donc `sqlite3 /data/dev.db ".backup /backups/creneau-$(date +%F).db"`
dans une tâche quotidienne suffit (à activer avant le premier client payant).

Sur Vercel : remplacer SQLite par Postgres/Turso (le schéma Prisma est déjà prêt, il suffit de
changer le `provider` et de pousser).

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
