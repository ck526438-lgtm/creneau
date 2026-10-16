import nodemailer, { type Transporter } from 'nodemailer';
import { mkdir, appendFile } from 'node:fs/promises';
import path from 'node:path';

const OUTBOX_DIR = path.join(process.cwd(), 'outbox');

let cached: Transporter | null | undefined;

function transporter(): Transporter | null {
  if (cached !== undefined) return cached;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  if (!host || !user) {
    cached = null;
    return cached;
  }
  cached = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: { user, pass: process.env.SMTP_PASS ?? '' },
  });
  return cached;
}

export function mailConfigured() {
  return transporter() !== null;
}

async function writeOutbox(message: { to: string; subject: string; html: string }) {
  await mkdir(OUTBOX_DIR, { recursive: true });
  const stamp = new Date().toISOString();
  const file = path.join(OUTBOX_DIR, `${stamp.slice(0, 10)}.log`);
  await appendFile(file, `\n--- ${stamp} To: ${message.to} | ${message.subject} ---\n${message.html}\n`);
}

/** Never throws: an email failure must not break a booking. */
export async function sendMail(message: { to: string; subject: string; html: string; text?: string }) {
  const from = process.env.MAIL_FROM ?? 'Creneau <no-reply@creneau.app>';
  const t = transporter();
  try {
    if (t) {
      await t.sendMail({ from, ...message });
    } else {
      await writeOutbox(message);
    }
    return true;
  } catch (error) {
    console.error('email failed', error);
    try {
      await writeOutbox(message);
    } catch {
      /* ignore */
    }
    return false;
  }
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function layout(title: string, body: string, brandColor: string) {
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#f6f7f9;padding:28px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e6e8ec">
    <div style="background:${brandColor};padding:20px 24px;color:#fff;font-size:16px;font-weight:600">${title}</div>
    <div style="padding:24px;color:#30343b;font-size:15px;line-height:1.6">${body}</div>
  </div>
  <div style="max-width:520px;margin:12px auto 0;color:#8a9099;font-size:12px;text-align:center">Creneau — réservation en ligne</div>
</div>`;
}

export function bookingConfirmationMail(params: {
  hostName: string;
  brandColor: string;
  serviceTitle: string;
  when: string;
  location: string;
  visitorName: string;
  notes: string;
  cancelUrl: string;
  icsUrl: string;
}) {
  const subject = `RDV confirmé : ${params.serviceTitle}`;
  const html = layout(
    `Bonjour ${escapeHtml(params.visitorName)}`,
    `<p>Votre rendez-vous avec <strong>${escapeHtml(params.hostName)}</strong> est confirmé.</p>
     <table style="width:100%;border-collapse:collapse;margin:16px 0">
       <tr><td style="padding:8px 0;color:#6b7280;width:110px">Prestation</td><td style="padding:8px 0"><strong>${escapeHtml(params.serviceTitle)}</strong></td></tr>
       <tr><td style="padding:8px 0;color:#6b7280">Quand</td><td style="padding:8px 0"><strong>${escapeHtml(params.when)}</strong></td></tr>
       <tr><td style="padding:8px 0;color:#6b7280">Lieu</td><td style="padding:8px 0">${escapeHtml(params.location)}</td></tr>
     </table>
     ${params.notes ? `<p style="background:#f6f7f9;border-radius:10px;padding:12px">${escapeHtml(params.notes)}</p>` : ''}
     <p><a href="${params.icsUrl}" style="display:inline-block;background:${params.brandColor};color:#fff;text-decoration:none;padding:10px 16px;border-radius:10px;font-weight:600">Ajouter à mon agenda</a></p>
     <p style="color:#6b7280;font-size:13px">Empêché ? <a href="${params.cancelUrl}">Annuler ou reprogrammer</a> ce rendez-vous.</p>`,
    params.brandColor,
  );
  return { subject, html };
}

export function hostNotificationMail(params: {
  brandColor: string;
  hostName: string;
  visitorName: string;
  visitorEmail: string;
  visitorPhone: string;
  serviceTitle: string;
  when: string;
  notes: string;
}) {
  const subject = `Nouveau RDV : ${params.visitorName} — ${params.serviceTitle}`;
  const html = layout(
    `Nouveau rendez-vous confirmé`,
    `<p><strong>${escapeHtml(params.visitorName)}</strong> vient de réserver <strong>${escapeHtml(params.serviceTitle)}</strong>.</p>
     <table style="width:100%;border-collapse:collapse;margin:16px 0">
       <tr><td style="padding:8px 0;color:#6b7280;width:110px">Quand</td><td style="padding:8px 0"><strong>${escapeHtml(params.when)}</strong></td></tr>
       <tr><td style="padding:8px 0;color:#6b7280">Email</td><td style="padding:8px 0">${escapeHtml(params.visitorEmail)}</td></tr>
       <tr><td style="padding:8px 0;color:#6b7280">Téléphone</td><td style="padding:8px 0">${escapeHtml(params.visitorPhone || '—')}</td></tr>
     </table>
     ${params.notes ? `<p style="background:#f6f7f9;border-radius:10px;padding:12px">${escapeHtml(params.notes)}</p>` : ''}
     <p style="color:#6b7280;font-size:13px">Retrouvez tous vos rendez-vous sur votre agenda Creneau.</p>`,
    params.brandColor,
  );
  return { subject, html };
}

export function cancellationMail(params: {
  brandColor: string;
  visitorName: string;
  serviceTitle: string;
  when: string;
  hostName: string;
}) {
  const subject = `RDV annulé : ${params.serviceTitle}`;
  const html = layout(
    `Rendez-vous annulé`,
    `<p>Bonjour ${escapeHtml(params.visitorName)},</p>
     <p>Le rendez-vous <strong>${escapeHtml(params.serviceTitle)}</strong> prévu le <strong>${escapeHtml(params.when)}</strong> avec ${escapeHtml(params.hostName)} a été annulé.</p>
     <p style="color:#6b7280;font-size:13px">Si ce n'est pas vous, contactez ${escapeHtml(params.hostName)}.</p>`,
    params.brandColor,
  );
  return { subject, html };
}

export function passwordResetMail(params: {
  brandColor: string;
  name: string;
  url: string;
  minutes: number;
}) {
  const subject = 'Réinitialisation de votre mot de passe Creneau';
  const html = layout(
    'Mot de passe oublié ?',
    `<p>Bonjour ${escapeHtml(params.name)},</p>
     <p>Quelqu’un a demandé la réinitialisation du mot de passe de votre compte Creneau. Ce lien expire dans ${params.minutes} minutes.</p>
     <p><a href="${params.url}" style="display:inline-block;background:${params.brandColor};color:#fff;text-decoration:none;padding:10px 16px;border-radius:10px;font-weight:600">Choisir un nouveau mot de passe</a></p>
     <p style="color:#6b7280;font-size:13px">Si vous n’êtes pas à l’origine de cette demande, ignorez cet email : votre mot de passe actuel reste actif.</p>`,
    params.brandColor,
  );
  return { subject, html };
}

export function reminderMail(params: {
  brandColor: string;
  visitorName: string;
  serviceTitle: string;
  when: string;
  location: string;
  hostName: string;
}) {
  const subject = `Rappel de rendez-vous dans 24h`;
  const html = layout(
    `Votre rendez-vous approche`,
    `<p>Bonjour ${escapeHtml(params.visitorName)},</p>
     <p>Rappel : <strong>${escapeHtml(params.serviceTitle)}</strong> avec ${escapeHtml(params.hostName)} le <strong>${escapeHtml(params.when)}</strong>.</p>
     <p>Lieu : ${escapeHtml(params.location)}</p>`,
    params.brandColor,
  );
  return { subject, html };
}
