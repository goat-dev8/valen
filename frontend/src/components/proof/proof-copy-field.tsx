'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

type ProofCopyFieldProps = {
  label: string;
  value: string;
  mono?: boolean;
};

export function ProofCopyField({ label, value, mono = true }: ProofCopyFieldProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="proof-copy-field">
      <p className="proof-copy-field__label">{label}</p>
      <div className="proof-copy-field__value">
        <span className={mono ? 'proof-copy-field__mono' : undefined}>{value}</span>
        <button type="button" className="proof-copy-field__btn" onClick={copy} aria-label={`Copy ${label}`}>
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}
