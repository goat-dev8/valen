import { Erc8004Service } from './erc8004.service';

describe('Erc8004Service', () => {
  const agent = {
    id: 'agent-id',
    organization_id: 'org-id',
    name: 'VALEN Demo Agent',
    description: 'demo',
    status: 'active',
    agent_type: 'external',
    default_policy_id: 'policy-id',
    metadata: {},
    created_at: new Date(),
    updated_at: new Date(),
  };

  function service(dbRows: unknown[] = []) {
    return new Erc8004Service(
      {
        query: jest.fn().mockResolvedValue({ rows: dbRows }),
      } as never,
      {
        findByOrgAndId: jest.fn().mockResolvedValue(agent),
      } as never,
      {
        listByAgent: jest.fn().mockResolvedValue([
          {
            id: 'wallet-id',
            chain_id: 421614,
            wallet_address: '0xf76e6b0920e9332ff4410f6dd53f01722abc71a3',
            wallet_type: 'eoa',
            is_primary: true,
            status: 'active',
          },
        ]),
      } as never,
      {
        listByOrganization: jest.fn().mockResolvedValue([
          {
            id: 'mandate-id',
            agent_id: 'agent-id',
            chain_id: 421614,
            signer_address: '0xf76e6b0920e9332ff4410f6dd53f01722abc71a3',
            status: 'active',
            allowed_chains: [421614],
            allowed_actions: ['transfer'],
            allowed_assets: ['native'],
            allowed_targets: ['*'],
            typed_data_hash: '0x'.padEnd(66, '1'),
            valid_until: new Date('2026-07-13T00:00:00Z'),
          },
        ]),
      } as never,
      {
        listByOrganization: jest.fn().mockResolvedValue([
          {
            id: 'verification-id',
            chain_id: 421614,
            wallet_address: '0xf76e6b0920e9332ff4410f6dd53f01722abc71a3',
            status: 'verified',
            verified_at: new Date('2026-06-13T00:00:00Z'),
          },
        ]),
      } as never,
    );
  }

  it('returns registration pending identity with mandate and wallet evidence', async () => {
    await expect(service().getIdentity('org-id', 'agent-id')).resolves.toEqual(
      expect.objectContaining({
        agentId: 'agent-id',
        erc8004: expect.objectContaining({
          status: 'registration_pending',
          chainId: 421614,
          metadataHash: expect.stringMatching(/^0x[0-9a-f]+$/),
        }),
        walletBindings: expect.arrayContaining([
          expect.objectContaining({ walletAddress: '0xf76e6b0920e9332ff4410f6dd53f01722abc71a3' }),
        ]),
        verifiedWallets: expect.arrayContaining([
          expect.objectContaining({ status: 'verified' }),
        ]),
        mandates: expect.arrayContaining([
          expect.objectContaining({ id: 'mandate-id', signerAddress: '0xf76e6b0920e9332ff4410f6dd53f01722abc71a3' }),
        ]),
      }),
    );
  });
});
