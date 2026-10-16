'use client';

import { useTransition } from 'react';

export default function CancelTokenForm({
  action,
  token,
}: {
  action: (token: string) => Promise<void>;
  token: string;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => {
        if (!confirm('Annuler définitivement ce rendez-vous ? L’hôte sera prévenu par email.')) return;
        start(() => action(token));
      }}
      className="btn-secondary text-rose-600 hover:bg-rose-50"
    >
      {pending ? 'Annulation…' : 'Annuler le rendez-vous'}
    </button>
  );
}
