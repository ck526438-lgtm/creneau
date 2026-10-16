'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { saveAvailabilityAction, type SaveState } from '@/actions/config';
import { fromMinutes, toMinutes, WEEKDAYS } from '@/lib/constants';

type Rule = { weekday: number; startMin: number; endMin: number };

const PRESETS: { label: string; build: () => Rule[] }[] = [
  {
    label: 'Lun → Ven, 9 h – 18 h',
    build: () => [1, 2, 3, 4, 5].map((weekday) => ({ weekday, startMin: 540, endMin: 1080 })),
  },
  {
    label: '9 h – 12 h 30 et 14 h – 18 h',
    build: () =>
      [1, 2, 3, 4, 5].flatMap((weekday) => [
        { weekday, startMin: 540, endMin: 750 },
        { weekday, startMin: 840, endMin: 1080 },
      ]),
  },
  {
    label: 'Lun → Sam, 8 h – 20 h',
    build: () => [1, 2, 3, 4, 5, 6].map((weekday) => ({ weekday, startMin: 480, endMin: 1200 })),
  },
];

export default function AvailabilityEditor({ initial }: { initial: Rule[] }) {
  const [rules, setRules] = useState<Rule[]>(initial);
  const [state, setState] = useState<SaveState>({});
  const [pending, start] = useTransition();
  const router = useRouter();

  const update = (index: number, patch: Partial<Rule>) =>
    setRules((rs) => rs.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  function add(weekday: number) {
    setRules((rs) => [...rs, { weekday, startMin: 540, endMin: 1080 }]);
  }

  const save = () => {
    setState({});
    start(async () => {
      const result = await saveAvailabilityAction(rules);
      setState(result);
      if (result.saved) router.refresh();
    });
  };

  const byDay = (index: number) =>
    rules
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => r.weekday === index)
      .sort((a, b) => a.r.startMin - b.r.startMin);

  return (
    <div className="space-y-5">
      <div className="card p-6">
        <p className="mb-3 text-[13px] font-medium text-ink-600">Modèles rapides</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => setRules(p.build())}
              className="rounded-xl border border-ink-200 bg-white px-3.5 py-2 text-[13px] font-medium text-ink-700 hover:bg-ink-50"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card divide-y divide-ink-200">
        {WEEKDAYS.map((day) => {
          const entries = byDay(day.index);
          return (
            <div key={day.index} className="flex flex-wrap items-center gap-3 px-5 py-4">
              <span className="w-20 shrink-0 text-[14px] font-semibold text-ink-800">{day.long}</span>
              {entries.length === 0 && (
                <span className="flex-1 text-[13px] text-ink-400">Aucun créneau</span>
              )}
              <div className="flex flex-1 flex-wrap items-center gap-3">
                {entries.map(({ r, i }) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="time"
                      value={fromMinutes(r.startMin)}
                      onChange={(e) => update(i, { startMin: toMinutes(e.target.value) })}
                      className="rounded-lg border border-ink-200 px-2 py-1.5 text-[14px]"
                    />
                    <span className="text-ink-400">→</span>
                    <input
                      type="time"
                      value={fromMinutes(r.endMin)}
                      onChange={(e) => update(i, { endMin: toMinutes(e.target.value) })}
                      className="rounded-lg border border-ink-200 px-2 py-1.5 text-[14px]"
                    />
                    <button
                      onClick={() => setRules((rs) => rs.filter((_, idx) => idx !== i))}
                      className="btn-ghost px-2 py-1 text-[13px] text-rose-600 hover:bg-rose-50"
                    >
                      Retirer
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => add(day.index)}
                className="shrink-0 text-[13px] font-semibold text-ink-600 hover:text-ink-900"
              >
                + Ajouter une plage
              </button>
            </div>
          );
        })}
      </div>

      {state.error && (
        <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-[14px] text-rose-700">{state.error}</p>
      )}
      {state.saved && (
        <p className="rounded-xl bg-emerald-50 px-3.5 py-2.5 text-[14px] text-emerald-700">
          Disponibilités enregistrées.
        </p>
      )}

      <button onClick={save} disabled={pending} className="btn-primary">
        {pending ? 'Enregistrement…' : 'Enregistrer mes disponibilités'}
      </button>
    </div>
  );
}
