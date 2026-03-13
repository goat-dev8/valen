'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle, Circle, ShieldCheck } from 'lucide-react';
import { AppShell } from '@/components/app/app-shell';
import { AuthGuard } from '@/components/app/auth-guard';
import { NoOrgState } from '@/components/app/no-org-state';
import { PageHeader } from '@/components/app/page-header';
import { QueryState } from '@/components/app/query-state';
import { useOrganization } from '@/contexts/org-context';
import { useAgents, useExecutions, useMandates, usePolicies, useWalletVerifications } from '@/hooks/use-valen-api';
import { buildSetupSteps, setupProgress } from '@/lib/setup-state';

export default function OnboardingPage() {
  return (
    <AuthGuard>
      <AppShell>
        <NoOrgState />
        <OnboardingContent />
      </AppShell>
    </AuthGuard>
  );
}

function OnboardingContent() {
  const { organization } = useOrganization();
  const agentsQuery = useAgents({ limit: 100 });
  const policiesQuery = usePolicies();
  const executionsQuery = useExecutions({ limit: 100 });
  const walletVerificationsQuery = useWalletVerifications();
  const mandatesQuery = useMandates();
  const steps = buildSetupSteps({
    organization,
    agents: agentsQuery.data?.items,
    policies: policiesQuery.data,
    executions: executionsQuery.data?.items,
    ownerWalletVerified: walletVerificationsQuery.data?.some((wallet) => wallet.status === 'verified') ?? false,
    signedMandateCount: mandatesQuery.data?.filter((mandate) => mandate.status === 'active').length ?? 0,
  });
  const progress = setupProgress(steps);
  const nextStep = steps.find((step) => !step.complete);
  const isLoading =
    agentsQuery.isLoading ||
    policiesQuery.isLoading ||
    executionsQuery.isLoading ||
    walletVerificationsQuery.isLoading ||
    mandatesQuery.isLoading;
  const error =
    agentsQuery.error ??
    policiesQuery.error ??
    executionsQuery.error ??
    walletVerificationsQuery.error ??
    mandatesQuery.error;

  return (
    <div className="space-y-6">
        <PageHeader
          title="Guided Setup"
          description="Connect wallet → create agent → set rules → fund with USDC → execute → see proof."
        />

        <section className="app-card overflow-hidden">
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="rounded-3xl bg-[#012b54] p-6 text-white">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                <ShieldCheck className="h-6 w-6 text-[#c9f31d]" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold">Launch a governed agent</h2>
              <p className="mt-3 text-sm leading-6 text-white/70">
                The setup path reuses existing VALEN workflows: register the agent, create a policy, verify wallet
                authority, sign a mandate, submit an intent, and review the proof.
              </p>
              <div className="mt-6">
                <div className="flex items-center justify-between text-sm text-white/80">
                  <span>Readiness</span>
                  <span>{progress.percent}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-[#c9f31d]" style={{ width: `${progress.percent}%` }} />
                </div>
              </div>
              <Link href={nextStep?.href ?? '/dashboard'} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#012b54]">
                {nextStep?.actionLabel ?? 'Open dashboard'}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <QueryState isLoading={isLoading} error={error} isEmpty={false}>
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <Link
                    key={step.id}
                    href={step.href}
                    className="flex gap-4 rounded-2xl border border-[#eef0f3] bg-white p-4 transition hover:border-[#cfe6ff] hover:bg-[#f8fbff]"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f8f9fb] text-sm font-semibold text-[#012b54]">
                      {step.complete ? (
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-[#012b54]">{step.title}</h3>
                        <span className={step.complete ? 'wallet-status wallet-status-ok' : 'wallet-status wallet-status-warn'}>
                          {step.complete ? 'Complete' : 'Required'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-[#64748b]">{step.description}</p>
                      {step.blockedReason && (
                        <p className="mt-2 text-xs font-medium text-amber-700">{step.blockedReason}</p>
                      )}
                    </div>
                    <div className="mt-1">
                      {step.complete ? (
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-[#94a3b8]" />
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </QueryState>
          </div>
        </section>
    </div>
  );
}
