'use client';

import { useEffect, useMemo, useState } from 'react';
import { useWallets } from '@privy-io/react-auth';
import { useAgents, useMandates, useX402Execute, useX402Initiate } from '@/hooks/use-valen-api';
import { mandateMatchesIntent } from '@/lib/mandate-match';
import {
  X402_CHAIN_ID,
  X402_MERCHANT_URL,
  X402_TEMPLATE_ID,
  X402_USDC_ADDRESS,
} from '@/lib/x402-constants';
import { formatApiErrorMessage } from '@/lib/utils';

export function useX402PaymentFlow(
  initialAmount = '0.01',
  options?: { merchantUrl?: string },
) {
  const merchantUrl = options?.merchantUrl ?? X402_MERCHANT_URL;
  const { wallets } = useWallets();
  const connectedWallet = wallets[0]?.address;
  const { data: agents } = useAgents({ limit: 100, status: 'active' });
  const { data: mandates } = useMandates();
  const x402Initiate = useX402Initiate();
  const x402Execute = useX402Execute();

  const [agentId, setAgentId] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState(initialAmount);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [settlementTx, setSettlementTx] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAmount(initialAmount);
  }, [initialAmount]);

  useEffect(() => {
    if (connectedWallet && !recipient) setRecipient(connectedWallet);
  }, [connectedWallet, recipient]);

  const selectedAgent = agents?.items.find((agent) => agent.id === agentId) ?? agents?.items[0];

  const selectedMandate = useMemo(
    () =>
      (mandates ?? []).find((mandate) =>
        mandateMatchesIntent({
          mandate,
          agentId: selectedAgent?.id,
          chainId: X402_CHAIN_ID,
          actionType: 'transfer',
          templateId: X402_TEMPLATE_ID,
          targetAddress: recipient,
          assetAddress: X402_USDC_ADDRESS,
        }),
      ),
    [mandates, recipient, selectedAgent?.id],
  );

  const matchingAgentIds = useMemo(() => {
    const ids = new Set<string>();
    for (const agent of agents?.items ?? []) {
      const match = (mandates ?? []).find((mandate) =>
        mandateMatchesIntent({
          mandate,
          agentId: agent.id,
          chainId: X402_CHAIN_ID,
          actionType: 'transfer',
          templateId: X402_TEMPLATE_ID,
          targetAddress: recipient,
          assetAddress: X402_USDC_ADDRESS,
        }),
      );
      if (match) ids.add(agent.id);
    }
    return ids;
  }, [agents?.items, mandates, recipient]);

  useEffect(() => {
    if (!agents?.items.length) return;
    if (agentId && matchingAgentIds.has(agentId)) return;
    const firstMatch = agents.items.find((a) => matchingAgentIds.has(a.id));
    if (firstMatch) setAgentId(firstMatch.id);
    else if (!agentId && agents.items[0]) setAgentId(agents.items[0].id);
  }, [agents?.items, matchingAgentIds, agentId]);

  const readiness = [
    { label: 'Active agent', complete: Boolean(selectedAgent), href: '/dashboard/agents' },
    { label: 'USDC mandate', complete: Boolean(selectedMandate), href: '/dashboard/authority' },
    { label: 'Valid recipient', complete: /^0x[a-fA-F0-9]{40}$/.test(recipient) },
    { label: 'Payment initiated', complete: Boolean(paymentId) },
    { label: 'On-chain settlement', complete: Boolean(settlementTx) },
  ];

  const resetFlow = () => {
    setPaymentId(null);
    setSettlementTx(null);
    setStatusMessage(null);
    setError(null);
  };

  const handleInitiate = async () => {
    setError(null);
    setStatusMessage(null);
    setSettlementTx(null);
    if (!selectedAgent || !selectedMandate) {
      setError('Select an active agent with a matching USDC mandate.');
      return;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
      setError('Enter a valid recipient wallet address.');
      return;
    }
    try {
      const result = await x402Initiate.mutateAsync({
        agentId: selectedAgent.id,
        mandateId: selectedMandate.id,
        recipient,
        amount,
        chainId: X402_CHAIN_ID,
        merchantUrl,
      });
      setPaymentId(result.paymentId);
      setStatusMessage(`Payment initiated — status ${result.status}`);
    } catch (initiateError) {
      setError(formatApiErrorMessage(initiateError));
    }
  };

  const handleExecute = async () => {
    if (!paymentId) return;
    setError(null);
    setStatusMessage(null);
    try {
      const result = await x402Execute.mutateAsync(paymentId);
      setSettlementTx(result.settlementTx ?? null);
      setStatusMessage(
        result.settlementTx
          ? `Settled on-chain · ${result.status}`
          : `Settlement ${result.status}`,
      );
    } catch (executeError) {
      setError(formatApiErrorMessage(executeError));
    }
  };

  return {
    connectedWallet,
    agents: agents?.items ?? [],
    agentsLoading: !agents,
    selectedAgent,
    agentId: agentId || selectedAgent?.id || '',
    setAgentId,
    recipient,
    setRecipient,
    amount,
    setAmount,
    paymentId,
    settlementTx,
    statusMessage,
    error,
    readiness,
    selectedMandate,
    matchingAgentIds,
    isInitiating: x402Initiate.isPending,
    isSettling: x402Execute.isPending,
    handleInitiate,
    handleExecute,
    resetFlow,
    useMyWallet: () => connectedWallet && setRecipient(connectedWallet),
  };
}
