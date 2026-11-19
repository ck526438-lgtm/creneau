'use client';

import { useActionState, useEffect, useRef } from 'react';
import { changePasswordAction, type PasswordState } from '@/actions/auth';

export default function PasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, {} as PasswordState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <section className="card mt-8 max-w-2xl p-6 sm:p-7">
      <h2 className="text-[15px] font-semibold text-ink-900">Mot de passe</h2>
      <p className="mt-1 text-[14px] text-ink-600">
        Changer de mot de passe déconnecte vos autres appareils.
      </p>
      <form ref={formRef} action={formAction} className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="current-password">
            Mot de passe actuel
          </label>
          <input
            id="current-password"
            name="current"
            type="password"
            autoComplete="current-password"
            className="field"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="new-password">
            Nouveau mot de passe
          </label>
          <input
            id="new-password"
            name="next"
            type="password"
            autoComplete="new-password"
            minLength={8}
            className="field"
            required
          />
        </div>
        <div className="sm:col-span-2">
          {state.error && (
            <p className="mb-3 rounded-xl bg-rose-50 px-3.5 py-2.5 text-[14px] text-rose-700">{state.error}</p>
          )}
          {state.ok && (
            <p className="mb-3 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-[14px] text-emerald-700">
              Mot de passe mis à jour.
            </p>
          )}
          <button type="submit" disabled={pending} className="btn-secondary">
            {pending ? 'Mise à jour…' : 'Changer le mot de passe'}
          </button>
        </div>
      </form>
    </section>
  );
}
