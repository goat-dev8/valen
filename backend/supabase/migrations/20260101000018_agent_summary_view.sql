-- VALEN migration 018: Phase B Mission Control summary view
-- Purpose: provide a fast, public-safe organization summary for the dashboard cockpit.

CREATE OR REPLACE VIEW agent_summary_v AS
WITH primary_agent AS (
  SELECT DISTINCT ON (organization_id)
    organization_id,
    id AS agent_id,
    name AS agent_name,
    status AS agent_status,
    default_policy_id,
    created_at
  FROM agents
  ORDER BY organization_id, (status = 'active') DESC, created_at DESC
),
primary_wallet AS (
  SELECT DISTINCT ON (organization_id, agent_id)
    organization_id,
    agent_id,
    chain_id,
    wallet_address
  FROM agent_wallets
  WHERE status = 'active'
  ORDER BY organization_id, agent_id, is_primary DESC, created_at DESC
),
execution_counts AS (
  SELECT
    organization_id,
    COUNT(*)::integer AS total_executions,
    COUNT(*) FILTER (WHERE status = 'executed')::integer AS executed_executions,
    COUNT(*) FILTER (WHERE status = 'approval_required')::integer AS approval_required_executions,
    COUNT(*) FILTER (
      WHERE status IN ('failed', 'cancelled', 'compliance_failed', 'risk_failed', 'policy_rejected')
    )::integer AS failed_or_refused_executions
  FROM executions
  GROUP BY organization_id
),
latest_execution AS (
  SELECT DISTINCT ON (organization_id)
    organization_id,
    id AS last_execution_id,
    status AS last_execution_status,
    action_type AS last_execution_action_type,
    target_chain_id AS last_execution_chain_id,
    asset_address AS last_execution_asset_address,
    created_at AS last_execution_created_at
  FROM executions
  ORDER BY organization_id, created_at DESC
),
latest_executed AS (
  SELECT DISTINCT ON (e.organization_id)
    e.organization_id,
    e.id AS last_executed_execution_id,
    e.action_type AS last_executed_action_type,
    e.target_chain_id AS last_executed_chain_id,
    e.asset_address AS last_executed_asset_address,
    e.created_at AS last_executed_created_at,
    s.tx_hash AS last_executed_tx_hash,
    s.block_number AS last_executed_block_number
  FROM executions e
  LEFT JOIN settlements s ON s.execution_id = e.id
  WHERE e.status = 'executed'
  ORDER BY e.organization_id, e.created_at DESC
),
latest_refusal_like AS (
  SELECT DISTINCT ON (organization_id)
    organization_id,
    id AS last_refusal_execution_id,
    status AS last_refusal_status,
    action_type AS last_refusal_action_type,
    target_chain_id AS last_refusal_chain_id,
    asset_address AS last_refusal_asset_address,
    created_at AS last_refusal_created_at
  FROM executions
  WHERE status IN ('compliance_failed', 'risk_failed', 'policy_rejected', 'failed', 'cancelled')
  ORDER BY organization_id, created_at DESC
),
latest_robinhood AS (
  SELECT DISTINCT ON (e.organization_id)
    e.organization_id,
    e.id AS last_robinhood_execution_id,
    e.status AS last_robinhood_status,
    e.action_type AS last_robinhood_action_type,
    e.asset_address AS last_robinhood_asset_address,
    e.created_at AS last_robinhood_created_at,
    s.tx_hash AS last_robinhood_tx_hash
  FROM executions e
  LEFT JOIN settlements s ON s.execution_id = e.id
  WHERE e.target_chain_id = 46630
  ORDER BY e.organization_id, e.created_at DESC
),
wallet_status AS (
  SELECT
    organization_id,
    BOOL_OR(status = 'verified') AS owner_wallet_verified,
    COUNT(*) FILTER (WHERE status = 'verified')::integer AS verified_wallet_count
  FROM wallet_verifications
  GROUP BY organization_id
),
mandate_status AS (
  SELECT
    organization_id,
    COUNT(*) FILTER (WHERE status = 'active')::integer AS active_mandate_count
  FROM mandates
  GROUP BY organization_id
),
policy_counts AS (
  SELECT
    organization_id,
    COUNT(*)::integer AS policy_count
  FROM policies
  GROUP BY organization_id
)
SELECT
  o.id AS organization_id,
  o.name AS organization_name,
  o.default_chain_id,
  pa.agent_id,
  pa.agent_name,
  pa.agent_status,
  pa.default_policy_id,
  pw.wallet_address AS agent_wallet_address,
  pw.chain_id AS agent_wallet_chain_id,
  COALESCE(pc.policy_count, 0) AS policy_count,
  COALESCE(ms.active_mandate_count, 0) AS active_mandate_count,
  COALESCE(ws.owner_wallet_verified, false) AS owner_wallet_verified,
  COALESCE(ws.verified_wallet_count, 0) AS verified_wallet_count,
  COALESCE(ec.total_executions, 0) AS total_executions,
  COALESCE(ec.executed_executions, 0) AS executed_executions,
  COALESCE(ec.approval_required_executions, 0) AS approval_required_executions,
  COALESCE(ec.failed_or_refused_executions, 0) AS failed_or_refused_executions,
  le.last_execution_id,
  le.last_execution_status,
  le.last_execution_action_type,
  le.last_execution_chain_id,
  le.last_execution_asset_address,
  le.last_execution_created_at,
  lx.last_executed_execution_id,
  lx.last_executed_action_type,
  lx.last_executed_chain_id,
  lx.last_executed_asset_address,
  lx.last_executed_created_at,
  lx.last_executed_tx_hash,
  lx.last_executed_block_number,
  lr.last_refusal_execution_id,
  lr.last_refusal_status,
  lr.last_refusal_action_type,
  lr.last_refusal_chain_id,
  lr.last_refusal_asset_address,
  lr.last_refusal_created_at,
  rh.last_robinhood_execution_id,
  rh.last_robinhood_status,
  rh.last_robinhood_action_type,
  rh.last_robinhood_asset_address,
  rh.last_robinhood_created_at,
  rh.last_robinhood_tx_hash
FROM organizations o
LEFT JOIN primary_agent pa ON pa.organization_id = o.id
LEFT JOIN primary_wallet pw ON pw.organization_id = o.id AND pw.agent_id = pa.agent_id
LEFT JOIN policy_counts pc ON pc.organization_id = o.id
LEFT JOIN mandate_status ms ON ms.organization_id = o.id
LEFT JOIN wallet_status ws ON ws.organization_id = o.id
LEFT JOIN execution_counts ec ON ec.organization_id = o.id
LEFT JOIN latest_execution le ON le.organization_id = o.id
LEFT JOIN latest_executed lx ON lx.organization_id = o.id
LEFT JOIN latest_refusal_like lr ON lr.organization_id = o.id
LEFT JOIN latest_robinhood rh ON rh.organization_id = o.id;
