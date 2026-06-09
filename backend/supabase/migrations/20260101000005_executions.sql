-- VALEN migration 005: executions and idempotency keys
-- Authority: VALEN_PHASE4_PRODUCTION_SPECIFICATIONS.md

CREATE TABLE executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  agent_id uuid NOT NULL,
  mandate_id uuid,
  policy_id uuid,
  policy_version_id uuid,
  idempotency_key text NOT NULL,
  action_type action_type NOT NULL,
  status execution_status NOT NULL DEFAULT 'created',
  request_payload_hash text NOT NULL,
  request_payload_ref text,
  target_chain_id integer NOT NULL,
  target_address text,
  asset_address text,
  value_amount numeric,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT executions_organization_idempotency_unique UNIQUE (organization_id, idempotency_key),
  CONSTRAINT executions_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE,
  CONSTRAINT executions_agent_id_fkey
    FOREIGN KEY (agent_id) REFERENCES agents (id) ON DELETE CASCADE,
  CONSTRAINT executions_mandate_id_fkey
    FOREIGN KEY (mandate_id) REFERENCES mandates (id),
  CONSTRAINT executions_policy_id_fkey
    FOREIGN KEY (policy_id) REFERENCES policies (id),
  CONSTRAINT executions_policy_version_id_fkey
    FOREIGN KEY (policy_version_id) REFERENCES policy_versions (id),
  CONSTRAINT executions_target_chain_id_fkey
    FOREIGN KEY (target_chain_id) REFERENCES chain_networks (chain_id)
);

CREATE INDEX idx_executions_organization_status_created
  ON executions (organization_id, status, created_at);
CREATE INDEX idx_executions_agent_created ON executions (agent_id, created_at);
CREATE INDEX idx_executions_target_chain_address
  ON executions (target_chain_id, target_address);
CREATE INDEX idx_executions_policy_version_id ON executions (policy_version_id);
CREATE INDEX idx_executions_mandate_id ON executions (mandate_id);

CREATE TABLE intent_idempotency_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  idempotency_key text NOT NULL,
  execution_id uuid NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT intent_idempotency_keys_organization_key_unique
    UNIQUE (organization_id, idempotency_key),
  CONSTRAINT intent_idempotency_keys_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE,
  CONSTRAINT intent_idempotency_keys_execution_id_fkey
    FOREIGN KEY (execution_id) REFERENCES executions (id) ON DELETE CASCADE
);

CREATE INDEX idx_intent_idempotency_keys_expires_at ON intent_idempotency_keys (expires_at);
