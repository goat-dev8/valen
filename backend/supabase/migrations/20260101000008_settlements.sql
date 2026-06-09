-- VALEN migration 008: settlements, contract deployments, nonce locks
-- Authority: VALEN_PHASE4_PRODUCTION_SPECIFICATIONS.md
-- Note: chain_networks created in migration 002

CREATE TABLE contract_deployments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id integer NOT NULL,
  contract_name text NOT NULL,
  contract_address text NOT NULL,
  implementation_address text,
  deployment_tx_hash text NOT NULL,
  version text NOT NULL,
  status deployment_status NOT NULL DEFAULT 'planned',
  deployed_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contract_deployments_chain_name_version_unique
    UNIQUE (chain_id, contract_name, version),
  CONSTRAINT contract_deployments_chain_id_fkey
    FOREIGN KEY (chain_id) REFERENCES chain_networks (chain_id)
);

CREATE INDEX idx_contract_deployments_chain_status
  ON contract_deployments (chain_id, status);
CREATE INDEX idx_contract_deployments_contract_address
  ON contract_deployments (contract_address);

CREATE TABLE settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  execution_id uuid NOT NULL,
  chain_id integer NOT NULL,
  contract_address text NOT NULL,
  target_address text,
  status settlement_status NOT NULL DEFAULT 'pending',
  tx_hash text,
  user_operation_hash text,
  block_number bigint,
  failure_reason text,
  submitted_at timestamptz,
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT settlements_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE,
  CONSTRAINT settlements_execution_id_fkey
    FOREIGN KEY (execution_id) REFERENCES executions (id) ON DELETE CASCADE,
  CONSTRAINT settlements_chain_id_fkey
    FOREIGN KEY (chain_id) REFERENCES chain_networks (chain_id)
);

CREATE UNIQUE INDEX idx_settlements_chain_tx_hash
  ON settlements (chain_id, tx_hash)
  WHERE tx_hash IS NOT NULL;

CREATE UNIQUE INDEX idx_settlements_chain_user_operation_hash
  ON settlements (chain_id, user_operation_hash)
  WHERE user_operation_hash IS NOT NULL;

CREATE INDEX idx_settlements_execution_id ON settlements (execution_id);
CREATE INDEX idx_settlements_organization_status_created
  ON settlements (organization_id, status, created_at);
CREATE INDEX idx_settlements_chain_block_number
  ON settlements (chain_id, block_number);

CREATE TABLE nonce_locks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id integer NOT NULL,
  signer_address text NOT NULL,
  nonce_value bigint NOT NULL,
  lock_key text NOT NULL,
  status text NOT NULL DEFAULT 'locked',
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT nonce_locks_lock_key_unique UNIQUE (lock_key),
  CONSTRAINT nonce_locks_chain_id_fkey
    FOREIGN KEY (chain_id) REFERENCES chain_networks (chain_id)
);

CREATE INDEX idx_nonce_locks_chain_signer_nonce
  ON nonce_locks (chain_id, signer_address, nonce_value);
CREATE INDEX idx_nonce_locks_expires_at ON nonce_locks (expires_at);
