'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { AgentTemplate } from '@/lib/agent-templates';

export type CloneTemplateOptions = {
  policy: boolean;
  budget: boolean;
  authority: boolean;
  assets: boolean;
  capabilities: boolean;
};

type CloneTemplateModalProps = {
  open: boolean;
  template: AgentTemplate | null;
  alreadyInstalled: boolean;
  onClose: () => void;
  onConfirm: (options: CloneTemplateOptions) => void;
  pending?: boolean;
};

const DEFAULT_OPTIONS: CloneTemplateOptions = {
  policy: true,
  budget: false,
  authority: false,
  assets: true,
  capabilities: true,
};

export function CloneTemplateModal({
  open,
  template,
  alreadyInstalled,
  onClose,
  onConfirm,
  pending,
}: CloneTemplateModalProps) {
  const [options, setOptions] = useState<CloneTemplateOptions>(DEFAULT_OPTIONS);

  if (!open || !template) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#012b54]/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl border border-[#E8ECF0] bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0066FF]">Clone agent</p>
            <h2 className="text-lg font-semibold text-[#012b54]">{template.name}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-[#8B98A5] hover:bg-[#F4F6F8]" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {alreadyInstalled ? (
          <p className="mt-4 text-sm text-[#64748b]">This template is already installed in your fleet.</p>
        ) : (
          <>
            <p className="mt-3 text-sm text-[#64748b]">Choose what to copy from the template.</p>
            <div className="mt-4 space-y-2">
              {(Object.keys(DEFAULT_OPTIONS) as Array<keyof CloneTemplateOptions>).map((key) => (
                <label key={key} className="flex items-center gap-2 text-sm capitalize">
                  <input
                    type="checkbox"
                    checked={options[key]}
                    onChange={() => setOptions((cur) => ({ ...cur, [key]: !cur[key] }))}
                  />
                  {key}
                </label>
              ))}
            </div>
          </>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="app-btn app-btn-outline" onClick={onClose}>Cancel</button>
          {alreadyInstalled ? (
            <button type="button" className="app-btn app-btn-primary" disabled>Already Installed</button>
          ) : (
            <button type="button" className="app-btn app-btn-primary" disabled={pending} onClick={() => onConfirm(options)}>
              {pending ? 'Cloning…' : 'Clone agent'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
