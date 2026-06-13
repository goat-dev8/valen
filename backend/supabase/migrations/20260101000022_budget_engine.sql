-- VALEN migration 022: Phase F USDC budget ledger and events.

CREATE TABLE IF NOT EXISTS agent_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES agents (id) ON DELETE CASCADE,
  chain_id integer NOT NULL REFERENCES chain_networks (chain_id),
  asset_address text NOT NULL,
  asset_symbol text NOT NULL,
  period text NOT NULL DEFAULT 'rolling_24h',
  period_started_at timestamptz NOT NULL DEFAULT now(),
  cap numeric NOT NULL,
  spent numeric NOT NULL DEFAULT 0,
  evidence_hash text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  resets_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT agent_budgets_cap_nonnegative CHECK (cap >= 0),
  CONSTRAINT agent_budgets_spent_nonnegative CHECK (spent >= 0),
  CONSTRAINT agent_budgets_status_check CHECK (status IN ('active', 'paused', 'exhausted')),
  CONSTRAINT agent_budgets_agent_chain_asset_unique UNIQUE (agent_id, chain_id, asset_address)
);

CREATE INDEX IF NOT EXISTS idx_agent_budgets_org_agent
  ON agent_budgets (organization_id, agent_id, status);

CREATE TABLE IF NOT EXISTS budget_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES agents (id) ON DELETE CASCADE,
  execution_id uuid REFERENCES executions (id) ON DELETE SET NULL,
  budget_id uuid REFERENCES agent_budgets (id) ON DELETE CASCADE,
  kind text NOT NULL,
  amount numeric NOT NULL,
  before_spent numeric NOT NULL,
  after_spent numeric NOT NULL,
  remaining numeric NOT NULL,
  evidence_hash text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT budget_events_kind_check CHECK (kind IN ('topup', 'pass', 'refusal', 'spend_commit'))
);

CREATE INDEX IF NOT EXISTS idx_budget_events_agent_created
  ON budget_events (agent_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_budget_events_execution
  ON budget_events (execution_id)
  WHERE execution_id IS NOT NULL;

CREATE OR REPLACE VIEW agent_budget_status_v AS
SELECT
  b.organization_id,
  b.agent_id,
  b.chain_id,
  b.asset_address,
  b.asset_symbol,
  b.period,
  b.cap,
  b.spent,
  GREATEST(b.cap - b.spent, 0) AS remaining,
  b.evidence_hash,
  b.status,
  b.period_started_at,
  b.resets_at,
  b.updated_at
FROM agent_budgets b;
