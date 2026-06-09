-- VALEN migration 001: extensions and enums
-- Authority: VALEN_PHASE4_PRODUCTION_SPECIFICATIONS.md

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

DO $$ BEGIN
  CREATE TYPE organization_status AS ENUM ('active', 'suspended', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE organization_plan AS ENUM ('development', 'beta', 'pro', 'enterprise');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('active', 'invited', 'suspended', 'deleted');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE team_member_status AS ENUM ('invited', 'active', 'suspended', 'removed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE platform_role AS ENUM (
    'platform_admin',
    'organization_owner',
    'compliance_officer',
    'risk_officer',
    'policy_manager',
    'settlement_operator',
    'auditor',
    'developer',
    'agent',
    'service_account'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE agent_status AS ENUM ('draft', 'active', 'suspended', 'revoked', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE agent_type AS ENUM ('hosted', 'external', 'service', 'experimental');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE wallet_type AS ENUM ('privy', 'safe', 'zerodev', 'turnkey', 'eoa', 'kms');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE policy_status AS ENUM ('draft', 'active', 'disabled', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE policy_version_status AS ENUM (
    'draft',
    'pending_approval',
    'published',
    'active',
    'retired'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE execution_status AS ENUM (
    'created',
    'validated',
    'compliance_failed',
    'risk_failed',
    'policy_rejected',
    'approval_required',
    'approved',
    'settlement_submitted',
    'executed',
    'failed',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE action_type AS ENUM (
    'transfer',
    'approve',
    'contract_call',
    'rebalance',
    'swap',
    'custom'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE compliance_status AS ENUM ('pending', 'passed', 'failed', 'expired', 'error');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE compliance_subject_type AS ENUM (
    'agent',
    'principal',
    'counterparty',
    'asset',
    'transaction',
    'contract'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE risk_tier AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE settlement_status AS ENUM (
    'pending',
    'prepared',
    'submitted',
    'confirmed',
    'failed',
    'reverted',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE actor_type AS ENUM ('user', 'agent', 'service_account', 'system', 'contract');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_channel AS ENUM ('email', 'webhook', 'in_app', 'slack', 'incident');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_status AS ENUM (
    'queued',
    'sent',
    'delivered',
    'failed',
    'suppressed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE webhook_status AS ENUM ('active', 'disabled', 'failing', 'revoked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE chain_environment AS ENUM ('local', 'testnet', 'mainnet');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE deployment_status AS ENUM ('planned', 'active', 'deprecated', 'disabled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
