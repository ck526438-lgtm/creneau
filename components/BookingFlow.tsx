'use client';

import { useEffect, useMemo, useState } from 'react';
import { createBookingAction } from '@/actions/booking';
import { priceLabel } from '@/lib/constants';
import Logo from '@/components/Logo';

type Service = {
  id: string;
  slug: string;
  title: string;
  description: string;
  durationMin: number;
  priceCents: number;
  locationKind: string;
  locationLabel: string;
  locationValue: string;
};

type Slot = { startsAt: string; endsAt: string };

type Props = {
  host: { name: string; headline: string; bio: string; brandColor: string; timezone: string };
  services: Service[];
  locked: { token: string; serviceId: string; startsAt: string } | null;
};

function dayKey(date: Date, tz: string) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    date,
  );
}

function fmtTime(date: Date, tz: string) {
  return new Intl.DateTimeFormat('fr-FR', { timeZone: tz, hour: '2-digit', minute: '2-digit' }).format(date);
}

function fmtDay(date: Date, tz: string) {
  return new Intl.DateTimeFormat('fr-FR', { timeZone: tz, weekday: 'long', day: 'numeric', month: 'long' }).format(
    date,
  );
}

const CELL_WD = ['di', 'lu', 'ma', 'me', 'je', 've', 'sa'];

export default function BookingFlow({ host, services, locked }: Props) {
  const [visitorTz, setVisitorTz] = useState(host.timezone);
  const [chosenId, setChosenId] = useState<string | null>(locked?.serviceId ?? null);
  const service = useMemo(
    () => (chosenId ? services.find((s) => s.id === chosenId) ?? services[0] : services[0]),
    [chosenId, services],
  );
  const [step, setStep] = useState<'service' | 'time' | 'details'>(
    locked ? 'time' : services.length > 1 ? 'service' : 'time',
  );
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [done, setDone] = useState<{ id: string; token: string } | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    try {
      setVisitorTz(Intl.DateTimeFormat().resolvedOptions().timeZone || host.timezone);
    } catch {
      /* keep host tz */
    }
  }, [host.timezone]);

  useEffect(() => {
    if (!service) return;
    let cancelled = false;
    setSlots(null);
    setLoadError('');
    const qs = new URLSearchParams({ serviceId: service.id, tz: visitorTz });
    if (locked?.token) qs.set('token', locked.token);
    fetch(`/api/availability?${qs}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: { slots: Slot[] }) => {
        if (cancelled) return;
        setSlots(data.slots);
        const first = data.slots[0];
        setSelectedDay(first ? dayKey(new Date(first.startsAt), visitorTz) : null);
      })
      .catch(() => !cancelled && setLoadError('Impossible de charger les créneaux. Réessayez.'));
    return () => {
      cancelled = true;
    };
  }, [service?.id, visitorTz, locked?.token]);

  const byDay = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const s of slots ?? []) {
      const key = dayKey(new Date(s.startsAt), visitorTz);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return map;
  }, [slots, visitorTz]);

  const days = useMemo(() => {
    const list: { key: string; date: Date }[] = [];
    const cursor = new Date();
    cursor.setDate(cursor.getDate() + weekOffset * 14);
    for (let i = 0; i < 14; i++) {
      const d = new Date(cursor);
      d.setDate(cursor.getDate() + i);
      const key = dayKey(d, visitorTz);
      list.push({ key, date: d });
    }
    return list;
  }, [weekOffset, visitorTz]);

  const daySlots = selectedDay ? byDay.get(selectedDay) ?? [] : [];

  async function submit() {
    if (!service || !selectedSlot) return;
    if (!form.name.trim() || !form.email.trim()) {
      setSubmitError('Nom et email sont nécessaires.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    const result = await createBookingAction({
      serviceId: service.id,
      startsAt: selectedSlot.startsAt,
      visitorName: form.name,
      visitorEmail: form.email,
      visitorPhone: form.phone,
      visitorNotes: form.notes,
      visitorTz,
      rescheduleToken: locked?.token,
    });
    setSubmitting(false);
    if (!result.ok) {
      setSubmitError(result.error);
      setSelectedSlot(null);
      setStep('time');
      const qs = new URLSearchParams({ serviceId: service.id, tz: visitorTz });
      fetch(`/api/availability?${qs}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => data && setSlots(data.slots));
      return;
    }
    setDone({ id: result.booking.id, token: result.booking.cancelToken });
  }

  if (done) {
    const slot = selectedSlot;
    return (
      <Shell host={host}>
        <div className="animate-fade-up px-6 py-10 text-center sm:px-10">
          <div
            className="mx-auto grid h-14 w-14 animate-fade-in place-items-center rounded-2xl text-2xl text-white shadow-lg ring-1 ring-black/5"
            style={{ background: host.brandColor }}
          >
            ✓
          </div>
          <h2 className="mt-5 text-xl font-bold text-ink-900">
            {locked ? 'Rendez-vous reprogrammé' : 'Rendez-vous confirmé'}
          </h2>
          {slot && (
            <p className="mt-2 text-[15px] text-ink-600">
              {service?.title} — {fmtDay(new Date(slot.startsAt), visitorTz)} à {fmtTime(new Date(slot.startsAt), visitorTz)}
            </p>
          )}
          <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-ink-600">
            Un email de confirmation vient de partir à {form.email || 'votre adresse'}. Ajoutez le créneau à votre
            agenda pour ne pas l’oublier.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href={`/api/ics/${done.id}`}
              className="btn-primary"
              style={{ background: host.brandColor }}
            >
              Ajouter à mon agenda
            </a>
            <a href={`/r/${done.token}`} className="btn-secondary">
              Annuler / reprogrammer
            </a>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell host={host}>
      <div className="flex items-center gap-2 border-b border-ink-200 px-5 py-3.5 text-[13px] text-ink-500">
        {step === 'details' && (
          <button onClick={() => setStep('time')} className="btn-ghost -ml-2 px-2 py-1 text-[13px]">
            ← Retour
          </button>
        )}
        {locked && <span>Reprogrammation d’un rendez-vous existant</span>}
        {!locked && services.length > 1 && (
          <button onClick={() => setStep('service')} className="btn-ghost -ml-2 px-2 py-1 text-[13px]">
            {step === 'service' ? 'Choix de la prestation' : '← Changer de prestation'}
          </button>
        )}
      </div>

      {step === 'service' && (
        <div className="divide-y divide-ink-200">
          {services.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setChosenId(s.id);
                setSelectedSlot(null);
                setStep('time');
              }}
              className="flex w-full items-start gap-4 px-5 py-5 text-left transition hover:bg-ink-50"
            >
              <span className="mt-1 h-9 w-1 shrink-0 rounded-full" style={{ background: host.brandColor }} />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-ink-900">{s.title}</span>
                {s.description && (
                  <span className="mt-1 block text-[13px] leading-relaxed text-ink-600">{s.description}</span>
                )}
                <span className="mt-2 block text-[12px] font-medium text-ink-500">
                  {s.durationMin} min · {s.locationLabel}
                  {s.locationValue ? ` · ${s.locationValue}` : ''}
                  {s.priceCents > 0 ? ` · ${priceLabel(s.priceCents)}` : ''}
                </span>
              </span>
              <span className="shrink-0 self-center text-ink-400">→</span>
            </button>
          ))}
        </div>
      )}

      {step === 'time' && service && (
        <div className="px-5 py-5">
          <div className="mb-1 text-[15px] font-semibold text-ink-900">{service.title}</div>
          <p className="mb-4 text-[13px] text-ink-500">
            {service.durationMin} min · {fmtDay(new Date(), visitorTz).split(' ')[0]}… — heures locales (
            {visitorTz.replace('_', ' ')})
          </p>

          <div className="mb-3 flex items-center justify-between">
            <button
              onClick={() => setWeekOffset((w) => Math.max(0, w - 1))}
              disabled={weekOffset === 0}
              className="btn-ghost px-2 py-1"
            >
              ←
            </button>
            <span className="text-[13px] font-medium text-ink-600">
              {fmtDay(days[0].date, visitorTz).replace(/^\w/, (c) => c.toUpperCase())}
            </span>
            <button onClick={() => setWeekOffset((w) => w + 1)} className="btn-ghost px-2 py-1">
              →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {days.map(({ key, date }) => {
              const count = byDay.get(key)?.length ?? 0;
              const active = selectedDay === key;
              return (
                <button
                  key={key}
                  disabled={count === 0}
                  onClick={() => {
                    setSelectedDay(key);
                    setSelectedSlot(null);
                  }}
                  className={`flex flex-col items-center rounded-xl border px-1 py-2 transition ${
                    active
                      ? 'border-transparent text-white'
                      : count === 0
                        ? 'cursor-not-allowed border-transparent text-ink-300'
                        : 'border-ink-200 text-ink-800 hover:bg-ink-50'
                  }`}
                  style={active ? { background: host.brandColor } : undefined}
                >
                  <span className="text-[11px] uppercase opacity-70">{CELL_WD[date.getDay()]}</span>
                  <span className="text-[15px] font-semibold">{date.getDate()}</span>
                  <span className="mt-0.5 h-1 w-1 rounded-full" style={{ background: count && !active ? host.brandColor : 'transparent' }} />
                </button>
              );
            })}
          </div>

          {loadError && <p className="mt-5 text-[14px] text-rose-600">{loadError}</p>}
          {!loadError && slots && slots.length === 0 && (
            <p className="mt-5 text-[14px] text-ink-500">
              Aucun créneau disponible pour le moment. Réessayez plus tard ou contactez {host.name}.
            </p>
          )}
          {!loadError && !slots && <p className="mt-5 text-[14px] text-ink-400">Chargement des créneaux…</p>}
          {slots && selectedDay && daySlots.length === 0 && (
            <p className="mt-5 text-[14px] text-ink-500">Pas de créneau ce jour-là.</p>
          )}

          {daySlots.length > 0 && (
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {daySlots.map((s) => {
                const active = selectedSlot?.startsAt === s.startsAt;
                return (
                  <button
                    key={s.startsAt}
                    onClick={() => {
                      setSelectedSlot(s);
                      setSubmitError('');
                    }}
                    className={`rounded-xl border px-3 py-2.5 text-[14px] font-semibold transition ${
                      active ? 'border-transparent text-white' : 'border-ink-200 text-ink-800 hover:bg-ink-50'
                    }`}
                    style={active ? { background: host.brandColor } : undefined}
                  >
                    {fmtTime(new Date(s.startsAt), visitorTz)}
                  </button>
                );
              })}
            </div>
          )}

          {submitError && (
            <p className="mt-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-[14px] text-rose-700">{submitError}</p>
          )}

          <button
            onClick={() => selectedSlot && setStep('details')}
            disabled={!selectedSlot}
            className="btn-primary mt-6 w-full"
            style={selectedSlot ? { background: host.brandColor } : undefined}
          >
            {selectedSlot
              ? `Continuer — ${fmtTime(new Date(selectedSlot.startsAt), visitorTz)} le ${fmtDay(new Date(selectedSlot.startsAt), visitorTz)}`
              : 'Sélectionnez un créneau'}
          </button>
        </div>
      )}

      {step === 'details' && service && selectedSlot && (
        <div className="px-5 py-5">
          <div className="mb-5 rounded-xl border border-ink-200 bg-ink-50 p-4">
            <p className="text-[15px] font-semibold text-ink-900">{service.title}</p>
            <p className="mt-1 text-[14px] text-ink-700">
              {fmtDay(new Date(selectedSlot.startsAt), visitorTz)} à {fmtTime(new Date(selectedSlot.startsAt), visitorTz)}
            </p>
            <p className="mt-1 text-[13px] text-ink-500">
              {service.durationMin} min · {service.locationLabel}
              {service.locationValue ? ` · ${service.locationValue}` : ''}
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="label">Nom complet *</label>
              <input className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Email *</label>
              <input
                type="email"
                className="field"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="vous@exemple.fr"
              />
            </div>
            <div>
              <label className="label">Téléphone</label>
              <input className="field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="label">Motif, précisions</label>
              <textarea
                className="field min-h-[84px]"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Ce que vous souhaitez aborder (optionnel)"
              />
            </div>
            {submitError && (
              <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-[14px] text-rose-700">{submitError}</p>
            )}
            <button onClick={submit} disabled={submitting} className="btn-primary w-full py-3" style={{ background: host.brandColor }}>
              {submitting ? 'Confirmation…' : locked ? 'Confirmer le nouveau créneau' : 'Confirmer le rendez-vous'}
            </button>
            <p className="text-center text-[12px] text-ink-500">
              Vos informations ne servent qu’à organiser ce rendez-vous.
            </p>
          </div>
        </div>
      )}
    </Shell>
  );
}

function Shell({
  host,
  children,
}: {
  host: Props['host'];
  children: React.ReactNode;
}) {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-ink-50 px-4 py-8 sm:py-14">
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 animate-float-slow rounded-full bg-sage-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-80 w-80 animate-float rounded-full bg-copper-400/15 blur-3xl" />
      <div className="relative mx-auto max-w-2xl">
        <div className="mb-6 flex animate-fade-up items-center gap-3.5">
          <span
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-[17px] font-bold text-white shadow-md ring-1 ring-black/5 transition hover:scale-105"
            style={{ background: host.brandColor }}
          >
            {host.name.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-[19px] font-bold tracking-tight text-ink-900">{host.name}</h1>
            {host.headline && <p className="truncate text-[14px] text-ink-600">{host.headline}</p>}
          </div>
        </div>
        {host.bio && <p className="mb-6 max-w-xl text-[14px] leading-relaxed text-ink-600">{host.bio}</p>}
        <div className="card animate-fade-up overflow-hidden [animation-delay:120ms]">{children}</div>
        <p className="mt-6 flex animate-fade-in items-center justify-center gap-1.5 text-[12px] text-ink-400 [animation-delay:400ms]">
          <Logo size={16} className="rounded-md ring-1 ring-black/5" />
          Propulsé par Creneau
        </p>
      </div>
    </main>
  );
}
