'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { addBusyAction, deleteBusyAction } from '@/actions/config';

type Block = { id: string; label: string; from: string; to: string };

function todayInput(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function BusyManager({ blocks, timezone }: { blocks: Block[]; timezone: string }) {
  const [label, setLabel] = useState('');
  const [start, setStart] = useState(`${todayInput(1)}T09:00`);
  const [end, setEnd] = useState(`${todayInput(1)}T18:00`);
  const [message, setMessage] = useState('');
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const add = () =>
    startTransition(async () => {
      const result = await addBusyAction({ label, startsAt: start, endsAt: end, tz: timezone });
      setMessage(result.error ?? '');
      if (result.saved) {
        setLabel('');
        router.refresh();
      }
    });

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1 sm:col-span-2">
            <label className="label">Motif</label>
            <input
              className="field"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Congés, séminaire…"
            />
          </div>
          <div>
            <label className="label">Début</label>
            <input
              type="datetime-local"
              className="field"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Fin</label>
            <input type="datetime-local" className="field" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <div className="flex items-end">
            <button onClick={add} disabled={pending} className="btn-primary w-full">
              {pending ? '…' : 'Bloquer'}
            </button>
          </div>
        </div>
        {message && <p className="mt-3 text-[13px] text-rose-600">{message}</p>}
      </div>

      {blocks.length > 0 && (
        <div className="card divide-y divide-ink-200">
          {blocks.map((b) => (
            <div key={b.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
              <div className="min-w-0">
                <p className="truncate text-[14px] font-medium text-ink-900">{b.label}</p>
                <p className="text-[13px] text-ink-500">
                  {b.from} → {b.to}
                </p>
              </div>
              <button
                onClick={() =>
                  startTransition(async () => {
                    await deleteBusyAction(b.id);
                    router.refresh();
                  })
                }
                className="btn-ghost px-2 py-1 text-[13px] text-rose-600 hover:bg-rose-50"
              >
                Libérer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
