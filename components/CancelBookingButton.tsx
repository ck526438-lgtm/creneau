'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export default function CancelBookingButton({
  action,
  id,
  label = 'Annuler',
}: {
  action: (id: string) => Promise<void>;
  id: string;
  label?: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <button
      onClick={() => {
        if (!confirm('Annuler ce rendez-vous ? Le client sera prévenu par email.')) return;
        startTransition(async () => {
          await action(id);
          router.refresh();
        });
      }}
      disabled={pending}
      className="btn-ghost px-2 py-1 text-[13px] text-rose-600 hover:bg-rose-50 hover:text-rose-700"
    >
      {pending ? '…' : label}
    </button>
  );
}
