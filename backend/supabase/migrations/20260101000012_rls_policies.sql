-- VALEN migration 012: row level security policies
-- Authority: VALEN_PHASE3_FOUNDATION.md, VALEN_PHASE4_PRODUCTION_SPECIFICATIONS.md

CREATE SCHEMA IF NOT EXISTS valen_auth;

CREATE OR REPLACE FUNCTION valen_auth.jwt_claim(p_claim text)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::json ->> p_claim, '');
$$;

CREATE OR REPLACE FUNCTION valen_auth.is_service_role()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(valen_auth.jwt_claim('role'), current_user) = 'service_role';
$$;

CREATE OR REPLACE FUNCTION valen_auth.current_privy_user_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(
    valen_auth.jwt_claim('privy_user_id'),
    valen_auth.jwt_claim('sub')
  );
$$;

CREATE OR REPLACE FUNCTION valen_auth.current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id
  FROM users u
  WHERE u.privy_user_id = valen_auth.current_privy_user_id()
    AND u.status = 'active'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION valen_auth.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(valen_auth.jwt_claim('is_platform_admin')::boolean, false)
    OR valen_auth.jwt_claim('platform_role') = 'platform_admin';
$$;

CREATE OR REPLACE FUNCTION valen_auth.is_active_org_member(p_organization_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM team_members tm
    WHERE tm.organization_id = p_organization_id
      AND tm.user_id = valen_auth.current_user_id()
      AND tm.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION valen_auth.has_org_role(
  p_organization_id uuid,
  p_roles platform_role[]
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM team_members tm
    WHERE tm.organization_id = p_organization_id
      AND tm.user_id = valen_auth.current_user_id()
      AND tm.status = 'active'
      AND tm.role = ANY (p_roles)
  );
$$;

GRANT USAGE ON SCHEMA valen_auth TO authenticated, anon, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA valen_auth TO authenticated, anon, service_role;

-- ---------------------------------------------------------------------------
-- Enable RLS on all tables
-- ---------------------------------------------------------------------------

ALTER TABLE chain_networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mandates ENABLE ROW LEVEL SECURITY;
ALTER TABLE executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE intent_idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_attestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE nonce_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE dead_letter_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Service role: full access (defense in depth; Supabase bypasses RLS for service_role)
-- ---------------------------------------------------------------------------

CREATE POLICY service_role_all_chain_networks ON chain_networks
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all_users ON users
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all_organizations ON organizations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all_team_members ON team_members
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all_agents ON agents
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all_agent_wallets ON agent_wallets
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all_api_keys ON api_keys
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all_policies ON policies
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all_policy_versions ON policy_versions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all_mandates ON mandates
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all_executions ON executions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all_intent_idempotency_keys ON intent_idempotency_keys
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all_compliance_attestations ON compliance_attestations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all_compliance_checks ON compliance_checks
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all_risk_models ON risk_models
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all_risk_scores ON risk_scores
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all_contract_deployments ON contract_deployments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all_settlements ON settlements
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all_nonce_locks ON nonce_locks
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_insert_audit_logs ON audit_logs
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY service_role_insert_audit_events ON audit_events
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY service_role_all_audit_commitments ON audit_commitments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all_notifications ON notifications
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all_webhooks ON webhooks
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all_webhook_deliveries ON webhook_deliveries
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all_dead_letter_jobs ON dead_letter_jobs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all_admin_actions ON admin_actions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all_emergency_actions ON emergency_actions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all_feature_flags ON feature_flags
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- chain_networks: public read of supported networks
-- ---------------------------------------------------------------------------

CREATE POLICY chain_networks_select_supported ON chain_networks
  FOR SELECT TO authenticated, anon
  USING (is_supported = true OR valen_auth.is_platform_admin());

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------

CREATE POLICY users_select_self_and_org ON users
  FOR SELECT TO authenticated
  USING (
    id = valen_auth.current_user_id()
    OR valen_auth.is_platform_admin()
    OR EXISTS (
      SELECT 1
      FROM team_members tm_self
      JOIN team_members tm_target ON tm_self.organization_id = tm_target.organization_id
      WHERE tm_self.user_id = valen_auth.current_user_id()
        AND tm_target.user_id = users.id
        AND tm_self.status = 'active'
        AND tm_target.status = 'active'
    )
  );

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------

CREATE POLICY organizations_select_member ON organizations
  FOR SELECT TO authenticated
  USING (
    valen_auth.is_active_org_member(id)
    OR valen_auth.is_platform_admin()
  );

-- ---------------------------------------------------------------------------
-- team_members
-- ---------------------------------------------------------------------------

CREATE POLICY team_members_select_org ON team_members
  FOR SELECT TO authenticated
  USING (
    valen_auth.is_active_org_member(organization_id)
    OR valen_auth.is_platform_admin()
  );

-- ---------------------------------------------------------------------------
-- Organization-owned domain tables (tenant isolation)
-- ---------------------------------------------------------------------------

CREATE POLICY agents_select_org ON agents
  FOR SELECT TO authenticated
  USING (
    valen_auth.is_active_org_member(organization_id)
    OR valen_auth.is_platform_admin()
  );

CREATE POLICY agent_wallets_select_org ON agent_wallets
  FOR SELECT TO authenticated
  USING (
    valen_auth.is_active_org_member(organization_id)
    OR valen_auth.is_platform_admin()
  );

CREATE POLICY api_keys_select_org ON api_keys
  FOR SELECT TO authenticated
  USING (
    valen_auth.has_org_role(
      organization_id,
      ARRAY['organization_owner', 'developer']::platform_role[]
    )
    OR valen_auth.is_platform_admin()
  );

CREATE POLICY policies_select_org ON policies
  FOR SELECT TO authenticated
  USING (
    valen_auth.is_active_org_member(organization_id)
    OR valen_auth.is_platform_admin()
  );

CREATE POLICY policy_versions_select_org ON policy_versions
  FOR SELECT TO authenticated
  USING (
    valen_auth.is_active_org_member(organization_id)
    OR valen_auth.is_platform_admin()
  );

CREATE POLICY mandates_select_authorized ON mandates
  FOR SELECT TO authenticated
  USING (
    valen_auth.has_org_role(
      organization_id,
      ARRAY['organization_owner', 'compliance_officer', 'auditor']::platform_role[]
    )
    OR valen_auth.is_platform_admin()
  );

CREATE POLICY executions_select_org ON executions
  FOR SELECT TO authenticated
  USING (
    valen_auth.is_active_org_member(organization_id)
    OR valen_auth.is_platform_admin()
  );

CREATE POLICY compliance_attestations_select_authorized ON compliance_attestations
  FOR SELECT TO authenticated
  USING (
    valen_auth.has_org_role(
      organization_id,
      ARRAY['organization_owner', 'compliance_officer', 'auditor']::platform_role[]
    )
    OR valen_auth.is_platform_admin()
  );

CREATE POLICY compliance_checks_select_authorized ON compliance_checks
  FOR SELECT TO authenticated
  USING (
    valen_auth.has_org_role(
      organization_id,
      ARRAY['organization_owner', 'compliance_officer', 'auditor']::platform_role[]
    )
    OR valen_auth.is_platform_admin()
  );

CREATE POLICY risk_models_select_authorized ON risk_models
  FOR SELECT TO authenticated
  USING (
    organization_id IS NULL
    OR valen_auth.has_org_role(
      organization_id,
      ARRAY['organization_owner', 'risk_officer', 'auditor']::platform_role[]
    )
    OR valen_auth.is_platform_admin()
  );

CREATE POLICY risk_scores_select_authorized ON risk_scores
  FOR SELECT TO authenticated
  USING (
    valen_auth.has_org_role(
      organization_id,
      ARRAY['organization_owner', 'risk_officer', 'auditor']::platform_role[]
    )
    OR valen_auth.is_platform_admin()
  );

CREATE POLICY settlements_select_authorized ON settlements
  FOR SELECT TO authenticated
  USING (
    valen_auth.has_org_role(
      organization_id,
      ARRAY['organization_owner', 'settlement_operator', 'auditor']::platform_role[]
    )
    OR valen_auth.is_platform_admin()
  );

CREATE POLICY notifications_select_org ON notifications
  FOR SELECT TO authenticated
  USING (
    valen_auth.is_active_org_member(organization_id)
    OR valen_auth.is_platform_admin()
  );

CREATE POLICY webhooks_select_authorized ON webhooks
  FOR SELECT TO authenticated
  USING (
    valen_auth.has_org_role(
      organization_id,
      ARRAY['organization_owner', 'developer', 'auditor']::platform_role[]
    )
    OR valen_auth.is_platform_admin()
  );

CREATE POLICY webhook_deliveries_select_authorized ON webhook_deliveries
  FOR SELECT TO authenticated
  USING (
    valen_auth.has_org_role(
      organization_id,
      ARRAY['organization_owner', 'developer']::platform_role[]
    )
    OR valen_auth.is_platform_admin()
  );

-- ---------------------------------------------------------------------------
-- contract_deployments: read active deployment addresses
-- ---------------------------------------------------------------------------

CREATE POLICY contract_deployments_select_active ON contract_deployments
  FOR SELECT TO authenticated
  USING (
    status = 'active'
    OR valen_auth.is_platform_admin()
  );

-- ---------------------------------------------------------------------------
-- Append-only audit tables: read by authorized roles; no authenticated writes
-- ---------------------------------------------------------------------------

CREATE POLICY audit_logs_select_authorized ON audit_logs
  FOR SELECT TO authenticated
  USING (
    valen_auth.is_platform_admin()
    OR (
      organization_id IS NOT NULL
      AND valen_auth.has_org_role(
        organization_id,
        ARRAY['organization_owner', 'compliance_officer', 'auditor']::platform_role[]
      )
    )
  );

CREATE POLICY audit_events_select_authorized ON audit_events
  FOR SELECT TO authenticated
  USING (
    valen_auth.is_platform_admin()
    OR (
      organization_id IS NOT NULL
      AND valen_auth.has_org_role(
        organization_id,
        ARRAY['organization_owner', 'compliance_officer', 'auditor']::platform_role[]
      )
    )
  );

CREATE POLICY audit_commitments_select_auditor ON audit_commitments
  FOR SELECT TO authenticated
  USING (
    valen_auth.is_platform_admin()
    OR (
      organization_id IS NOT NULL
      AND valen_auth.has_org_role(
        organization_id,
        ARRAY['auditor', 'organization_owner']::platform_role[]
      )
    )
  );

-- ---------------------------------------------------------------------------
-- Platform operations
-- ---------------------------------------------------------------------------

CREATE POLICY dead_letter_jobs_select_authorized ON dead_letter_jobs
  FOR SELECT TO authenticated
  USING (
    valen_auth.is_platform_admin()
    OR (
      organization_id IS NOT NULL
      AND valen_auth.has_org_role(
        organization_id,
        ARRAY['organization_owner', 'auditor']::platform_role[]
      )
    )
  );

CREATE POLICY admin_actions_select_authorized ON admin_actions
  FOR SELECT TO authenticated
  USING (
    valen_auth.is_platform_admin()
    OR (
      organization_id IS NOT NULL
      AND valen_auth.has_org_role(
        organization_id,
        ARRAY['organization_owner']::platform_role[]
      )
    )
  );

CREATE POLICY emergency_actions_select_authorized ON emergency_actions
  FOR SELECT TO authenticated
  USING (
    valen_auth.is_platform_admin()
    OR EXISTS (
      SELECT 1
      FROM team_members tm
      WHERE tm.user_id = valen_auth.current_user_id()
        AND tm.role = 'auditor'
        AND tm.status = 'active'
    )
  );

CREATE POLICY feature_flags_select_platform_admin ON feature_flags
  FOR SELECT TO authenticated
  USING (valen_auth.is_platform_admin());

-- intent_idempotency_keys and nonce_locks: service role only (no authenticated policies)
