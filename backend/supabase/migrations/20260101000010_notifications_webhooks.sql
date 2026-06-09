-- VALEN migration 010: notifications and webhooks
-- Authority: VALEN_PHASE4_PRODUCTION_SPECIFICATIONS.md

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  recipient_type text NOT NULL,
  recipient_ref text NOT NULL,
  channel notification_channel NOT NULL,
  template text NOT NULL,
  status notification_status NOT NULL DEFAULT 'queued',
  priority text NOT NULL DEFAULT 'normal',
  payload_ref text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notifications_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_organization_status_created
  ON notifications (organization_id, status, created_at);
CREATE INDEX idx_notifications_recipient
  ON notifications (recipient_type, recipient_ref);
CREATE INDEX idx_notifications_priority_status
  ON notifications (priority, status);

CREATE TABLE webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  url text NOT NULL,
  secret_hash text NOT NULL,
  subscribed_events text[] NOT NULL,
  status webhook_status NOT NULL DEFAULT 'active',
  failure_count integer NOT NULL DEFAULT 0,
  created_by_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT webhooks_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE,
  CONSTRAINT webhooks_created_by_user_id_fkey
    FOREIGN KEY (created_by_user_id) REFERENCES users (id)
);

CREATE INDEX idx_webhooks_organization_status ON webhooks (organization_id, status);
CREATE INDEX idx_webhooks_subscribed_events_gin ON webhooks USING gin (subscribed_events);
CREATE INDEX idx_webhooks_created_by_user_id ON webhooks (created_by_user_id);

CREATE TABLE webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  webhook_id uuid NOT NULL,
  event_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempt_count integer NOT NULL DEFAULT 0,
  last_status_code integer,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz,
  CONSTRAINT webhook_deliveries_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE,
  CONSTRAINT webhook_deliveries_webhook_id_fkey
    FOREIGN KEY (webhook_id) REFERENCES webhooks (id) ON DELETE CASCADE
);

CREATE INDEX idx_webhook_deliveries_webhook_created
  ON webhook_deliveries (webhook_id, created_at);
CREATE INDEX idx_webhook_deliveries_organization_status
  ON webhook_deliveries (organization_id, status);
CREATE INDEX idx_webhook_deliveries_event_name ON webhook_deliveries (event_name);
