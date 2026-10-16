'use client';

import { useActionState } from 'react';
import type { AuthState } from '@/actions/auth';

export default function AuthForm({
  action,
  submitLabel,
  mode,
  next,
}: {
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
  submitLabel: string;
  mode: 'login' | 'signup';
  next?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-4">
      {mode === 'signup' && (
        <div>
          <label className="label" htmlFor="name">
            Votre nom
          </label>
          <input id="name" name="name" className="field" placeholder="Camille Dubois" required />
        </div>
      )}
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          className="field"
          placeholder="vous@exemple.fr"
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          className="field"
          placeholder="••••••••"
          minLength={8}
          required
        />
      </div>
      {mode === 'login' && next && <input type="hidden" name="next" value={next} />}
      {state.error && (
        <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-[14px] text-rose-700">{state.error}</p>
      )}
      <button type="submit" disabled={pending} className="btn-primary w-full py-3">
        {pending ? 'Un instant…' : submitLabel}
      </button>
    </form>
  );
}
