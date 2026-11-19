import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { db } from './db';

const COOKIE_NAME = 'creneau_session';
const MAX_AGE_DAYS = 30;

function secretKey() {
  const secret = process.env.SESSION_SECRET ?? '';
  if (secret.length >= 32) return new TextEncoder().encode(secret);
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET : définir une chaîne aléatoire d’au moins 32 caractères.');
  }
  return new TextEncoder().encode('dev-secret-please-replace-in-production-0123456789');
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string, version = 0) {
  const token = await new SignJWT({ sub: userId, v: version })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_DAYS}d`)
    .sign(secretKey());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: MAX_AGE_DAYS * 86_400,
    path: '/',
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

async function sessionClaims() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (typeof payload.sub !== 'string') return null;
    return { id: payload.sub, version: typeof payload.v === 'number' ? payload.v : 0 };
  } catch {
    return null;
  }
}

export async function sessionUserId() {
  return (await sessionClaims())?.id ?? null;
}

/**
 * Utilisateur connecté. Une session émise avant le dernier changement de mot de passe
 * (sessionVersion plus ancienne) est refusée : changer de mot de passe déconnecte les autres appareils.
 */
export async function currentUser() {
  const claims = await sessionClaims();
  if (!claims) return null;
  const user = await db.user.findUnique({ where: { id: claims.id } });
  if (!user || user.sessionVersion !== claims.version) return null;
  return user;
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new Error('AUTH_REQUIRED');
  return user;
}
