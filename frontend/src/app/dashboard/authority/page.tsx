'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { AuthorityExplainer } from '@/components/authority/authority-explainer';
import { AuthorityMandateForm } from '@/components/authority/authority-mandate-form';
import { AuthorityMandateList } from '@/components/authority/authority-mandate-list';
import { AuthoritySidebar } from '@/components/authority/authority-sidebar';
import { AuthorityVerifyPanel } from '@/components/authority/authority-verify-panel';
import { ChainPicker } from '@/components/authority/chain-picker';
import { AuthorityWizardSteps, type AuthorityPanel } from '@/components/mandate/authority-wizard-steps';
import { useAuthoritySetup } from '@/hooks/use-authority-setup';
import { useAgents, useRevokeMandate } from '@/hooks/use-valen-api';
import { chainName } from '@/lib/constants';
import { walletChainBannerMessage } from '@/lib/wallet-chain';
import { formatApiErrorMessage } from '@/lib/utils';

export default function AuthorityPage() {
  const setup = useAuthoritySetup();
  const { data: agentsData } = useAgents({ limit: 100 });
  const revokeMutation = useRevokeMandate();
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const [revokeSuccess, setRevokeSuccess] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<AuthorityPanel | null>(null);
  const verifyPanelRef = useRef<HTMLDivElement>(null);
  const mandatePanelRef = useRef<HTMLElement>(null);

  const agents = agentsData?.items ?? [];
  const verifiedCount = setup.verifiedWallets.filter((wallet) => wallet.status === 'verified').length;
  const activeMandateCount = setup.mandates.filter((mandate) => mandate.status === 'active').length;
  const mandateComplete = activeMandateCount > 0;

  const openPanel = (panel: AuthorityPanel) => {
    setActivePanel((current) => (current === panel ? null : panel));
  };

  useEffect(() => {
    if (!activePanel) return;
    const target = activePanel === 'verify' ? verifyPanelRef.current : mandatePanelRef.current;
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [activePanel]);

  const handleRevokeMandate = async (mandateId: string) => {
    const reason = window.prompt('Reason for revoking this mandate:');
    if (!reason?.trim()) return;
    setup.clearMessages();
    setRevokeError(null);
    setRevokeSuccess(null);
    try {
      await revokeMutation.mutateAsync({ mandateId, reason: reason.trim() });
      await setup.refetch();
      setRevokeSuccess('Mandate revoked.');
    } catch (err) {
      setRevokeError(formatApiErrorMessage(err, 'Mandate revocation failed'));
    }
  };

  const bannerError = setup.actionError ?? revokeError;
  const bannerSuccess = setup.actionSuccess ?? revokeSuccess;
  const showPanelAlerts = activePanel !== null;

  return (
    <div className="authority-page space-y-6">
      <Link href="/dashboard" className="app-back-link">
        <ArrowLeft className="h-4 w-4" />
        Command Center
      </Link>

      <PageHeader
        title="Authority"
        description="Verify owner wallet and sign agent mandates before governed actions settle."
      />

      <AuthorityExplainer
        verifyComplete={Boolean(setup.verifiedForAuthorityChain)}
        mandateComplete={mandateComplete}
        activePanel={activePanel}
        onOpenVerify={() => openPanel('verify')}
        onOpenMandate={() => openPanel('mandate')}
      />

      <div className="authority-page__chain-row">
        <p className="authority-page__chain-label">Authority chain</p>
        <ChainPicker value={setup.chainId} onChange={setup.setChainId} />
      </div>

      <AuthorityWizardSteps
        verifyComplete={Boolean(setup.verifiedForAuthorityChain)}
        mandateComplete={mandateComplete}
        activePanel={activePanel}
        onStepClick={openPanel}
      />

      {showPanelAlerts && setup.walletNeedsChainSwitch && (
        <div className="authority-alert authority-alert--warn">
          <p className="authority-alert__title">Wallet on wrong network</p>
          <p className="authority-alert__body">{walletChainBannerMessage(setup.effectiveWalletChainId, setup.chainId)}</p>
          <button
            type="button"
            className="app-btn app-btn-primary mt-3"
            disabled={!setup.connectedWallet || setup.isSwitchingChain}
            onClick={setup.handleSwitchWalletNetwork}
          >
            {setup.isSwitchingChain ? 'Switching…' : `Switch to ${chainName(setup.chainId)}`}
          </button>
        </div>
      )}

      {showPanelAlerts && setup.unsupportedConnectedChain && !setup.walletNeedsChainSwitch && (
        <div className="authority-alert authority-alert--warn">
          Connected wallet is on {chainName(setup.effectiveWalletChainId)}. VALEN supports Arbitrum Sepolia and Robinhood
          Testnet.
        </div>
      )}

      {showPanelAlerts && (bannerError || bannerSuccess) && (
        <div className={`authority-alert ${bannerError ? 'authority-alert--error' : 'authority-alert--success'}`}>
          {bannerError ?? bannerSuccess}
        </div>
      )}

      <div className="intent-wizard-layout">
        <div className="intent-wizard-main space-y-5">
          {activePanel === 'verify' && (
            <div ref={verifyPanelRef}>
              <AuthorityVerifyPanel
                connectedAddress={setup.connectedWallet?.address}
                effectiveWalletChainId={setup.effectiveWalletChainId}
                authorityChainId={setup.chainId}
                verifiedForChain={setup.verifiedForAuthorityChain}
                isVerifying={setup.isVerifying}
                canVerify={Boolean(setup.connectedWallet)}
                onVerify={() => void setup.handleVerifyConnectedWallet()}
              />
            </div>
          )}

          {activePanel === 'mandate' && (
            <section id="sign-mandate" ref={mandatePanelRef} className="app-panel-floating authority-panel">
              <div className="authority-panel__header">
                <div>
                  <h2 className="authority-panel__title">Sign agent mandate</h2>
                  <p className="authority-panel__desc">
                    Bind a verified owner wallet to an agent with policy scope and expiry.
                  </p>
                </div>
                <span className="authority-status-pill authority-status-pill--ok">{activeMandateCount} active</span>
              </div>

              <div className="authority-mandate-stack">
                <AuthorityMandateForm
                  agents={agents}
                  policies={setup.policies}
                  authorityChainId={setup.chainId}
                  verified={Boolean(setup.verifiedForAuthorityChain)}
                  walletNeedsChainSwitch={setup.walletNeedsChainSwitch}
                  isSubmitting={setup.isSigningMandate || setup.isMandatePending}
                  onSubmit={(e) => void setup.handleCreateMandate(e)}
                />
                <AuthorityMandateList
                  mandates={setup.mandates}
                  agents={agents}
                  isRevoking={revokeMutation.isPending}
                  onRevoke={handleRevokeMandate}
                />
                {!setup.mandates.length && (
                  <div className="authority-mandate-empty">
                    <p>No mandates signed yet. Complete the form above after verifying your wallet.</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {!activePanel && (
            <div className="authority-panel-placeholder">
              <p>Select <strong>Verify wallet</strong> or <strong>Sign mandate</strong> from Owner authority above to begin.</p>
            </div>
          )}
        </div>

        <AuthoritySidebar
          walletAddress={setup.connectedWallet?.address}
          authorityChainId={setup.chainId}
          verifiedCount={verifiedCount}
          activeMandateCount={activeMandateCount}
        />
      </div>
    </div>
  );
}
