-- VALEN migration 007: risk models and scores
-- Authority: VALEN_PHASE4_PRODUCTION_SPECIFICATIONS.md

CREATE TABLE risk_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid,
  name text NOT NULL,
  version text NOT NULL,
  model_hash text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT risk_models_organization_name_version_unique
    UNIQUE (organization_id, name, version),
  CONSTRAINT risk_models_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE
);

CREATE INDEX idx_risk_models_model_hash ON risk_models (model_hash);
CREATE INDEX idx_risk_models_status ON risk_models (status);

CREATE TABLE risk_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  execution_id uuid NOT NULL,
  risk_model_id uuid,
  score integer NOT NULL,
  tier risk_tier NOT NULL,
  factor_summary jsonb NOT NULL,
  score_hash text NOT NULL,
  requires_approval boolean NOT NULL DEFAULT false,
  calculated_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT risk_scores_score_range_check CHECK (score BETWEEN 0 AND 100),
  CONSTRAINT risk_scores_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE,
  CONSTRAINT risk_scores_execution_id_fkey
    FOREIGN KEY (execution_id) REFERENCES executions (id) ON DELETE CASCADE,
  CONSTRAINT risk_scores_risk_model_id_fkey
    FOREIGN KEY (risk_model_id) REFERENCES risk_models (id)
);

CREATE INDEX idx_risk_scores_execution_id ON risk_scores (execution_id);
CREATE INDEX idx_risk_scores_org_tier_calculated
  ON risk_scores (organization_id, tier, calculated_at);
CREATE INDEX idx_risk_scores_risk_model_id ON risk_scores (risk_model_id);
CREATE INDEX idx_risk_scores_score_hash ON risk_scores (score_hash);
