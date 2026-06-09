-- VALEN migration 009: audit logs, events, commitments
-- Authority: VALEN_PHASE4_PRODUCTION_SPECIFICATIONS.md

CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid,
  actor_type actor_type NOT NULL,
  actor_id text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  event_hash text NOT NULL,
  payload_ref text,
  chain_id integer,
  tx_hash text,
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT audit_logs_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE SET NULL,
  CONSTRAINT audit_logs_chain_id_fkey
    FOREIGN KEY (chain_id) REFERENCES chain_networks (chain_id)
);

CREATE INDEX idx_audit_logs_organization_created
  ON audit_logs (organization_id, created_at);
CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs (actor_type, actor_id);
CREATE INDEX idx_audit_logs_chain_tx_hash ON audit_logs (chain_id, tx_hash);
CREATE INDEX idx_audit_logs_event_hash ON audit_logs (event_hash);

CREATE TABLE audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid,
  event_name text NOT NULL,
  event_hash text NOT NULL,
  related_entity_type text NOT NULL,
  related_entity_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT audit_events_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE SET NULL
);

CREATE INDEX idx_audit_events_event_name_created
  ON audit_events (event_name, created_at);
CREATE INDEX idx_audit_events_related_entity
  ON audit_events (related_entity_type, related_entity_id);
CREATE INDEX idx_audit_events_event_hash ON audit_events (event_hash);

CREATE TABLE audit_commitments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid,
  audit_log_id uuid NOT NULL,
  chain_id integer NOT NULL,
  commitment_hash text NOT NULL,
  tx_hash text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT audit_commitments_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE SET NULL,
  CONSTRAINT audit_commitments_audit_log_id_fkey
    FOREIGN KEY (audit_log_id) REFERENCES audit_logs (id) ON DELETE CASCADE,
  CONSTRAINT audit_commitments_chain_id_fkey
    FOREIGN KEY (chain_id) REFERENCES chain_networks (chain_id)
);

CREATE INDEX idx_audit_commitments_audit_log_id ON audit_commitments (audit_log_id);
CREATE INDEX idx_audit_commitments_chain_commitment
  ON audit_commitments (chain_id, commitment_hash);
CREATE INDEX idx_audit_commitments_tx_hash ON audit_commitments (tx_hash);

CREATE OR REPLACE FUNCTION valen_prevent_audit_append_only_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Audit table % is append-only; % is not permitted', TG_TABLE_NAME, TG_OP;
END;
$$;

CREATE TRIGGER audit_logs_prevent_update
  BEFORE UPDATE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION valen_prevent_audit_append_only_mutation();

CREATE TRIGGER audit_logs_prevent_delete
  BEFORE DELETE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION valen_prevent_audit_append_only_mutation();

CREATE TRIGGER audit_events_prevent_update
  BEFORE UPDATE ON audit_events
  FOR EACH ROW
  EXECUTE FUNCTION valen_prevent_audit_append_only_mutation();

CREATE TRIGGER audit_events_prevent_delete
  BEFORE DELETE ON audit_events
  FOR EACH ROW
  EXECUTE FUNCTION valen_prevent_audit_append_only_mutation();
