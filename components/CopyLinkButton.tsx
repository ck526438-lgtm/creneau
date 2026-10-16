'use client';

import { useState } from 'react';

export default function CopyLinkButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? `${window.location.origin}/b/${slug}` : `/b/${slug}`;

  return (
    <div className="flex items-center gap-2">
      <code className="max-w-[240px] truncate rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-[13px] text-ink-700">
        /b/{slug}
      </code>
      <button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
          } catch {
            /* clipboard unavailable */
          }
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        }}
        className="btn-secondary px-3 py-1.5 text-[13px]"
      >
        {copied ? 'Copié ✓' : 'Copier'}
      </button>
      <a href={`/b/${slug}`} target="_blank" rel="noreferrer" className="btn-ghost px-2 py-1.5 text-[13px]">
        Ouvrir
      </a>
    </div>
  );
}
