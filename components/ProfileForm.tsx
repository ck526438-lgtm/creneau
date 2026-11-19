'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { saveProfileAction, type SaveState } from '@/actions/config';
import { CURRENCIES, HORIZON_OPTIONS, NOTICE_OPTIONS } from '@/lib/constants';

type Draft = {
  name: string;
  headline: string;
  slug: string;
  timezone: string;
  brandColor: string;
  bio: string;
  remindersOn: boolean;
  currency: string;
  minNoticeMin: number;
  maxDaysAhead: number;
  requirePhone: boolean;
};

const SWATCHES = ['#4f46e5', '#0ea5e9', '#059669', '#d97706', '#db2777', '#7c3aed', '#111827'];

export default function ProfileForm({ initial, zones }: { initial: Draft; zones: string[] }) {
  const [draft, setDraft] = useState<Draft>(initial);
  const [state, setState] = useState<SaveState>({});
  const [pending, start] = useTransition();
  const router = useRouter();

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const save = () =>
    start(async () => {
      const result = await saveProfileAction(draft);
      setState(result);
      if (result.saved) router.refresh();
    });

  return (
    <div className="space-y-5">
      <div className="card max-w-2xl space-y-5 p-6 sm:p-7">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label">Nom affiché</label>
            <input className="field" value={draft.name} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div>
            <label className="label">Métier / accroche</label>
            <input
              className="field"
              value={draft.headline}
              onChange={(e) => set('headline', e.target.value)}
              placeholder="Ostéopathe D.O. · Paris 11"
            />
          </div>
        </div>

        <div>
          <label className="label">Présentation courte</label>
          <textarea
            className="field min-h-[80px]"
            value={draft.bio}
            onChange={(e) => set('bio', e.target.value)}
            placeholder="Deux phrases qui rassurent le client sur ce qu’il réserve."
          />
        </div>

        <div>
          <label className="label">Lien public</label>
          <div className="flex items-center gap-2">
            <span className="text-[14px] text-ink-500">/b/</span>
            <input
              className="field"
              value={draft.slug}
              onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label">Fuseau horaire</label>
            <select className="field" value={draft.timezone} onChange={(e) => set('timezone', e.target.value)}>
              {zones.map((z) => (
                <option key={z} value={z}>
                  {z.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Couleur de la page</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={draft.brandColor}
                onChange={(e) => set('brandColor', e.target.value)}
                className="h-10 w-12 cursor-pointer rounded-lg border border-ink-200 bg-white p-1"
              />
              {SWATCHES.map((c) => (
                <button
                  key={c}
                  onClick={() => set('brandColor', c)}
                  aria-label={`Couleur ${c}`}
                  className={`h-7 w-7 rounded-lg transition ${
                    draft.brandColor.toLowerCase() === c ? 'ring-2 ring-ink-900 ring-offset-2' : ''
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-ink-200 pt-5">
          <p className="text-[15px] font-semibold text-ink-900">Règles de réservation</p>
          <p className="mt-1 text-[13px] text-ink-500">S’appliquent à toutes vos prestations.</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label">Délai minimum avant un RDV</label>
            <select
              className="field"
              value={draft.minNoticeMin}
              onChange={(e) => set('minNoticeMin', Number(e.target.value))}
            >
              {NOTICE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-[12px] text-ink-500">Évite les réservations de dernière minute.</p>
          </div>
          <div>
            <label className="label">Réservable jusqu’à</label>
            <select
              className="field"
              value={draft.maxDaysAhead}
              onChange={(e) => set('maxDaysAhead', Number(e.target.value))}
            >
              {HORIZON_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d} jours à l’avance
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Devise des prix</label>
          <select className="field" value={draft.currency} onChange={(e) => set('currency', e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.label}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2.5 text-[14px] text-ink-700">
          <input
            type="checkbox"
            checked={draft.requirePhone}
            onChange={(e) => set('requirePhone', e.target.checked)}
            className="h-4 w-4 rounded border-ink-300"
          />
          Téléphone obligatoire pour réserver (pratique pour joindre vos clients sur WhatsApp)
        </label>

        <label className="flex items-center gap-2.5 text-[14px] text-ink-700">
          <input
            type="checkbox"
            checked={draft.remindersOn}
            onChange={(e) => set('remindersOn', e.target.checked)}
            className="h-4 w-4 rounded border-ink-300"
          />
          Envoyer un rappel automatique 24 h avant chaque rendez-vous
        </label>

        {state.error && (
          <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-[14px] text-rose-700">{state.error}</p>
        )}
        {state.saved && (
          <p className="rounded-xl bg-emerald-50 px-3.5 py-2.5 text-[14px] text-emerald-700">
            Réglages enregistrés.
          </p>
        )}

        <button onClick={save} disabled={pending} className="btn-primary">
          {pending ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}
