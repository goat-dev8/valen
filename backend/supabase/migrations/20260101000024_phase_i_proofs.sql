-- VALEN migration 024: Phase I public proof views.

CREATE OR REPLACE VIEW public_executions_v AS
SELECT
  e.id,
  e.organization_id,
  e.agent_id,
  e.action_type,
  e.target_chain_id AS chain_id,
  e.asset_address,
  e.value_amount,
  e.status,
  e.request_payload_hash AS payload_hash,
  e.created_at AS published_at,
  s.tx_hash AS settlement_tx,
  s.status AS settlement_status,
  rs.score AS risk_score,
  rs.tier AS risk_tier,
  rs.factor_summary AS risk_factors,
  m.signer_address AS mandate_signer,
  m.typed_data_hash AS mandate_hash
FROM executions e
LEFT JOIN settlements s ON s.execution_id = e.id
LEFT JOIN LATERAL (
  SELECT score, tier, factor_summary
  FROM risk_scores
  WHERE execution_id = e.id
  ORDER BY calculated_at DESC
  LIMIT 1
) rs ON true
LEFT JOIN mandates m ON m.id = e.mandate_id
WHERE e.status IN ('executed', 'settlement_submitted');

CREATE OR REPLACE VIEW public_refusals_v AS
SELECT
  e.id,
  e.organization_id,
  e.agent_id,
  e.action_type,
  e.target_chain_id AS chain_id,
  e.asset_address,
  e.value_amount,
  e.status,
  e.request_payload_hash AS payload_hash,
  e.created_at AS published_at,
  rs.score AS risk_score,
  rs.tier AS risk_tier,
  rs.factor_summary AS refusal_factors,
  rs.score_hash AS evidence_hash,
  m.signer_address AS mandate_signer,
  m.typed_data_hash AS mandate_hash
FROM executions e
LEFT JOIN LATERAL (
  SELECT score, tier, factor_summary, score_hash
  FROM risk_scores
  WHERE execution_id = e.id
  ORDER BY calculated_at DESC
  LIMIT 1
) rs ON true
LEFT JOIN mandates m ON m.id = e.mandate_id
WHERE e.status IN ('compliance_failed', 'risk_failed', 'policy_rejected', 'failed', 'cancelled');

CREATE OR REPLACE VIEW public_payments_v AS
SELECT
  p.id,
  p.organization_id,
  p.agent_id,
  p.chain_id,
  p.merchant_url,
  p.recipient,
  p.asset_address,
  p.asset_symbol,
  p.amount,
  p.nonce,
  p.status,
  p.refusal_reason,
  p.evidence_hash,
  p.settlement_tx,
  p.facilitator_response_hash,
  p.created_at AS published_at
FROM x402_payments p
WHERE p.status IN ('settled', 'refused');
