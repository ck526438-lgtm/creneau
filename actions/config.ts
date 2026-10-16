'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { slugify } from '@/lib/constants';
import { wallToUtc } from '@/lib/time';

export type SaveState = { error?: string; saved?: boolean; id?: string };

const serviceSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(2, 'Donnez un titre à votre prestation.'),
  description: z.string().trim().max(500).default(''),
  durationMin: z.coerce.number().int().min(5).max(480),
  bufferBeforeMin: z.coerce.number().int().min(0).max(180).default(0),
  bufferAfterMin: z.coerce.number().int().min(0).max(180).default(0),
  locationKind: z.enum(['VIDEO', 'OFFICE', 'PHONE']),
  locationValue: z.string().trim().max(300).default(''),
  active: z.coerce.boolean().default(true),
  colorIndex: z.coerce.number().int().min(0).max(5).default(0),
});

export async function saveServiceAction(input: z.input<typeof serviceSchema>): Promise<SaveState> {
  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Formulaire incomplet.' };
  }
  const user = await requireUser();
  const data = parsed.data;
  const baseSlug = slugify(data.title) || 'prestation';

  try {
    if (data.id) {
      const owned = await db.service.findFirst({ where: { id: data.id, userId: user.id } });
      if (!owned) return { error: 'Prestation introuvable.' };
      let slug = baseSlug;
      let i = 1;
      while (
        await db.service.findFirst({ where: { userId: user.id, slug, NOT: { id: data.id } } })
      ) {
        slug = `${baseSlug}-${i++}`;
      }
      await db.service.update({ where: { id: data.id }, data: { ...data, slug } });
      revalidatePath('/dashboard/services');
      return { saved: true, id: data.id };
    }

    const count = await db.service.count({ where: { userId: user.id } });
    let slug = baseSlug;
    let i = 1;
    while (await db.service.findFirst({ where: { userId: user.id, slug } })) {
      slug = `${baseSlug}-${i++}`;
    }
    const created = await db.service.create({
      data: { ...data, slug, userId: user.id, position: count },
    });
    revalidatePath('/dashboard/services');
    return { saved: true, id: created.id };
  } catch (error) {
    console.error(error);
    return { error: 'Enregistrement impossible.' };
  }
}

export async function toggleServiceAction(id: string, active: boolean) {
  const user = await requireUser();
  await db.service.updateMany({ where: { id, userId: user.id }, data: { active } });
  revalidatePath('/dashboard/services');
}

export async function deleteServiceAction(id: string) {
  const user = await requireUser();
  await db.service.deleteMany({ where: { id, userId: user.id } });
  revalidatePath('/dashboard/services');
}

const ruleSchema = z.object({
  weekday: z.coerce.number().int().min(0).max(6),
  startMin: z.coerce.number().int().min(0).max(1439),
  endMin: z.coerce.number().int().min(1).max(1440),
});

export async function saveAvailabilityAction(
  rules: z.infer<typeof ruleSchema>[],
): Promise<SaveState> {
  const user = await requireUser();
  const parsed = z.array(ruleSchema).safeParse(rules);
  if (!parsed.success) return { error: 'Horaires invalides.' };

  const cleaned = parsed.data.filter((r) => r.endMin > r.startMin);
  if (cleaned.length === 0) return { error: 'Ajoutez au moins une plage horaire.' };

  await db.$transaction([
    db.availability.deleteMany({ where: { userId: user.id } }),
    db.availability.createMany({ data: cleaned.map((r) => ({ ...r, userId: user.id })) }),
  ]);
  revalidatePath('/dashboard/availability');
  revalidatePath('/dashboard');
  return { saved: true };
}

export async function addBusyAction(input: {
  label: string;
  /** wall-clock en heures *du fuseau de l'hôte* : "YYYY-MM-DDTHH:MM" */
  startsAt: string;
  endsAt: string;
  tz: string;
}) {
  const user = await requireUser();
  const start = wallFromInput(input.tz, input.startsAt);
  const end = wallFromInput(input.tz, input.endsAt);
  if (!start || !end) return { error: 'Dates invalides.' };
  if (end <= start) return { error: 'La fin doit être après le début.' };
  await db.busySlot.create({
    data: { userId: user.id, label: input.label.trim() || 'Indisponible', startsAt: start, endsAt: end },
  });
  revalidatePath('/dashboard/availability');
  return { saved: true };
}

function wallFromInput(tz: string, value: string): Date | null {
  const [datePart, timePart] = value.split('T');
  const [y, mo, d] = (datePart ?? '').split('-').map(Number);
  const [h, mi] = (timePart ?? '').split(':').map(Number);
  if (!y || !mo || !d || Number.isNaN(h) || Number.isNaN(mi)) return null;
  return wallToUtc(tz, y, mo, d, h * 60 + mi);
}

export async function deleteBusyAction(id: string) {
  const user = await requireUser();
  await db.busySlot.deleteMany({ where: { id, userId: user.id } });
  revalidatePath('/dashboard/availability');
}

const profileSchema = z.object({
  name: z.string().trim().min(2),
  headline: z.string().trim().max(80).default(''),
  slug: z.string().trim().min(2),
  timezone: z.string().trim().min(1),
  brandColor: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/),
  bio: z.string().trim().max(300).default(''),
  remindersOn: z.coerce.boolean().default(true),
});

export async function saveProfileAction(input: z.input<typeof profileSchema>): Promise<SaveState> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Réglages invalides.' };
  }
  const user = await requireUser();
  const slug = slugify(parsed.data.slug);
  if (!slug) return { error: 'L’identifiant de lien est trop court.' };
  if (!isValidTz(parsed.data.timezone)) return { error: 'Fuseau horaire inconnu.' };

  const clash = await db.user.findFirst({ where: { slug, id: { not: user.id } } });
  if (clash) return { error: `L’adresse /b/${slug} est déjà prise.` };

  await db.user.update({ where: { id: user.id }, data: { ...parsed.data, slug } });
  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard');
  return { saved: true };
}

function isValidTz(tz: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
