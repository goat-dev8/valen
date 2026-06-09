-- VALEN migration 006: compliance attestations and checks
-- Authority: VALEN_PHASE4_PRODUCTION_SPECIFICATIONS.md

CREATE TABLE compliance_attestations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  provider text NOT NULL,
  subject_type compliance_subject_type NOT NULL,
  subject_ref text NOT NULL,
  attestation_hash text NOT NULL,
  reason_code text NOT NULL,
  status compliance_status NOT NULL DEFAULT 'passed',
  expires_at timestamptz NOT NULL,
  issued_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT compliance_attestations_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE
);

CREATE INDEX idx_compliance_attestations_org_subject
  ON compliance_attestations (organization_id, subject_type, subject_ref);
CREATE INDEX idx_compliance_attestations_attestation_hash
  ON compliance_attestations (attestation_hash);
CREATE INDEX idx_compliance_attestations_expires_at
  ON compliance_attestations (expires_at);
CREATE INDEX idx_compliance_attestations_provider_subject_ref
  ON compliance_attestations (provider, subject_ref);

CREATE TABLE compliance_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  execution_id uuid NOT NULL,
  status compliance_status NOT NULL DEFAULT 'pending',
  reason_code text NOT NULL,
  provider text NOT NULL,
  provider_ref text,
  subject_type compliance_subject_type NOT NULL,
  subject_ref text NOT NULL,
  attestation_hash text,
  result_hash text,
  expires_at timestamptz,
  checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT compliance_checks_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE,
  CONSTRAINT compliance_checks_execution_id_fkey
    FOREIGN KEY (execution_id) REFERENCES executions (id) ON DELETE CASCADE
);

CREATE INDEX idx_compliance_checks_execution_id ON compliance_checks (execution_id);
CREATE INDEX idx_compliance_checks_org_status_checked
  ON compliance_checks (organization_id, status, checked_at);
CREATE INDEX idx_compliance_checks_subject ON compliance_checks (subject_type, subject_ref);
CREATE INDEX idx_compliance_checks_expires_at ON compliance_checks (expires_at);
