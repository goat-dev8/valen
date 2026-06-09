-- VALEN migration 004: policies, policy versions, mandates
-- Authority: VALEN_PHASE4_PRODUCTION_SPECIFICATIONS.md

CREATE TABLE policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  status policy_status NOT NULL DEFAULT 'draft',
  active_version_id uuid,
  created_by_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT policies_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE,
  CONSTRAINT policies_created_by_user_id_fkey
    FOREIGN KEY (created_by_user_id) REFERENCES users (id)
);

CREATE INDEX idx_policies_organization_status ON policies (organization_id, status);
CREATE INDEX idx_policies_active_version_id ON policies (active_version_id);

CREATE TABLE policy_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  policy_id uuid NOT NULL,
  version_number integer NOT NULL,
  status policy_version_status NOT NULL DEFAULT 'draft',
  rules jsonb NOT NULL,
  rules_hash text,
  published_by_user_id uuid,
  published_at timestamptz,
  activated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT policy_versions_version_number_positive CHECK (version_number > 0),
  CONSTRAINT policy_versions_rules_hash_required CHECK (
    (status IN ('draft', 'pending_approval') AND rules_hash IS NULL)
    OR (status NOT IN ('draft', 'pending_approval') AND rules_hash IS NOT NULL)
  ),
  CONSTRAINT policy_versions_policy_version_unique UNIQUE (policy_id, version_number),
  CONSTRAINT policy_versions_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE,
  CONSTRAINT policy_versions_policy_id_fkey
    FOREIGN KEY (policy_id) REFERENCES policies (id) ON DELETE CASCADE,
  CONSTRAINT policy_versions_published_by_user_id_fkey
    FOREIGN KEY (published_by_user_id) REFERENCES users (id)
);

CREATE INDEX idx_policy_versions_organization_status ON policy_versions (organization_id, status);
CREATE INDEX idx_policy_versions_rules_hash ON policy_versions (rules_hash);
CREATE INDEX idx_policy_versions_policy_status ON policy_versions (policy_id, status);

ALTER TABLE policies
  ADD CONSTRAINT policies_active_version_id_fkey
    FOREIGN KEY (active_version_id) REFERENCES policy_versions (id);

ALTER TABLE agents
  ADD CONSTRAINT agents_default_policy_id_fkey
    FOREIGN KEY (default_policy_id) REFERENCES policies (id);

CREATE TABLE mandates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  agent_id uuid NOT NULL,
  principal_user_id uuid,
  chain_id integer NOT NULL,
  onchain_mandate_id text,
  scope_hash text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  valid_from timestamptz NOT NULL,
  valid_until timestamptz NOT NULL,
  max_per_transaction numeric,
  max_total numeric,
  used_total numeric NOT NULL DEFAULT 0,
  created_by_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mandates_valid_range_check CHECK (valid_until > valid_from),
  CONSTRAINT mandates_status_check CHECK (
    status IN ('draft', 'active', 'revoked', 'expired', 'frozen')
  ),
  CONSTRAINT mandates_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE,
  CONSTRAINT mandates_agent_id_fkey
    FOREIGN KEY (agent_id) REFERENCES agents (id) ON DELETE CASCADE,
  CONSTRAINT mandates_principal_user_id_fkey
    FOREIGN KEY (principal_user_id) REFERENCES users (id),
  CONSTRAINT mandates_chain_id_fkey
    FOREIGN KEY (chain_id) REFERENCES chain_networks (chain_id),
  CONSTRAINT mandates_created_by_user_id_fkey
    FOREIGN KEY (created_by_user_id) REFERENCES users (id)
);

CREATE INDEX idx_mandates_organization_status ON mandates (organization_id, status);
CREATE INDEX idx_mandates_agent_status ON mandates (agent_id, status);
CREATE UNIQUE INDEX idx_mandates_chain_onchain_mandate_id
  ON mandates (chain_id, onchain_mandate_id)
  WHERE onchain_mandate_id IS NOT NULL;
CREATE INDEX idx_mandates_valid_until ON mandates (valid_until);
