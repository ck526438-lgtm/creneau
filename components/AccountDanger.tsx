'use client';

import { useActionState } from 'react';
import { deleteAccountAction, type AccountState } from '@/actions/account';

export default function AccountDanger({ upcoming }: { upcoming: number }) {
  const [state, formAction, pending] = useActionState(deleteAccountAction, {} as AccountState);

  return (
    <section className="mt-10 rounded-2xl border border-rose-200 bg-white p-6 sm:p-7">
      <h2 className="text-[15px] font-semibold text-ink-900">Vos données</h2>
      <p className="mt-1 text-[14px] leading-relaxed text-ink-600">
        Creneau ne garde que ce qui est nécessaire à l’agenda : compte, prestations, disponibilités,
        rendez-vous. Vous pouvez tout récupérer ou tout effacer, sans nous écrire.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <a href="/api/export" className="btn-secondary">
          Exporter mes données (.json)
        </a>
        <span className="text-[13px] text-ink-500">Aucun mot de passe ni donnée bancaire n’est exporté.</span>
      </div>

      <div className="mt-7 border-t border-rose-100 pt-6">
        <h3 className="text-[15px] font-semibold text-rose-700">Supprimer le compte</h3>
        <p className="mt-1 text-[14px] leading-relaxed text-ink-600">
          {upcoming > 0
            ? `${upcoming} rendez-vous à venir. Vos clients seront prévenus par email, puis tout sera effacé définitivement.`
            : 'Prestations, disponibilités, blocages et historique de rendez-vous seront effacés définitivement.'}
        </p>
        <form action={formAction} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1">
            <label className="label" htmlFor="delete-password">
              Mot de passe du compte
            </label>
            <input
              id="delete-password"
              name="password"
              type="password"
              autoComplete="current-password"
              className="field"
              placeholder="Pour vérifier que c’est bien vous"
              required
            />
            <label className="mt-3 flex items-start gap-2 text-[13px] leading-relaxed text-ink-600">
              <input type="checkbox" name="confirmUpcoming" className="mt-0.5 h-4 w-4 rounded border-ink-300" />
              Je confirme la suppression {upcoming > 0 ? 'et l’annulation des rendez-vous à venir' : 'définitive'}
              .
            </label>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-[15px] font-semibold text-white transition hover:bg-rose-700 active:scale-[.99] disabled:opacity-50"
          >
            {pending ? 'Suppression…' : 'Supprimer mon compte'}
          </button>
        </form>
        {state.error && (
          <p className="mt-3 rounded-xl bg-rose-50 px-3.5 py-2.5 text-[14px] text-rose-700">{state.error}</p>
        )}
      </div>
    </section>
  );
}
