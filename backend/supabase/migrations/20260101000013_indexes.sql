-- VALEN migration 013: additional performance indexes
-- Authority: VALEN_PHASE4_PRODUCTION_SPECIFICATIONS.md, VALEN_ARCHITECTURE_BLUEPRINT.md

-- Policy version hash uniqueness per policy (Phase 4 spec)
CREATE UNIQUE INDEX idx_policy_versions_policy_rules_hash
  ON policy_versions (policy_id, rules_hash)
  WHERE rules_hash IS NOT NULL;

-- Active team membership lookups for RLS and auth sync
CREATE INDEX idx_team_members_user_active
  ON team_members (user_id)
  WHERE status = 'active';

CREATE INDEX idx_team_members_org_active
  ON team_members (organization_id)
  WHERE status = 'active';

-- Execution lifecycle dashboards and worker queues
CREATE INDEX idx_executions_org_created_desc
  ON executions (organization_id, created_at DESC);

CREATE INDEX idx_executions_status_created
  ON executions (status, created_at)
  WHERE status NOT IN ('executed', 'failed', 'cancelled');

-- Mandate expiry sweeps and active mandate resolution
CREATE INDEX idx_mandates_active_agent_chain
  ON mandates (agent_id, chain_id)
  WHERE status = 'active';

CREATE INDEX idx_mandates_expiring
  ON mandates (valid_until)
  WHERE status = 'active';

-- Settlement worker and reconciliation paths
CREATE INDEX idx_settlements_pending_org
  ON settlements (organization_id, created_at)
  WHERE status IN ('pending', 'prepared', 'submitted');

CREATE INDEX idx_settlements_chain_tx_pending
  ON settlements (chain_id, tx_hash)
  WHERE status IN ('submitted', 'confirmed') AND tx_hash IS NOT NULL;

-- Compliance attestation freshness checks
CREATE INDEX idx_compliance_attestations_active_subject
  ON compliance_attestations (organization_id, subject_type, subject_ref, expires_at)
  WHERE status = 'passed';

-- Risk score timeline queries
CREATE INDEX idx_risk_scores_execution_calculated
  ON risk_scores (execution_id, calculated_at DESC);

-- Audit export and timeline pagination
CREATE INDEX idx_audit_logs_org_created_desc
  ON audit_logs (organization_id, created_at DESC)
  WHERE organization_id IS NOT NULL;

CREATE INDEX idx_audit_events_org_created_desc
  ON audit_events (organization_id, created_at DESC)
  WHERE organization_id IS NOT NULL;

-- Webhook delivery retry sweeps
CREATE INDEX idx_webhook_deliveries_pending
  ON webhook_deliveries (status, created_at)
  WHERE status IN ('pending', 'retrying');

-- API key rotation and expiry maintenance
CREATE INDEX idx_api_keys_active_expiring
  ON api_keys (organization_id, expires_at)
  WHERE status = 'active' AND expires_at IS NOT NULL;

-- Agent metadata search (Phase 4 optional GIN when query patterns require)
CREATE INDEX idx_agents_metadata_gin ON agents USING gin (metadata);

-- Idempotency key and nonce lock expiry sweeps (indexed by expires_at in base migrations)
CREATE INDEX idx_intent_idempotency_keys_org_expires
  ON intent_idempotency_keys (organization_id, expires_at);

CREATE INDEX idx_nonce_locks_chain_expires
  ON nonce_locks (chain_id, expires_at);

-- Platform default risk models
CREATE INDEX idx_risk_models_platform_defaults
  ON risk_models (name, version)
  WHERE organization_id IS NULL;

-- Contract deployment lookup by name on active chains
CREATE INDEX idx_contract_deployments_active_by_name
  ON contract_deployments (contract_name, chain_id)
  WHERE status = 'active';
