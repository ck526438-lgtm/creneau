'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export default function ToggleRow({
  action,
  id,
  active,
  labelOn = 'Désactiver',
  labelOff = 'Activer',
}: {
  action: (id: string, active: boolean) => Promise<void>;
  id: string;
  active: boolean;
  labelOn?: string;
  labelOff?: string;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      disabled={pending}
      onClick={() =>
        start(async () => {
          await action(id, !active);
          router.refresh();
        })
      }
      className="btn-ghost px-2 py-1.5 text-[13px]"
    >
      {pending ? '…' : active ? labelOn : labelOff}
    </button>
  );
}
