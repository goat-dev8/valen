'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { AgentIdentityDto } from '@/types/api';
import { useRegisterErc8004 } from '@/hooks/use-valen-api';
import { explorerAddressUrl } from '@/lib/explorer';
import { formatApiErrorMessage } from '@/lib/utils';

type Erc8004Identity = AgentIdentityDto['erc8004'] | {
  status: string;
  registryAddress?: string | null;
  resolverAddress?: string | null;
  tokenId?: string | null;
  chainId?: number;
  ownerAddress?: string | null;
  metadataHash?: string | null;
  tokenUri?: string | null;
};

type Erc8004BadgeProps = {
  identity?: Erc8004Identity | null;
  agentId?: string;
  publicSlug?: string | null;
};

const STATUS_COPY: Record<string, { title: string; body: string; tone: 'ok' | 'warn' | 'bad' }> = {
  registered: {
    title: 'Registered Agent',
    body: 'This agent has an ERC-8004 identity NFT on-chain. Explorer links and token metadata are available below.',
    tone: 'ok',
  },
  registration_pending: {
    title: 'Registration Pending',
    body: 'VALEN has prepared off-chain agent metadata (name, mandates, proof history). A full ERC-8004 identity NFT is not minted yet — the public ERC-8004 registry contract is optional in this demo. Click Register Identity to save metadata to ValenIdentityResolver; on-chain NFT mint requires deploying ERC8004_REGISTRY_ADDRESS.',
    tone: 'warn',
  },
  failed: {
    title: 'Registration Failed',
    body: 'Identity registration did not complete. Retry registration or contact your operator.',
    tone: 'bad',
  },
};

export function Erc8004Badge({ identity, agentId, publicSlug }: Erc8004BadgeProps) {
  const registerMutation = useRegisterErc8004(agentId);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const status = identity?.status ?? 'registration_pending';
  const copy = STATUS_COPY[status] ?? STATUS_COPY.registration_pending;
  const registered = status === 'registered';
  const chainId = identity?.chainId ?? 421614;
  const toneClass = registered
    ? 'border-emerald-100 bg-emerald-50'
    : copy.tone === 'bad'
      ? 'border-red-100 bg-red-50'
      : 'border-amber-100 bg-amber-50';
  const labelClass = registered
    ? 'text-emerald-700'
    : copy.tone === 'bad'
      ? 'text-red-700'
      : 'text-amber-700';

  const handleRegister = async () => {
    if (!agentId) return;
    setError(null);
    setMessage(null);
    try {
      await registerMutation.mutateAsync({});
      setMessage('Identity registration queued. Metadata hash updated — on-chain mint will sync when the registry worker runs.');
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Registration failed'));
    }
  };

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${labelClass}`}>ERC-8004 Identity</p>
      <h3 className="mt-2 text-lg font-semibold text-[#012b54]">{copy.title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#64748b]">{copy.body}</p>

      <details className="mt-3 rounded-xl border border-white/60 bg-white/70 p-3">
        <summary className="cursor-pointer text-sm font-medium text-[#012b54]">What is ERC-8004?</summary>
        <p className="mt-2 text-xs leading-5 text-[#64748b]">
          ERC-8004 is an on-chain agent identity standard. VALEN binds your agent profile, mandates, and proof history to
          a verifiable NFT so third parties can discover and trust autonomous agents.
        </p>
      </details>

      <dl className="app-detail-list mt-3">
        <div>
          <dt>Chain</dt>
          <dd>{chainId}</dd>
        </div>
        <div>
          <dt>Registry</dt>
          <dd className="break-all font-mono text-xs">
            {identity?.registryAddress ? (
              <a
                href={explorerAddressUrl(chainId, identity.registryAddress)}
                target="_blank"
                rel="noreferrer"
                className="app-link inline-flex items-center gap-1"
              >
                {identity.registryAddress}
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              'ValenIdentityResolver only (no ERC-8004 registry deployed)'
            )}
          </dd>
        </div>
        <div>
          <dt>Resolver</dt>
          <dd className="break-all font-mono text-xs">
            {identity?.resolverAddress ? (
              <a
                href={explorerAddressUrl(chainId, identity.resolverAddress)}
                target="_blank"
                rel="noreferrer"
                className="app-link inline-flex items-center gap-1"
              >
                {identity.resolverAddress}
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              'Not linked yet'
            )}
          </dd>
        </div>
        <div>
          <dt>Token ID</dt>
          <dd>{identity?.tokenId ?? 'Pending'}</dd>
        </div>
        <div>
          <dt>Owner</dt>
          <dd className="break-all font-mono text-xs">
            {identity?.ownerAddress ? (
              <a
                href={explorerAddressUrl(chainId, identity.ownerAddress)}
                target="_blank"
                rel="noreferrer"
                className="app-link inline-flex items-center gap-1"
              >
                {identity.ownerAddress}
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              'Pending'
            )}
          </dd>
        </div>
        <div>
          <dt>Metadata Hash</dt>
          <dd className="break-all font-mono text-xs">{identity?.metadataHash ?? 'Pending'}</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-3">
        {!registered && agentId && (
          <button
            type="button"
            className="app-btn app-btn-primary"
            disabled={registerMutation.isPending}
            onClick={handleRegister}
          >
            {registerMutation.isPending ? 'Registering…' : 'Register Identity'}
          </button>
        )}
        {publicSlug && (
          <Link href={`/agents/${publicSlug}`} className="app-btn app-btn-outline">
            Public ERC-8004 profile
          </Link>
        )}
      </div>

      {message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
