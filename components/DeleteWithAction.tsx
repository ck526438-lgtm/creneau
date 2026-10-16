'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export default function DeleteWithAction({
  action,
  id,
  confirmText,
  label = 'Supprimer',
}: {
  action: (id: string) => Promise<unknown>;
  id: string;
  confirmText: string;
  label?: string;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      disabled={pending}
      onClick={() => {
        if (!confirm(confirmText)) return;
        start(async () => {
          await action(id);
          router.refresh();
        });
      }}
      className="btn-ghost px-2 py-1.5 text-[13px] text-rose-600 hover:bg-rose-50"
    >
      {pending ? '…' : label}
    </button>
  );
}
