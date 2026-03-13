-- VALEN migration 015: wallet ownership verification
-- Adds org-level owner wallet proof records without changing agent_wallets or settlement behavior.

CREATE TABLE wallet_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  user_id uuid,
  chain_id integer NOT NULL,
  wallet_address text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  challenge_nonce text NOT NULL,
  challenge_message text NOT NULL,
  challenge_expires_at timestamptz NOT NULL,
  signature text,
  verified_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT wallet_verifications_org_chain_wallet_unique UNIQUE (organization_id, chain_id, wallet_address),
  CONSTRAINT wallet_verifications_status_check CHECK (
    status IN ('pending', 'verified', 'revoked')
  ),
  CONSTRAINT wallet_verifications_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE,
  CONSTRAINT wallet_verifications_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT wallet_verifications_chain_id_fkey
    FOREIGN KEY (chain_id) REFERENCES chain_networks (chain_id)
);

CREATE INDEX idx_wallet_verifications_organization_status
  ON wallet_verifications (organization_id, status);
CREATE INDEX idx_wallet_verifications_wallet_address
  ON wallet_verifications (wallet_address);
