'use client';

import { useActionState } from 'react';
import { resetPasswordAction, type AuthState } from '@/actions/auth';

export default function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, {} as AuthState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <label className="label" htmlFor="password">
          Nouveau mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          className="field"
          placeholder="8 caractères minimum"
          minLength={8}
          required
        />
      </div>
      {state.error && (
        <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-[14px] text-rose-700">{state.error}</p>
      )}
      <button type="submit" disabled={pending} className="btn-primary w-full py-3">
        {pending ? 'Enregistrement…' : 'Enregistrer et me connecter'}
      </button>
    </form>
  );
}
