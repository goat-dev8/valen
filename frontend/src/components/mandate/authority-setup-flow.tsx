'use client';

import { useState } from 'react';
import { ArrowRight, CheckCircle, Shield, Wallet } from 'lucide-react';
import { SignMandateModal } from '@/components/mandate/sign-mandate-modal';
import { VerifyWalletModal } from '@/components/mandate/verify-wallet-modal';

type AuthoritySetupFlowProps = {
  agentId: string;
  agentName?: string;
  defaultPolicyId?: string | null;
  verifyComplete: boolean;
  mandateComplete: boolean;
  onSetupChange?: () => void;
};

export function AuthoritySetupFlow({
  agentId,
  agentName,
  defaultPolicyId,
  verifyComplete,
  mandateComplete,
  onSetupChange,
}: AuthoritySetupFlowProps) {
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [mandateOpen, setMandateOpen] = useState(false);

  const nextAction = !verifyComplete ? 'verify' : !mandateComplete ? 'mandate' : 'complete';

  return (
    <div className="space-y-4">
      <ol className="space-y-3">
        <li
          className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
            verifyComplete ? 'border-emerald-200 bg-emerald-50/60' : nextAction === 'verify' ? 'border-[#0066FF]/25 bg-[#EBF2FF]/40' : 'border-[#E8ECF0] bg-[#FAFBFC]'
          }`}
        >
          {verifyComplete ? (
            <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
          ) : (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EBF2FF] text-sm font-bold text-[#0066FF]">
              1
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[#012b54]">Verify owner wallet</p>
            <p className="text-xs text-[#8B98A5]">Prove wallet ownership with a signature challenge</p>
          </div>
          {verifyComplete ? (
            <span className="text-xs font-bold uppercase tracking-wide text-emerald-700">Done</span>
          ) : nextAction === 'verify' ? (
            <button type="button" className="app-btn app-btn-primary shrink-0 text-xs" onClick={() => setVerifyOpen(true)}>
              <Wallet className="h-3.5 w-3.5" />
              Verify wallet
            </button>
          ) : (
            <span className="text-xs font-semibold text-[#8B98A5]">Pending</span>
          )}
        </li>

        <li
          className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
            mandateComplete ? 'border-emerald-200 bg-emerald-50/60' : nextAction === 'mandate' ? 'border-[#0066FF]/25 bg-[#EBF2FF]/40' : 'border-[#E8ECF0] bg-[#FAFBFC] opacity-80'
          }`}
        >
          {mandateComplete ? (
            <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
          ) : (
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                nextAction === 'mandate' ? 'bg-[#EBF2FF] text-[#0066FF]' : 'bg-[#F4F6F8] text-[#8B98A5]'
              }`}
            >
              2
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[#012b54]">Sign agent mandate</p>
            <p className="text-xs text-[#8B98A5]">Bind policy, chains, limits, and expiry to this agent</p>
          </div>
          {mandateComplete ? (
            <span className="text-xs font-bold uppercase tracking-wide text-emerald-700">Done</span>
          ) : nextAction === 'mandate' ? (
            <button type="button" className="app-btn app-btn-primary shrink-0 text-xs" onClick={() => setMandateOpen(true)}>
              <Shield className="h-3.5 w-3.5" />
              Sign mandate
            </button>
          ) : (
            <span className="text-xs font-semibold text-[#8B98A5]">Locked</span>
          )}
        </li>
      </ol>

      {nextAction === 'complete' && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          <CheckCircle className="h-4 w-4 shrink-0" />
          Authority setup complete — continue to budget when ready.
          <ArrowRight className="ml-auto h-4 w-4 shrink-0" aria-hidden />
        </div>
      )}

      <VerifyWalletModal
        open={verifyOpen}
        onClose={() => {
          setVerifyOpen(false);
          onSetupChange?.();
        }}
        onVerified={() => {
          setVerifyOpen(false);
          onSetupChange?.();
        }}
      />

      <SignMandateModal
        open={mandateOpen}
        agentId={agentId}
        agentName={agentName}
        defaultPolicyId={defaultPolicyId}
        onClose={() => {
          setMandateOpen(false);
          onSetupChange?.();
        }}
        onSigned={() => {
          setMandateOpen(false);
          onSetupChange?.();
        }}
      />
    </div>
  );
}
