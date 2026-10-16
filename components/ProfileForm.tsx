'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { saveProfileAction, type SaveState } from '@/actions/config';

type Draft = {
  name: string;
  headline: string;
  slug: string;
  timezone: string;
  brandColor: string;
  bio: string;
  remindersOn: boolean;
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
                  {z.replace('_', ' ')}
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
