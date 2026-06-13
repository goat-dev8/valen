import { ProofsService } from './proofs.service';

describe('ProofsService', () => {
  function service(rows: unknown[]) {
    const db = {
      query: jest.fn().mockImplementation((sql: string) => {
        if (sql.includes('public_refusals_v')) {
          return Promise.resolve({ rows });
        }
        return Promise.resolve({ rows: [] });
      }),
    };
    return new ProofsService(db as never);
  }

  it('maps refusal proof with public-safe fields', async () => {
    const proofs = service([
      {
        id: 'refusal-id',
        chain_id: 421614,
        published_at: new Date('2026-06-13T17:00:00.000Z'),
        action_type: 'transfer',
        asset_address: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
        value_amount: '1500000',
        status: 'risk_failed',
        payload_hash: 'abc123',
        mandate_signer: '0xf76e6B0920e9332fF4410f6dD53F01722AbC71a3',
        mandate_hash: 'mandate-hash',
        evidence_hash: 'evidence-hash',
        refusal_factors: { model: 'budget-engine', reasonCode: 'budget_exceeded' },
        agent_id: 'agent-id',
      },
    ]);

    await expect(proofs.getRefusalProof('refusal-id')).resolves.toEqual(
      expect.objectContaining({
        proofVersion: '1.0',
        kind: 'refusal',
        status: 'risk_failed',
        evidenceHash: 'evidence-hash',
      }),
    );
  });
});
