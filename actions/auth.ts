'use server';

import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { createSession, destroySession, hashPassword, verifyPassword } from '@/lib/auth';
import { slugify } from '@/lib/constants';
import { appUrl } from '@/lib/bookings';
import { passwordResetMail, sendMail } from '@/lib/mail';
import { clientIp, tooMuch } from '@/lib/rate';

const signupSchema = z.object({
  name: z.string().trim().min(2, 'Votre nom fait au moins 2 caractères.'),
  email: z.string().trim().toLowerCase().email('Adresse email invalide.'),
  password: z.string().min(8, 'Mot de passe : 8 caractères minimum.'),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase(),
  password: z.string(),
});

export type AuthState = { error?: string; ok?: boolean };

async function uniqueSlug(base: string) {
  const root = slugify(base) || 'mon-agenda';
  let candidate = root;
  let i = 1;
  while (await db.user.findUnique({ where: { slug: candidate } })) {
    candidate = `${root}-${i++}`;
  }
  return candidate;
}

export async function signupAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signupSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Formulaire incomplet.' };
  }

  const existing = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return { error: 'Un compte existe déjà avec cet email.' };

  const ip = await clientIp();
  if (tooMuch(`signup:${ip}`, 5, 60 * 60_000)) {
    return { error: 'Trop de comptes créés depuis votre connexion. Réessayez plus tard.' };
  }

  const user = await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
      slug: await uniqueSlug(parsed.data.name),
      availability: {
        create: [1, 2, 3, 4, 5].flatMap((weekday) => [
          { weekday, startMin: 9 * 60, endMin: 12 * 60 + 30 },
          { weekday, startMin: 13 * 60 + 30, endMin: 18 * 60 },
        ]),
      },
      services: {
        create: {
          slug: 'appel-decouverte',
          title: 'Appel découverte',
          description: 'Un premier échange de 30 minutes pour comprendre votre besoin.',
          durationMin: 30,
          locationKind: 'VIDEO',
          position: 0,
        },
      },
    },
  });

  await createSession(user.id);
  redirect('/dashboard');
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) return { error: 'Formulaire incomplet.' };

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  const ip = await clientIp();
  if (tooMuch(`login:${ip}:${parsed.data.email}`, 8, 15 * 60_000)) {
    return { error: 'Trop de tentatives. Réessayez dans 15 minutes ou utilisez « mot de passe oublié ».' };
  }
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: 'Email ou mot de passe incorrect.' };
  }

  await createSession(user.id);
  const next = String(formData.get('next') ?? '');
  redirect(next.startsWith('/dashboard') ? next : '/dashboard');
}

export async function logoutAction() {
  await destroySession();
}

const RESET_TTL_MIN = 45;

export async function forgotPasswordAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = z
    .object({ email: z.string().trim().toLowerCase().email('Adresse email invalide.') })
    .safeParse({ email: formData.get('email') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Formulaire incomplet.' };

  const ip = await clientIp();
  if (tooMuch(`forgot:${ip}`, 5, 60 * 60_000)) {
    return { error: 'Trop de demandes récentes. Réessayez dans une heure.' };
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (user) {
    await db.passwordReset.deleteMany({ where: { userId: user.id, usedAt: null } });
    const token = randomBytes(24).toString('hex');
    await db.passwordReset.create({
      data: { userId: user.id, token, expiresAt: new Date(Date.now() + RESET_TTL_MIN * 60_000) },
    });
    await sendMail({
      to: user.email,
      ...passwordResetMail({
        brandColor: user.brandColor,
        name: user.name,
        url: `${appUrl()}/reset-password?token=${token}`,
        minutes: RESET_TTL_MIN,
      }),
    });
  }

  // même réponse quel que soit le compte : ne pas confirmer l'existence d'un email
  return { ok: true };
}

export async function resetPasswordAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const token = String(formData.get('token') ?? '');
  const parsed = z
    .object({ password: z.string().min(8, 'Mot de passe : 8 caractères minimum.') })
    .safeParse({ password: formData.get('password') });
  if (!token) return { error: 'Lien de réinitialisation manquant.' };
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Mot de passe invalide.' };

  const record = await db.passwordReset.findUnique({ where: { token } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { error: 'Ce lien a expiré. Demande-en un nouveau.' };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    db.passwordReset.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);

  await createSession(record.userId);
  redirect('/dashboard');
}
