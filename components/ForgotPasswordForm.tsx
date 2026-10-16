'use client';

import { useActionState } from 'react';
import { forgotPasswordAction, type AuthState } from '@/actions/auth';

export default function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, {} as AuthState);

  if (state.ok) {
    return (
      <p className="rounded-xl bg-emerald-50 px-3.5 py-3 text-[14px] leading-relaxed text-emerald-700">
        Si un compte correspond à cet email, un lien de réinitialisation vient de partir. Il expire dans 45
        minutes.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="label" htmlFor="email">
          Email du compte
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
      {state.error && (
        <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-[14px] text-rose-700">{state.error}</p>
      )}
      <button type="submit" disabled={pending} className="btn-primary w-full py-3">
        {pending ? 'Envoi en cours…' : 'M’envoyer un lien'}
      </button>
    </form>
  );
}
