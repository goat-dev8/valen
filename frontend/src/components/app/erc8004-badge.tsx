import { AgentIdentityDto } from '@/types/api';

type Erc8004BadgeProps = {
  identity?: AgentIdentityDto['erc8004'] | null;
};

export function Erc8004Badge({ identity }: Erc8004BadgeProps) {
  const status = identity?.status ?? 'registration_pending';
  const registered = status === 'registered';
  return (
    <div className={`rounded-2xl border p-4 ${registered ? 'border-emerald-100 bg-emerald-50' : 'border-amber-100 bg-amber-50'}`}>
      <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${registered ? 'text-emerald-700' : 'text-amber-700'}`}>
        ERC-8004 Identity
      </p>
      <h3 className="mt-2 text-lg font-semibold text-[#012b54]">
        {registered ? 'Registered Agent' : 'Registration Pending'}
      </h3>
      <dl className="app-detail-list mt-3">
        <div><dt>Chain</dt><dd>{identity?.chainId ?? 421614}</dd></div>
        <div><dt>Registry</dt><dd className="break-all font-mono text-xs">{identity?.registryAddress ?? 'Pending ERC-8004 registry mint'}</dd></div>
        <div><dt>Resolver</dt><dd className="break-all font-mono text-xs">{identity?.resolverAddress ?? 'Not linked yet'}</dd></div>
        <div><dt>Token ID</dt><dd>{identity?.tokenId ?? 'Pending'}</dd></div>
        <div><dt>Owner</dt><dd className="break-all font-mono text-xs">{identity?.ownerAddress ?? 'Pending'}</dd></div>
        <div><dt>Metadata Hash</dt><dd className="break-all font-mono text-xs">{identity?.metadataHash ?? 'Pending'}</dd></div>
      </dl>
    </div>
  );
}
