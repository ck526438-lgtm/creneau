'use client';

import { useState } from 'react';

/** Copier le lien ou l'envoyer directement sur WhatsApp. */
export default function ShareLinkActions({ url, hostName }: { url: string; hostName: string }) {
  const [copied, setCopied] = useState(false);
  const message = `Prenez rendez-vous avec ${hostName} en ligne, en choisissant vous-même votre créneau : ${url}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <code className="max-w-full truncate rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-[13px] text-ink-700">
        {url}
      </code>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          } catch {
            /* presse-papiers indisponible */
          }
        }}
        className="btn-secondary px-3 py-1.5 text-[13px]"
      >
        {copied ? 'Copié ✓' : 'Copier'}
      </button>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(message)}`}
        target="_blank"
        rel="noreferrer"
        className="rounded-xl bg-emerald-600 px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-emerald-700"
      >
        Envoyer sur WhatsApp
      </a>
    </div>
  );
}
