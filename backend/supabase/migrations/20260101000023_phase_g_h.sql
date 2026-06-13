-- VALEN migration 023: Phase G x402 payments + Phase H public agent slug.

ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'x402_payment';

ALTER TABLE agents ADD COLUMN IF NOT EXISTS public_slug text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_agents_public_slug
  ON agents (public_slug)
  WHERE public_slug IS NOT NULL;

UPDATE agents
SET public_slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE public_slug IS NULL
  AND id = '64f56184-eacf-4eef-bc84-f3b863d3894f';

CREATE TABLE IF NOT EXISTS x402_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES agents (id) ON DELETE CASCADE,
  mandate_id uuid REFERENCES mandates (id) ON DELETE SET NULL,
  execution_id uuid REFERENCES executions (id) ON DELETE SET NULL,
  chain_id integer NOT NULL REFERENCES chain_networks (chain_id),
  merchant_url text,
  recipient text NOT NULL,
  asset_address text NOT NULL,
  asset_symbol text NOT NULL DEFAULT 'USDC',
  amount numeric NOT NULL,
  nonce text,
  status text NOT NULL DEFAULT 'initiated',
  refusal_reason text,
  evidence_hash text,
  settlement_tx text,
  facilitator_response_hash text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT x402_payments_status_check CHECK (
    status IN ('initiated', 'approved', 'settled', 'refused', 'failed')
  )
);

CREATE INDEX IF NOT EXISTS idx_x402_payments_agent_status
  ON x402_payments (agent_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_x402_payments_org_created
  ON x402_payments (organization_id, created_at DESC);
