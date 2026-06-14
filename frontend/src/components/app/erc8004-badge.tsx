'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { AgentIdentityDto } from '@/types/api';
import { useRegisterErc8004 } from '@/hooks/use-valen-api';
import { explorerAddressUrl, explorerTxUrl } from '@/lib/explorer';
import { formatApiErrorMessage } from '@/lib/utils';

type Erc8004Identity = AgentIdentityDto['erc8004'];

type Erc8004BadgeProps = {
  identity?: Erc8004Identity | null;
  agentId?: string;
  publicSlug?: string | null;
};

export function Erc8004Badge({ identity, agentId, publicSlug }: Erc8004BadgeProps) {
  const registerMutation = useRegisterErc8004(agentId);
  const [error, setError] = useState<string | null>(null);

  const status = identity?.status ?? 'unregistered';
  const registered = status === 'registered';
  const chainId = identity?.chainId ?? 421614;
  const toneClass = registered ? 'border-emerald-100 bg-emerald-50' : 'border-[#E8ECF0] bg-[#FAFBFC]';
  const labelClass = registered ? 'text-emerald-700' : 'text-[#5E6C7B]';

  const handleRegister = async () => {
    if (!agentId) return;
    setError(null);
    try {
      await registerMutation.mutateAsync({});
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Registration failed'));
    }
  };

  return (
    <div className={`rounded-2xl border p-5 ${toneClass}`}>
      <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${labelClass}`}>ERC-8004 Identity</p>
      <h3 className="mt-2 text-lg font-semibold text-[#012b54]">
        {registered ? 'Registered on-chain' : 'Register agent identity'}
      </h3>
      <p className="mt-2 text-sm leading-6 text-[#64748b]">
        {registered
          ? 'Identity bound via ValenIdentityResolver with verifiable registry, token ID, and owner.'
          : 'Bind agent metadata on-chain through ValenIdentityResolver after wallet verification.'}
      </p>

      <dl className="app-detail-list mt-4">
        <div><dt>Chain</dt><dd>{chainId}</dd></div>
        <div>
          <dt>Registry</dt>
          <dd className="break-all font-mono text-xs">
            {identity?.registryAddress ? (
              <a href={explorerAddressUrl(chainId, identity.registryAddress)} target="_blank" rel="noreferrer" className="app-link inline-flex items-center gap-1">
                {identity.registryAddress}
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : '—'}
          </dd>
        </div>
        <div>
          <dt>Resolver</dt>
          <dd className="break-all font-mono text-xs">
            {identity?.resolverAddress ? (
              <a href={explorerAddressUrl(chainId, identity.resolverAddress)} target="_blank" rel="noreferrer" className="app-link inline-flex items-center gap-1">
                {identity.resolverAddress}
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : '—'}
          </dd>
        </div>
        <div><dt>Token ID</dt><dd>{identity?.tokenId ?? '—'}</dd></div>
        <div>
          <dt>Owner</dt>
          <dd className="break-all font-mono text-xs">
            {identity?.ownerAddress ? (
              <a href={explorerAddressUrl(chainId, identity.ownerAddress)} target="_blank" rel="noreferrer" className="app-link inline-flex items-center gap-1">
                {identity.ownerAddress}
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : '—'}
          </dd>
        </div>
        <div><dt>Metadata hash</dt><dd className="break-all font-mono text-xs">{identity?.metadataHash ?? '—'}</dd></div>
        {identity?.mintedAt && <div><dt>Mint timestamp</dt><dd>{new Date(identity.mintedAt).toLocaleString()}</dd></div>}
        {identity?.mintTxHash && (
          <div>
            <dt>Explorer</dt>
            <dd>
              <a href={explorerTxUrl(chainId, identity.mintTxHash)} target="_blank" rel="noreferrer" className="app-link inline-flex items-center gap-1 text-xs">
                View mint transaction
                <ExternalLink className="h-3 w-3" />
              </a>
            </dd>
          </div>
        )}
      </dl>

      <div className="mt-4 flex flex-wrap gap-3">
        {!registered && agentId && (
          <button type="button" className="app-btn app-btn-primary" disabled={registerMutation.isPending} onClick={handleRegister}>
            {registerMutation.isPending ? 'Registering…' : 'Register Identity'}
          </button>
        )}
        {publicSlug && (
          <Link href={`/agents/${publicSlug}`} className="app-btn app-btn-outline">Public profile</Link>
        )}
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
