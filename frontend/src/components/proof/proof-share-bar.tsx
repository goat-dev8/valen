'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export function ProofShareBar({ url, label = 'Copy proof URL' }: { url: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const absolute = url.startsWith('http') ? url : `${window.location.origin}${url}`;
    await navigator.clipboard.writeText(absolute);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="proof-share-bar">
      <p className="proof-share-bar__url">{url}</p>
      <button type="button" onClick={copy} className="app-btn btn-proof proof-share-bar__btn">
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? 'Copied' : label}
      </button>
    </div>
  );
}
