'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

type ProofBackLinkProps = {
  fallbackHref: string;
  fallbackLabel: string;
};

export function ProofBackLink({ fallbackHref, fallbackLabel }: ProofBackLinkProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      className="app-back-link proof-back-link"
      onClick={() => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
          router.back();
          return;
        }
        router.push(fallbackHref);
      }}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      {fallbackLabel}
    </button>
  );
}
