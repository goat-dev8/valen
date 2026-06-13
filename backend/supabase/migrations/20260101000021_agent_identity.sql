-- VALEN migration 021: Phase E agent identity and ERC-8004 binding cache.
-- Purpose: bind VALEN agents to ecosystem-readable identity metadata and proof pages.

CREATE TABLE IF NOT EXISTS agent_identity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES agents (id) ON DELETE CASCADE,
  registry_address text,
  resolver_address text,
  token_id text,
  chain_id integer NOT NULL REFERENCES chain_networks (chain_id),
  owner_address text,
  token_uri text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'registration_pending',
  metadata_hash text,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT agent_identity_agent_unique UNIQUE (agent_id),
  CONSTRAINT agent_identity_status_check CHECK (
    status IN ('registration_pending', 'registered', 'sync_error', 'revoked')
  ),
  CONSTRAINT agent_identity_registry_address_check CHECK (
    registry_address IS NULL OR registry_address ~* '^0x[0-9a-f]{40}$'
  ),
  CONSTRAINT agent_identity_resolver_address_check CHECK (
    resolver_address IS NULL OR resolver_address ~* '^0x[0-9a-f]{40}$'
  ),
  CONSTRAINT agent_identity_owner_address_check CHECK (
    owner_address IS NULL OR owner_address ~* '^0x[0-9a-f]{40}$'
  )
);

CREATE INDEX IF NOT EXISTS idx_agent_identity_org_status
  ON agent_identity (organization_id, status);

CREATE INDEX IF NOT EXISTS idx_agent_identity_chain_token
  ON agent_identity (chain_id, registry_address, token_id)
  WHERE registry_address IS NOT NULL AND token_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mandates_agent_chain_action_validity
  ON mandates (agent_id, chain_id, status, valid_until);
