-- VALEN migration 003: agents, wallets, API keys
-- Authority: VALEN_PHASE4_PRODUCTION_SPECIFICATIONS.md

CREATE TABLE agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  status agent_status NOT NULL DEFAULT 'draft',
  agent_type agent_type NOT NULL,
  external_ref text,
  default_policy_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT agents_name_length_check CHECK (char_length(name) BETWEEN 2 AND 120),
  CONSTRAINT agents_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE,
  CONSTRAINT agents_created_by_user_id_fkey
    FOREIGN KEY (created_by_user_id) REFERENCES users (id)
);

CREATE INDEX idx_agents_organization_status ON agents (organization_id, status);
CREATE INDEX idx_agents_organization_agent_type ON agents (organization_id, agent_type);
CREATE INDEX idx_agents_default_policy_id ON agents (default_policy_id);
CREATE INDEX idx_agents_external_ref ON agents (external_ref) WHERE external_ref IS NOT NULL;

CREATE TABLE agent_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  agent_id uuid NOT NULL,
  chain_id integer NOT NULL,
  wallet_address text NOT NULL,
  wallet_type wallet_type NOT NULL,
  status text NOT NULL DEFAULT 'active',
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT agent_wallets_chain_wallet_unique UNIQUE (chain_id, wallet_address),
  CONSTRAINT agent_wallets_status_check CHECK (
    status IN ('active', 'rotated', 'revoked')
  ),
  CONSTRAINT agent_wallets_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE,
  CONSTRAINT agent_wallets_agent_id_fkey
    FOREIGN KEY (agent_id) REFERENCES agents (id) ON DELETE CASCADE,
  CONSTRAINT agent_wallets_chain_id_fkey
    FOREIGN KEY (chain_id) REFERENCES chain_networks (chain_id)
);

CREATE UNIQUE INDEX idx_agent_wallets_primary_per_chain
  ON agent_wallets (agent_id, chain_id)
  WHERE is_primary = true AND status = 'active';

CREATE INDEX idx_agent_wallets_organization_chain ON agent_wallets (organization_id, chain_id);
CREATE INDEX idx_agent_wallets_agent_id ON agent_wallets (agent_id);

CREATE TABLE api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  agent_id uuid,
  name text NOT NULL,
  key_prefix text NOT NULL,
  key_hash text NOT NULL,
  scopes text[] NOT NULL DEFAULT '{}'::text[],
  status text NOT NULL DEFAULT 'active',
  expires_at timestamptz,
  last_used_at timestamptz,
  created_by_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  CONSTRAINT api_keys_key_prefix_unique UNIQUE (key_prefix),
  CONSTRAINT api_keys_status_check CHECK (
    status IN ('active', 'revoked', 'expired')
  ),
  CONSTRAINT api_keys_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE,
  CONSTRAINT api_keys_agent_id_fkey
    FOREIGN KEY (agent_id) REFERENCES agents (id) ON DELETE SET NULL,
  CONSTRAINT api_keys_created_by_user_id_fkey
    FOREIGN KEY (created_by_user_id) REFERENCES users (id)
);

CREATE INDEX idx_api_keys_organization_status ON api_keys (organization_id, status);
CREATE INDEX idx_api_keys_agent_id ON api_keys (agent_id);
CREATE INDEX idx_api_keys_expires_at ON api_keys (expires_at);
