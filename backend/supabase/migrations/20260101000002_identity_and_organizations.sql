-- VALEN migration 002: chain networks, identity, organizations
-- Authority: VALEN_PHASE4_PRODUCTION_SPECIFICATIONS.md

CREATE TABLE chain_networks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id integer NOT NULL,
  name text NOT NULL,
  environment chain_environment NOT NULL,
  rpc_url_ref text NOT NULL,
  explorer_url text,
  native_symbol text NOT NULL DEFAULT 'ETH',
  is_supported boolean NOT NULL DEFAULT false,
  supports_stylus boolean NOT NULL DEFAULT false,
  supports_erc4337 boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chain_networks_chain_id_unique UNIQUE (chain_id)
);

CREATE INDEX idx_chain_networks_environment ON chain_networks (environment);
CREATE INDEX idx_chain_networks_is_supported ON chain_networks (is_supported);
CREATE INDEX idx_chain_networks_supports_stylus ON chain_networks (supports_stylus);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  privy_user_id text NOT NULL,
  email citext,
  display_name text,
  status user_status NOT NULL DEFAULT 'active',
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_privy_user_id_unique UNIQUE (privy_user_id),
  CONSTRAINT users_display_name_length_check CHECK (
    display_name IS NULL OR char_length(display_name) <= 120
  )
);

CREATE UNIQUE INDEX idx_users_email_unique ON users (email) WHERE email IS NOT NULL;
CREATE INDEX idx_users_status ON users (status);
CREATE INDEX idx_users_last_login_at ON users (last_login_at);

CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  status organization_status NOT NULL DEFAULT 'active',
  plan organization_plan NOT NULL DEFAULT 'development',
  default_chain_id integer,
  risk_mode text NOT NULL DEFAULT 'standard',
  compliance_mode text NOT NULL DEFAULT 'fail_closed',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT organizations_slug_unique UNIQUE (slug),
  CONSTRAINT organizations_name_length_check CHECK (char_length(name) BETWEEN 2 AND 120),
  CONSTRAINT organizations_slug_format_check CHECK (
    slug = lower(slug) AND slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  ),
  CONSTRAINT organizations_risk_mode_check CHECK (
    risk_mode IN ('conservative', 'standard', 'custom')
  ),
  CONSTRAINT organizations_compliance_mode_check CHECK (
    compliance_mode IN ('fail_closed', 'monitor_only')
  ),
  CONSTRAINT organizations_default_chain_id_fkey
    FOREIGN KEY (default_chain_id) REFERENCES chain_networks (chain_id)
);

CREATE INDEX idx_organizations_status ON organizations (status);
CREATE INDEX idx_organizations_plan ON organizations (plan);
CREATE INDEX idx_organizations_default_chain_id ON organizations (default_chain_id);

CREATE TABLE team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role platform_role NOT NULL,
  status team_member_status NOT NULL DEFAULT 'invited',
  invited_by_user_id uuid,
  joined_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT team_members_organization_user_unique UNIQUE (organization_id, user_id),
  CONSTRAINT team_members_org_role_check CHECK (
    role NOT IN ('platform_admin', 'service_account')
  ),
  CONSTRAINT team_members_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE,
  CONSTRAINT team_members_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT team_members_invited_by_user_id_fkey
    FOREIGN KEY (invited_by_user_id) REFERENCES users (id)
);

CREATE INDEX idx_team_members_organization_role ON team_members (organization_id, role);
CREATE INDEX idx_team_members_organization_status ON team_members (organization_id, status);
CREATE INDEX idx_team_members_user_id ON team_members (user_id);
