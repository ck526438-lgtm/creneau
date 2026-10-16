'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { saveServiceAction, type SaveState } from '@/actions/config';
import { DURATIONS, LOCATION_KINDS, SERVICE_COLORS, type LocationKindValue } from '@/lib/constants';

export type ServiceDraft = {
  id?: string;
  title: string;
  description: string;
  durationMin: number;
  bufferBeforeMin: number;
  bufferAfterMin: number;
  locationKind: LocationKindValue;
  locationValue: string;
  active: boolean;
  colorIndex: number;
};

export const EMPTY_SERVICE: ServiceDraft = {
  title: '',
  description: '',
  durationMin: 30,
  bufferBeforeMin: 0,
  bufferAfterMin: 0,
  locationKind: 'VIDEO',
  locationValue: '',
  active: true,
  colorIndex: 0,
};

export default function ServiceForm({ initial }: { initial: ServiceDraft }) {
  const [draft, setDraft] = useState<ServiceDraft>(initial);
  const [state, setState] = useState<SaveState>({});
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const set = <K extends keyof ServiceDraft>(key: K, value: ServiceDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const kindHint = LOCATION_KINDS.find((k) => k.value === draft.locationKind)?.hint ?? '';

  function submit() {
    setState({});
    startTransition(async () => {
      const result = await saveServiceAction(draft);
      if (result.saved) {
        router.push('/dashboard/services');
        router.refresh();
        return;
      }
      setState(result);
    });
  }

  return (
    <div className="card max-w-2xl p-6 sm:p-7">
      <div className="space-y-5">
        <div>
          <label className="label">Titre de la prestation</label>
          <input
            className="field"
            value={draft.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Appel découverte, Séance 1 h, Audit…"
          />
        </div>

        <div>
          <label className="label">Description visible par le client</label>
          <textarea
            className="field min-h-[88px]"
            value={draft.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Ce qui se passe pendant ce rendez-vous, ce que le client doit préparer."
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label className="label">Durée</label>
            <select
              className="field"
              value={draft.durationMin}
              onChange={(e) => set('durationMin', Number(e.target.value))}
            >
              {DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {d} min
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Marge avant</label>
            <select
              className="field"
              value={draft.bufferBeforeMin}
              onChange={(e) => set('bufferBeforeMin', Number(e.target.value))}
            >
              {[0, 5, 10, 15, 30].map((d) => (
                <option key={d} value={d}>
                  {d} min
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Marge après</label>
            <select
              className="field"
              value={draft.bufferAfterMin}
              onChange={(e) => set('bufferAfterMin', Number(e.target.value))}
            >
              {[0, 5, 10, 15, 30].map((d) => (
                <option key={d} value={d}>
                  {d} min
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Lieu du rendez-vous</label>
          <div className="flex flex-wrap gap-2">
            {LOCATION_KINDS.map((k) => (
              <button
                key={k.value}
                type="button"
                onClick={() => set('locationKind', k.value)}
                className={`rounded-xl border px-3.5 py-2 text-[14px] font-medium transition ${
                  draft.locationKind === k.value
                    ? 'border-ink-900 bg-ink-900 text-white'
                    : 'border-ink-200 bg-white text-ink-700 hover:bg-ink-50'
                }`}
              >
                {k.label}
              </button>
            ))}
          </div>
          <input
            className="field mt-3"
            value={draft.locationValue}
            onChange={(e) => set('locationValue', e.target.value)}
            placeholder={
              draft.locationKind === 'VIDEO'
                ? 'https://meet.google.com/xxx-xxxx'
                : draft.locationKind === 'OFFICE'
                  ? '12 rue des Lilas, 75011 Paris'
                  : 'Numéro affiché au client (optionnel)'
            }
          />
          <p className="mt-1.5 text-[12px] text-ink-500">{kindHint}</p>
        </div>

        <div>
          <label className="label">Couleur dans l’agenda</label>
          <div className="flex gap-2">
            {SERVICE_COLORS.map((c, i) => (
              <button
                key={c}
                type="button"
                onClick={() => set('colorIndex', i)}
                aria-label={`Couleur ${i + 1}`}
                className={`h-8 w-8 rounded-lg transition ${
                  draft.colorIndex === i ? 'ring-2 ring-ink-900 ring-offset-2' : ''
                }`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2.5 text-[14px] text-ink-700">
          <input
            type="checkbox"
            checked={draft.active}
            onChange={(e) => set('active', e.target.checked)}
            className="h-4 w-4 rounded border-ink-300"
          />
          Visible sur ma page de réservation
        </label>

        {state.error && (
          <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-[14px] text-rose-700">{state.error}</p>
        )}

        <div className="flex flex-wrap gap-3 border-t border-ink-200 pt-5">
          <button onClick={submit} disabled={pending} className="btn-primary">
            {pending ? 'Enregistrement…' : 'Enregistrer'}
          </button>
          <button onClick={() => router.back()} className="btn-secondary">
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
