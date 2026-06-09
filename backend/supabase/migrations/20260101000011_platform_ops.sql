-- VALEN migration 011: platform operations
-- Authority: VALEN_PHASE4_PRODUCTION_SPECIFICATIONS.md

CREATE TABLE dead_letter_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_name text NOT NULL,
  job_id text NOT NULL,
  organization_id uuid,
  execution_id uuid,
  failure_reason text NOT NULL,
  retry_count integer NOT NULL,
  payload_ref text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  CONSTRAINT dead_letter_jobs_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE SET NULL,
  CONSTRAINT dead_letter_jobs_execution_id_fkey
    FOREIGN KEY (execution_id) REFERENCES executions (id) ON DELETE SET NULL
);

CREATE INDEX idx_dead_letter_jobs_queue_status ON dead_letter_jobs (queue_name, status);
CREATE INDEX idx_dead_letter_jobs_organization_created
  ON dead_letter_jobs (organization_id, created_at);
CREATE INDEX idx_dead_letter_jobs_execution_id ON dead_letter_jobs (execution_id);
CREATE INDEX idx_dead_letter_jobs_status ON dead_letter_jobs (status);

CREATE TABLE admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid NOT NULL,
  organization_id uuid,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_actions_actor_user_id_fkey
    FOREIGN KEY (actor_user_id) REFERENCES users (id),
  CONSTRAINT admin_actions_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE SET NULL
);

CREATE INDEX idx_admin_actions_actor_created
  ON admin_actions (actor_user_id, created_at);
CREATE INDEX idx_admin_actions_organization_created
  ON admin_actions (organization_id, created_at);
CREATE INDEX idx_admin_actions_target ON admin_actions (target_type, target_id);

CREATE TABLE emergency_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid NOT NULL,
  scope text NOT NULL,
  scope_ref text,
  action text NOT NULL,
  reason text NOT NULL,
  chain_id integer,
  tx_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  lifted_at timestamptz,
  CONSTRAINT emergency_actions_actor_user_id_fkey
    FOREIGN KEY (actor_user_id) REFERENCES users (id),
  CONSTRAINT emergency_actions_chain_id_fkey
    FOREIGN KEY (chain_id) REFERENCES chain_networks (chain_id)
);

CREATE INDEX idx_emergency_actions_scope ON emergency_actions (scope, scope_ref);
CREATE INDEX idx_emergency_actions_actor_created
  ON emergency_actions (actor_user_id, created_at);
CREATE INDEX idx_emergency_actions_chain_tx_hash
  ON emergency_actions (chain_id, tx_hash);

CREATE TABLE feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  environment text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT feature_flags_key_environment_unique UNIQUE (key, environment)
);

CREATE INDEX idx_feature_flags_enabled ON feature_flags (enabled);
