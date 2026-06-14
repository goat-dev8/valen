'use client';

import { useEffect, useState } from 'react';
import { useWallets } from '@privy-io/react-auth';
import { useOrganization } from '@/contexts/org-context';
import {
  useCreateMandateTypedData,
  useCreateSignedMandate,
  useCreateWalletChallenge,
  useMandates,
  usePolicies,
  useVerifyWallet,
  useWalletVerifications,
} from '@/hooks/use-valen-api';
import {
  AUTHORITY_CHAIN_IDS,
  commaList,
  normalizeChainId,
  normalizeWalletAddress,
  requestPersonalSignature,
  requestTypedDataSignature,
  type SignableWallet,
} from '@/lib/authority-wallet-signing';
import { chainName } from '@/lib/constants';
import { prepareMandateTypedDataForSigning } from '@/lib/mandate-typed-data';
import {
  ensureWalletOnChain,
  formatWalletChainError,
  getWalletChainId,
  isWalletChainError,
  isWalletOnAuthorityChain,
  walletChainBannerMessage,
} from '@/lib/wallet-chain';
import { formatApiErrorMessage, normalizeEvmAddressInput } from '@/lib/utils';
import { DEFAULT_SUPPORTED_ASSETS, mandateAssetValues } from '@/lib/agent-scope';
import { mandateDefaultsFromPolicyId } from '@/lib/policy-mandate-config';

export function useAuthoritySetup(initialChainId?: number) {
  const { wallets, ready } = useWallets();
  const { organization } = useOrganization();
  const challengeMutation = useCreateWalletChallenge();
  const verifyMutation = useVerifyWallet();
  const typedDataMutation = useCreateMandateTypedData();
  const createMandateMutation = useCreateSignedMandate();
  const mandatesQuery = useMandates();
  const walletVerificationsQuery = useWalletVerifications();
  const { data: policies } = usePolicies();

  const [chainId, setChainId] = useState(initialChainId ?? organization?.defaultChainId ?? 421614);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isSwitchingChain, setIsSwitchingChain] = useState(false);
  const [isSigningMandate, setIsSigningMandate] = useState(false);
  const [liveWalletChainId, setLiveWalletChainId] = useState<number | null>(null);

  const connectedWallet = wallets[0];
  const signableWallet = connectedWallet as SignableWallet | undefined;
  const connectedChainId = normalizeChainId(connectedWallet?.chainId);
  const effectiveWalletChainId = liveWalletChainId ?? connectedChainId;

  const verifiedWallets = walletVerificationsQuery.data ?? [];
  const mandates = mandatesQuery.data ?? [];

  const verifiedForAuthorityChain = (targetChainId = chainId) =>
    verifiedWallets.find(
      (wallet) =>
        wallet.status === 'verified' &&
        connectedWallet?.address &&
        wallet.walletAddress.toLowerCase() === connectedWallet.address.toLowerCase() &&
        wallet.chainId === targetChainId,
    );

  const ownerWalletVerified = verifiedWallets.some((wallet) => wallet.status === 'verified');

  const walletNeedsChainSwitch = Boolean(
    signableWallet?.getEthereumProvider &&
      effectiveWalletChainId &&
      !isWalletOnAuthorityChain(effectiveWalletChainId, chainId),
  );

  const unsupportedConnectedChain = Boolean(
    effectiveWalletChainId &&
      !AUTHORITY_CHAIN_IDS.includes(effectiveWalletChainId as (typeof AUTHORITY_CHAIN_IDS)[number]),
  );

  useEffect(() => {
    let cancelled = false;
    async function refreshWalletChain() {
      if (!signableWallet?.getEthereumProvider) {
        setLiveWalletChainId(null);
        return;
      }
      try {
        const provider = await signableWallet.getEthereumProvider();
        const currentChain = await getWalletChainId(provider);
        if (!cancelled) setLiveWalletChainId(currentChain);
      } catch {
        if (!cancelled) setLiveWalletChainId(null);
      }
    }
    void refreshWalletChain();
    return () => {
      cancelled = true;
    };
  }, [signableWallet, chainId, ready]);

  const ensureAuthorityChainInWallet = async (targetChainId = chainId) => {
    if (!signableWallet?.getEthereumProvider) {
      throw new Error('Connect a wallet before signing.');
    }
    const provider = await signableWallet.getEthereumProvider();
    await ensureWalletOnChain(provider, targetChainId);
    const updated = await getWalletChainId(provider);
    setLiveWalletChainId(updated);
  };

  const clearMessages = () => {
    setActionError(null);
    setActionSuccess(null);
  };

  const handleSwitchWalletNetwork = async (targetChainId = chainId) => {
    clearMessages();
    setIsSwitchingChain(true);
    try {
      await ensureAuthorityChainInWallet(targetChainId);
      setChainId(targetChainId);
      setActionSuccess(`Wallet switched to ${chainName(targetChainId)}. You can now sign mandates on this network.`);
    } catch (err) {
      setActionError(formatWalletChainError(err, targetChainId));
    } finally {
      setIsSwitchingChain(false);
    }
  };

  const handleVerifyConnectedWallet = async () => {
    clearMessages();

    const walletAddress = normalizeEvmAddressInput(connectedWallet?.address ?? '');
    const walletChainId = chainId;
    if (!connectedWallet || !signableWallet || !walletAddress || !walletChainId) {
      setActionError('Connect a wallet before requesting verification.');
      return false;
    }
    if (!AUTHORITY_CHAIN_IDS.includes(walletChainId as (typeof AUTHORITY_CHAIN_IDS)[number])) {
      setActionError('Select Arbitrum Sepolia or Robinhood Testnet before verifying.');
      return false;
    }

    try {
      await ensureAuthorityChainInWallet();
      const challenge = await challengeMutation.mutateAsync({
        chainId: walletChainId,
        walletAddress,
      });
      const signature = await requestPersonalSignature(signableWallet, challenge.message);
      await verifyMutation.mutateAsync({
        chainId: walletChainId,
        walletAddress,
        signature,
      });
      await walletVerificationsQuery.refetch();
      setActionSuccess('Wallet ownership verified. This signature did not authorize a transaction.');
      return true;
    } catch (err) {
      setActionError(
        isWalletChainError(err)
          ? formatWalletChainError(err, walletChainId)
          : formatApiErrorMessage(err, 'Wallet verification failed'),
      );
      return false;
    }
  };

  const handleCreateMandate = async (
    e: React.FormEvent<HTMLFormElement>,
    scope?: { allowedChains: number[]; signingChainId: number },
  ) => {
    e.preventDefault();
    clearMessages();

    const signingChainId = scope?.signingChainId ?? chainId;
    const walletAddress = normalizeWalletAddress(connectedWallet?.address);
    if (!verifiedForAuthorityChain(signingChainId) || !connectedWallet || !signableWallet || !walletAddress) {
      setActionError('Verify the connected wallet on the selected chain before signing a mandate.');
      return false;
    }

    const form = new FormData(e.currentTarget);
    const policyId = String(form.get('policyId') || '') || undefined;
    const policyDefaults = policyId ? mandateDefaultsFromPolicyId(policies ?? [], policyId) : null;
    const validDays = Math.max(
      1,
      Number(form.get('validDays') ?? policyDefaults?.expiresInDays ?? 30),
    );
    const validUntil = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000).toISOString();
    const allowedChains =
      scope?.allowedChains ??
      form
        .getAll('allowedChains')
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value));
    const assetSymbols = form.getAll('allowedAssets').map(String).filter(Boolean);
    const actionValues = form.getAll('allowedActions').map(String).filter(Boolean);
    const body = {
      agentId: String(form.get('agentId')),
      policyId,
      signerAddress: walletAddress,
      chainId: signingChainId,
      allowedChains: allowedChains.length ? allowedChains : policyDefaults?.allowedChains ?? [signingChainId],
      allowedActions: actionValues.length
        ? actionValues
        : policyDefaults?.allowedActions ?? commaList(form.get('allowedActions'), ['transfer']),
      allowedAssets: assetSymbols.length
        ? mandateAssetValues(assetSymbols)
        : mandateAssetValues(policyDefaults?.allowedAssets ?? DEFAULT_SUPPORTED_ASSETS),
      allowedTargets: commaList(form.get('allowedTargets'), policyDefaults?.allowedTargets ?? ['*']),
      maxPerTransaction:
        String(form.get('maxPerTransaction') || '') || policyDefaults?.maxPerTransaction || undefined,
      maxTotal: String(form.get('maxTotal') || '') || policyDefaults?.maxTotal || undefined,
      approvalThreshold:
        String(form.get('approvalThreshold') || '') || policyDefaults?.approvalThreshold || undefined,
      validUntil,
    };

    setIsSigningMandate(true);
    try {
      await ensureAuthorityChainInWallet(signingChainId);
      setChainId(signingChainId);
      const typedData = await typedDataMutation.mutateAsync(body);
      const bodyWithNonce = { ...body, nonce: typedData.nonce };
      const preparedTypedData = prepareMandateTypedDataForSigning(
        typedData.typedData as Parameters<typeof prepareMandateTypedDataForSigning>[0],
      );
      const signature = await requestTypedDataSignature(signableWallet, preparedTypedData);
      await createMandateMutation.mutateAsync({
        ...bodyWithNonce,
        signature,
        typedDataHash: typedData.typedDataHash,
        signedTypedData: typedData.typedData,
      });
      await mandatesQuery.refetch();
      setActionSuccess('Signed mandate stored. Agent authority is now bound to the selected policy and limits.');
      return true;
    } catch (err) {
      setActionError(
        isWalletChainError(err)
          ? formatWalletChainError(err, signingChainId)
          : formatApiErrorMessage(err, 'Mandate signing failed'),
      );
      return false;
    } finally {
      setIsSigningMandate(false);
    }
  };

  const mandateCompleteForAgent = (agentId: string) =>
    mandates.some((m) => m.agentId === agentId && m.status === 'active');

  return {
    ready,
    chainId,
    setChainId,
    connectedWallet,
    signableWallet,
    effectiveWalletChainId,
    verifiedForAuthorityChain,
    ownerWalletVerified,
    walletNeedsChainSwitch,
    unsupportedConnectedChain,
    verifiedWallets,
    mandates,
    policies: policies ?? [],
    actionError,
    actionSuccess,
    isSwitchingChain,
    isSigningMandate,
    isVerifying: challengeMutation.isPending || verifyMutation.isPending,
    isMandatePending: typedDataMutation.isPending || createMandateMutation.isPending,
    handleSwitchWalletNetwork,
    handleVerifyConnectedWallet,
    handleCreateMandate,
    clearMessages,
    refetch: async () => {
      await Promise.all([walletVerificationsQuery.refetch(), mandatesQuery.refetch()]);
    },
    mandateCompleteForAgent,
  };
}
