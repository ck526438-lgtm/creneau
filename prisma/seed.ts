import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

const HOST_TZ = 'Europe/Paris';

/** minute-of-day in host wall clock -> UTC instant for a host-local date */
function at(dayOffset: number, minutes: number) {
  const base = new Date();
  const y = base.getUTCFullYear();
  const mo = base.getUTCMonth();
  const d = base.getUTCDate();
  let guess = Date.UTC(y, mo, d + dayOffset, Math.floor(minutes / 60), minutes % 60);
  for (let i = 0; i < 3; i++) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: HOST_TZ,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).formatToParts(new Date(guess));
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
    const actual = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'));
    const target = Date.UTC(y, mo, d + dayOffset, Math.floor(minutes / 60), minutes % 60);
    if (actual === target) break;
    guess += target - actual;
  }
  return new Date(guess);
}

async function main() {
  const email = 'demo@creneau.app';
  await db.user.deleteMany({ where: { email } });

  const camille = await db.user.create({
    data: {
      email,
      name: 'Camille Laurent',
      headline: 'Ostéopathe D.O. · Cabinet Paris 11',
      slug: 'demo-cabinet',
      passwordHash: await bcrypt.hash('demo1234', 10),
      timezone: HOST_TZ,
      brandColor: '#0f766e',
      bio: 'Cabinet d’ostéopathie et de bien-être. Séances sur mesure, femmes enceintes, sportifs et nourrissons. Parking à 2 minutes, métro Voltaire.',
      plan: 'PRO',
      availability: {
        create: [
          { weekday: 1, startMin: 9 * 60, endMin: 12 * 60 + 30 },
          { weekday: 1, startMin: 14 * 60, endMin: 19 * 60 },
          { weekday: 2, startMin: 9 * 60, endMin: 12 * 60 + 30 },
          { weekday: 2, startMin: 14 * 60, endMin: 19 * 60 },
          { weekday: 3, startMin: 9 * 60, endMin: 12 * 60 + 30 },
          { weekday: 3, startMin: 14 * 60, endMin: 19 * 60 },
          { weekday: 4, startMin: 9 * 60, endMin: 12 * 60 + 30 },
          { weekday: 4, startMin: 14 * 60, endMin: 19 * 60 },
          { weekday: 5, startMin: 9 * 60, endMin: 13 * 60 },
          { weekday: 6, startMin: 9 * 60, endMin: 12 * 60 },
        ],
      },
      services: {
        create: [
          {
            slug: 'seance-osteopathie',
            title: 'Séance d’ostéopathie',
            description:
              'Séance complète de 60 minutes : bilan, manipulation et conseils. Prévoyez une tenue confortable.',
            durationMin: 60,
            bufferBeforeMin: 15,
            bufferAfterMin: 15,
            colorIndex: 2,
            locationKind: 'OFFICE',
            locationValue: '18 rue Duris, 75011 Paris — salle 2',
            priceCents: 7000,
            position: 0,
          },
          {
            slug: 'premier-contact',
            title: 'Appel de pré-orientation',
            description:
              '15 minutes par visio pour cerner votre besoin et choisir la bonne séance. Gratuit.',
            durationMin: 15,
            colorIndex: 1,
            locationKind: 'VIDEO',
            locationValue: 'https://meet.google.com/wxy-abcd-efg',
            position: 1,
          },
          {
            slug: 'suivi-sportif',
            title: 'Suivi sportif (4 semaines)',
            description: 'Deux séances de 45 minutes + plan de récupération personnalisé.',
            durationMin: 45,
            bufferAfterMin: 10,
            colorIndex: 3,
            locationKind: 'OFFICE',
            locationValue: '18 rue Duris, 75011 Paris',
            priceCents: 12000,
            position: 2,
          },
        ],
      },
    },
    include: { services: true },
  });

  const svc = (slug: string) => camille.services.find((s) => s.slug === slug)!;

  await db.booking.createMany({
    data: [
      {
        userId: camille.id,
        serviceId: svc('seance-osteopathie').id,
        visitorName: 'Marc Delcourt',
        visitorEmail: 'marc.delcourt@example.com',
        visitorPhone: '06 12 34 56 78',
        visitorNotes: 'Douleur lombaire depuis le port de charges lourdes.',
        visitorTz: 'Europe/Paris',
        startsAt: at(1, 10 * 60),
        endsAt: at(1, 11 * 60),
      },
      {
        userId: camille.id,
        serviceId: svc('premier-contact').id,
        visitorName: 'Awa Traoré',
        visitorEmail: 'awa.traore@example.com',
        visitorPhone: '',
        visitorNotes: 'Première consultation, grossesse 6 mois.',
        visitorTz: 'UTC',
        startsAt: at(1, 15 * 60),
        endsAt: at(1, 15 * 60 + 15),
      },
      {
        userId: camille.id,
        serviceId: svc('suivi-sportif').id,
        visitorName: 'Julie Renard',
        visitorEmail: 'julie.renard@example.com',
        visitorPhone: '07 98 76 54 32',
        visitorNotes: 'Préparation semi-marathon.',
        startsAt: at(3, 16 * 60),
        endsAt: at(3, 16 * 60 + 45),
      },
      {
        userId: camille.id,
        serviceId: svc('seance-osteopathie').id,
        visitorName: 'Thomas Berger',
        visitorEmail: 'th.berger@example.com',
        visitorNotes: 'Raideur cervicale post-bureau.',
        startsAt: at(-4, 9 * 60 + 30),
        endsAt: at(-4, 10 * 60 + 30),
      },
      {
        userId: camille.id,
        serviceId: svc('premier-contact').id,
        visitorName: 'Sofia Marques',
        visitorEmail: 'sofia.marques@example.com',
        startsAt: at(-9, 11 * 60),
        endsAt: at(-9, 11 * 60 + 15),
      },
    ],
  });

  await db.busySlot.create({
    data: {
      userId: camille.id,
      label: 'Formation continuing',
      startsAt: at(6, 9 * 60),
      endsAt: at(6, 18 * 60),
    },
  });

  console.log('Démo créée : demo@creneau.app / demo1234 — lien /b/demo-cabinet');
  console.log(`RDV générés autour de ${HOST_TZ}, offset de départ ${new Date().toISOString()}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
