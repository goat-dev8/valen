-- VALEN Phase A baseline schema snapshot
-- Generated: 2026-06-13T14:34:47.514Z
-- Source: information_schema + pg_indexes via backend environment; pg_dump binary unavailable in local tool environment.


-- Table: public._valen_migrations
--   id: integer; nullable=NO; default=nextval('_valen_migrations_id_seq'::regclass)
--   filename: text; nullable=NO; default=
--   applied_at: timestamp with time zone; nullable=NO; default=now()

-- Table: public.admin_actions
--   id: uuid; nullable=NO; default=gen_random_uuid()
--   actor_user_id: uuid; nullable=NO; default=
--   organization_id: uuid; nullable=YES; default=
--   action: text; nullable=NO; default=
--   target_type: text; nullable=NO; default=
--   target_id: text; nullable=NO; default=
--   reason: text; nullable=NO; default=
--   created_at: timestamp with time zone; nullable=NO; default=now()

-- Table: public.agent_wallets
--   id: uuid; nullable=NO; default=gen_random_uuid()
--   organization_id: uuid; nullable=NO; default=
--   agent_id: uuid; nullable=NO; default=
--   chain_id: integer; nullable=NO; default=
--   wallet_address: text; nullable=NO; default=
--   wallet_type: USER-DEFINED; nullable=NO; default=
--   status: text; nullable=NO; default='active'::text
--   is_primary: boolean; nullable=NO; default=false
--   created_at: timestamp with time zone; nullable=NO; default=now()
--   updated_at: timestamp with time zone; nullable=NO; default=now()

-- Table: public.agents
--   id: uuid; nullable=NO; default=gen_random_uuid()
--   organization_id: uuid; nullable=NO; default=
--   name: text; nullable=NO; default=
--   description: text; nullable=YES; default=
--   status: USER-DEFINED; nullable=NO; default='draft'::agent_status
--   agent_type: USER-DEFINED; nullable=NO; default=
--   external_ref: text; nullable=YES; default=
--   default_policy_id: uuid; nullable=YES; default=
--   metadata: jsonb; nullable=NO; default='{}'::jsonb
--   created_by_user_id: uuid; nullable=YES; default=
--   created_at: timestamp with time zone; nullable=NO; default=now()
--   updated_at: timestamp with time zone; nullable=NO; default=now()

-- Table: public.api_keys
--   id: uuid; nullable=NO; default=gen_random_uuid()
--   organization_id: uuid; nullable=NO; default=
--   agent_id: uuid; nullable=YES; default=
--   name: text; nullable=NO; default=
--   key_prefix: text; nullable=NO; default=
--   key_hash: text; nullable=NO; default=
--   scopes: ARRAY; nullable=NO; default='{}'::text[]
--   status: text; nullable=NO; default='active'::text
--   expires_at: timestamp with time zone; nullable=YES; default=
--   last_used_at: timestamp with time zone; nullable=YES; default=
--   created_by_user_id: uuid; nullable=YES; default=
--   created_at: timestamp with time zone; nullable=NO; default=now()
--   revoked_at: timestamp with time zone; nullable=YES; default=
--   mandate_id: uuid; nullable=YES; default=

-- Table: public.audit_commitments
--   id: uuid; nullable=NO; default=gen_random_uuid()
--   organization_id: uuid; nullable=YES; default=
--   audit_log_id: uuid; nullable=NO; default=
--   chain_id: integer; nullable=NO; default=
--   commitment_hash: text; nullable=NO; default=
--   tx_hash: text; nullable=YES; default=
--   status: text; nullable=NO; default='pending'::text
--   created_at: timestamp with time zone; nullable=NO; default=now()

-- Table: public.audit_events
--   id: uuid; nullable=NO; default=gen_random_uuid()
--   organization_id: uuid; nullable=YES; default=
--   event_name: text; nullable=NO; default=
--   event_hash: text; nullable=NO; default=
--   related_entity_type: text; nullable=NO; default=
--   related_entity_id: text; nullable=NO; default=
--   created_at: timestamp with time zone; nullable=NO; default=now()

-- Table: public.audit_logs
--   id: uuid; nullable=NO; default=gen_random_uuid()
--   organization_id: uuid; nullable=YES; default=
--   actor_type: USER-DEFINED; nullable=NO; default=
--   actor_id: text; nullable=YES; default=
--   action: text; nullable=NO; default=
--   entity_type: text; nullable=NO; default=
--   entity_id: text; nullable=NO; default=
--   event_hash: text; nullable=NO; default=
--   payload_ref: text; nullable=YES; default=
--   chain_id: integer; nullable=YES; default=
--   tx_hash: text; nullable=YES; default=
--   ip_address: inet; nullable=YES; default=
--   user_agent: text; nullable=YES; default=
--   created_at: timestamp with time zone; nullable=NO; default=now()

-- Table: public.chain_networks
--   id: uuid; nullable=NO; default=gen_random_uuid()
--   chain_id: integer; nullable=NO; default=
--   name: text; nullable=NO; default=
--   environment: USER-DEFINED; nullable=NO; default=
--   rpc_url_ref: text; nullable=NO; default=
--   explorer_url: text; nullable=YES; default=
--   native_symbol: text; nullable=NO; default='ETH'::text
--   is_supported: boolean; nullable=NO; default=false
--   supports_stylus: boolean; nullable=NO; default=false
--   supports_erc4337: boolean; nullable=NO; default=false
--   created_at: timestamp with time zone; nullable=NO; default=now()

-- Table: public.compliance_attestations
--   id: uuid; nullable=NO; default=gen_random_uuid()
--   organization_id: uuid; nullable=NO; default=
--   provider: text; nullable=NO; default=
--   subject_type: USER-DEFINED; nullable=NO; default=
--   subject_ref: text; nullable=NO; default=
--   attestation_hash: text; nullable=NO; default=
--   reason_code: text; nullable=NO; default=
--   status: USER-DEFINED; nullable=NO; default='passed'::compliance_status
--   expires_at: timestamp with time zone; nullable=NO; default=
--   issued_at: timestamp with time zone; nullable=NO; default=
--   created_at: timestamp with time zone; nullable=NO; default=now()

-- Table: public.compliance_checks
--   id: uuid; nullable=NO; default=gen_random_uuid()
--   organization_id: uuid; nullable=NO; default=
--   execution_id: uuid; nullable=NO; default=
--   status: USER-DEFINED; nullable=NO; default='pending'::compliance_status
--   reason_code: text; nullable=NO; default=
--   provider: text; nullable=NO; default=
--   provider_ref: text; nullable=YES; default=
--   subject_type: USER-DEFINED; nullable=NO; default=
--   subject_ref: text; nullable=NO; default=
--   attestation_hash: text; nullable=YES; default=
--   result_hash: text; nullable=YES; default=
--   expires_at: timestamp with time zone; nullable=YES; default=
--   checked_at: timestamp with time zone; nullable=YES; default=
--   created_at: timestamp with time zone; nullable=NO; default=now()

-- Table: public.contract_deployments
--   id: uuid; nullable=NO; default=gen_random_uuid()
--   chain_id: integer; nullable=NO; default=
--   contract_name: text; nullable=NO; default=
--   contract_address: text; nullable=NO; default=
--   implementation_address: text; nullable=YES; default=
--   deployment_tx_hash: text; nullable=NO; default=
--   version: text; nullable=NO; default=
--   status: USER-DEFINED; nullable=NO; default='planned'::deployment_status
--   deployed_at: timestamp with time zone; nullable=NO; default=
--   created_at: timestamp with time zone; nullable=NO; default=now()

-- Table: public.dead_letter_jobs
--   id: uuid; nullable=NO; default=gen_random_uuid()
--   queue_name: text; nullable=NO; default=
--   job_id: text; nullable=NO; default=
--   organization_id: uuid; nullable=YES; default=
--   execution_id: uuid; nullable=YES; default=
--   failure_reason: text; nullable=NO; default=
--   retry_count: integer; nullable=NO; default=
--   payload_ref: text; nullable=YES; default=
--   status: text; nullable=NO; default='open'::text
--   created_at: timestamp with time zone; nullable=NO; default=now()
--   resolved_at: timestamp with time zone; nullable=YES; default=

-- Table: public.emergency_actions
--   id: uuid; nullable=NO; default=gen_random_uuid()
--   actor_user_id: uuid; nullable=NO; default=
--   scope: text; nullable=NO; default=
--   scope_ref: text; nullable=YES; default=
--   action: text; nullable=NO; default=
--   reason: text; nullable=NO; default=
--   chain_id: integer; nullable=YES; default=
--   tx_hash: text; nullable=YES; default=
--   created_at: timestamp with time zone; nullable=NO; default=now()
--   lifted_at: timestamp with time zone; nullable=YES; default=

-- Table: public.executions
--   id: uuid; nullable=NO; default=gen_random_uuid()
--   organization_id: uuid; nullable=NO; default=
--   agent_id: uuid; nullable=NO; default=
--   mandate_id: uuid; nullable=YES; default=
--   policy_id: uuid; nullable=YES; default=
--   policy_version_id: uuid; nullable=YES; default=
--   idempotency_key: text; nullable=NO; default=
--   action_type: USER-DEFINED; nullable=NO; default=
--   status: USER-DEFINED; nullable=NO; default='created'::execution_status
--   request_payload_hash: text; nullable=NO; default=
--   request_payload_ref: text; nullable=YES; default=
--   target_chain_id: integer; nullable=NO; default=
--   target_address: text; nullable=YES; default=
--   asset_address: text; nullable=YES; default=
--   value_amount: numeric; nullable=YES; default=
--   metadata: jsonb; nullable=NO; default='{}'::jsonb
--   created_at: timestamp with time zone; nullable=NO; default=now()
--   updated_at: timestamp with time zone; nullable=NO; default=now()

-- Table: public.feature_flags
--   id: uuid; nullable=NO; default=gen_random_uuid()
--   key: text; nullable=NO; default=
--   environment: text; nullable=NO; default=
--   enabled: boolean; nullable=NO; default=false
--   rules: jsonb; nullable=NO; default='{}'::jsonb
--   created_at: timestamp with time zone; nullable=NO; default=now()
--   updated_at: timestamp with time zone; nullable=NO; default=now()

-- Table: public.intent_idempotency_keys
--   id: uuid; nullable=NO; default=gen_random_uuid()
--   organization_id: uuid; nullable=NO; default=
--   idempotency_key: text; nullable=NO; default=
--   execution_id: uuid; nullable=NO; default=
--   expires_at: timestamp with time zone; nullable=NO; default=
--   created_at: timestamp with time zone; nullable=NO; default=now()

-- Table: public.mandates
--   id: uuid; nullable=NO; default=gen_random_uuid()
--   organization_id: uuid; nullable=NO; default=
--   agent_id: uuid; nullable=NO; default=
--   principal_user_id: uuid; nullable=YES; default=
--   chain_id: integer; nullable=NO; default=
--   onchain_mandate_id: text; nullable=YES; default=
--   scope_hash: text; nullable=NO; default=
--   status: text; nullable=NO; default='draft'::text
--   valid_from: timestamp with time zone; nullable=NO; default=
--   valid_until: timestamp with time zone; nullable=NO; default=
--   max_per_transaction: numeric; nullable=YES; default=
--   max_total: numeric; nullable=YES; default=
--   used_total: numeric; nullable=NO; default=0
--   created_by_user_id: uuid; nullable=YES; default=
--   created_at: timestamp with time zone; nullable=NO; default=now()
--   updated_at: timestamp with time zone; nullable=NO; default=now()
--   policy_id: uuid; nullable=YES; default=
--   signer_address: text; nullable=YES; default=
--   signature: text; nullable=YES; default=
--   typed_data_hash: text; nullable=YES; default=
--   typed_data: jsonb; nullable=YES; default=
--   allowed_chains: ARRAY; nullable=NO; default='{}'::integer[]
--   allowed_actions: ARRAY; nullable=NO; default='{}'::text[]
--   allowed_assets: ARRAY; nullable=NO; default='{}'::text[]
--   allowed_targets: ARRAY; nullable=NO; default='{}'::text[]
--   approval_threshold: text; nullable=YES; default=
--   revoked_at: timestamp with time zone; nullable=YES; default=

-- Table: public.nonce_locks
--   id: uuid; nullable=NO; default=gen_random_uuid()
--   chain_id: integer; nullable=NO; default=
--   signer_address: text; nullable=NO; default=
--   nonce_value: bigint; nullable=NO; default=
--   lock_key: text; nullable=NO; default=
--   status: text; nullable=NO; default='locked'::text
--   expires_at: timestamp with time zone; nullable=NO; default=
--   created_at: timestamp with time zone; nullable=NO; default=now()

-- Table: public.notifications
--   id: uuid; nullable=NO; default=gen_random_uuid()
--   organization_id: uuid; nullable=NO; default=
--   recipient_type: text; nullable=NO; default=
--   recipient_ref: text; nullable=NO; default=
--   channel: USER-DEFINED; nullable=NO; default=
--   template: text; nullable=NO; default=
--   status: USER-DEFINED; nullable=NO; default='queued'::notification_status
--   priority: text; nullable=NO; default='normal'::text
--   payload_ref: text; nullable=YES; default=
--   sent_at: timestamp with time zone; nullable=YES; default=
--   created_at: timestamp with time zone; nullable=NO; default=now()

-- Table: public.organizations
--   id: uuid; nullable=NO; default=gen_random_uuid()
--   name: text; nullable=NO; default=
--   slug: text; nullable=NO; default=
--   status: USER-DEFINED; nullable=NO; default='active'::organization_status
--   plan: USER-DEFINED; nullable=NO; default='development'::organization_plan
--   default_chain_id: integer; nullable=YES; default=
--   risk_mode: text; nullable=NO; default='standard'::text
--   compliance_mode: text; nullable=NO; default='fail_closed'::text
--   created_at: timestamp with time zone; nullable=NO; default=now()
--   updated_at: timestamp with time zone; nullable=NO; default=now()

-- Table: public.policies
--   id: uuid; nullable=NO; default=gen_random_uuid()
--   organization_id: uuid; nullable=NO; default=
--   name: text; nullable=NO; default=
--   description: text; nullable=YES; default=
--   status: USER-DEFINED; nullable=NO; default='draft'::policy_status
--   active_version_id: uuid; nullable=YES; default=
--   created_by_user_id: uuid; nullable=YES; default=
--   created_at: timestamp with time zone; nullable=NO; default=now()
--   updated_at: timestamp with time zone; nullable=NO; default=now()

-- Table: public.policy_versions
--   id: uuid; nullable=NO; default=gen_random_uuid()
--   organization_id: uuid; nullable=NO; default=
--   policy_id: uuid; nullable=NO; default=
--   version_number: integer; nullable=NO; default=
--   status: USER-DEFINED; nullable=NO; default='draft'::policy_version_status
--   rules: jsonb; nullable=NO; default=
--   rules_hash: text; nullable=YES; default=
--   published_by_user_id: uuid; nullable=YES; default=
--   published_at: timestamp with time zone; nullable=YES; default=
--   activated_at: timestamp with time zone; nullable=YES; default=
--   created_at: timestamp with time zone; nullable=NO; default=now()

-- Table: public.risk_models
--   id: uuid; nullable=NO; default=gen_random_uuid()
--   organization_id: uuid; nullable=YES; default=
--   name: text; nullable=NO; default=
--   version: text; nullable=NO; default=
--   model_hash: text; nullable=NO; default=
--   status: text; nullable=NO; default='active'::text
--   created_at: timestamp with time zone; nullable=NO; default=now()

-- Table: public.risk_scores
--   id: uuid; nullable=NO; default=gen_random_uuid()
--   organization_id: uuid; nullable=NO; default=
--   execution_id: uuid; nullable=NO; default=
--   risk_model_id: uuid; nullable=YES; default=
--   score: integer; nullable=NO; default=
--   tier: USER-DEFINED; nullable=NO; default=
--   factor_summary: jsonb; nullable=NO; default=
--   score_hash: text; nullable=NO; default=
--   requires_approval: boolean; nullable=NO; default=false
--   calculated_at: timestamp with time zone; nullable=NO; default=
--   created_at: timestamp with time zone; nullable=NO; default=now()

-- Table: public.settlements
--   id: uuid; nullable=NO; default=gen_random_uuid()
--   organization_id: uuid; nullable=NO; default=
--   execution_id: uuid; nullable=NO; default=
--   chain_id: integer; nullable=NO; default=
--   contract_address: text; nullable=NO; default=
--   target_address: text; nullable=YES; default=
--   status: USER-DEFINED; nullable=NO; default='pending'::settlement_status
--   tx_hash: text; nullable=YES; default=
--   user_operation_hash: text; nullable=YES; default=
--   block_number: bigint; nullable=YES; default=
--   failure_reason: text; nullable=YES; default=
--   submitted_at: timestamp with time zone; nullable=YES; default=
--   confirmed_at: timestamp with time zone; nullable=YES; default=
--   created_at: timestamp with time zone; nullable=NO; default=now()
--   updated_at: timestamp with time zone; nullable=NO; default=now()
--   on_chain_settlement_id: text; nullable=YES; default=
--   submit_tx_hash: text; nullable=YES; default=
--   approve_tx_hash: text; nullable=YES; default=

-- Table: public.team_members
--   id: uuid; nullable=NO; default=gen_random_uuid()
--   organization_id: uuid; nullable=NO; default=
--   user_id: uuid; nullable=NO; default=
--   role: USER-DEFINED; nullable=NO; default=
--   status: USER-DEFINED; nullable=NO; default='invited'::team_member_status
--   invited_by_user_id: uuid; nullable=YES; default=
--   joined_at: timestamp with time zone; nullable=YES; default=
--   created_at: timestamp with time zone; nullable=NO; default=now()
--   updated_at: timestamp with time zone; nullable=NO; default=now()

-- Table: public.users
--   id: uuid; nullable=NO; default=gen_random_uuid()
--   privy_user_id: text; nullable=NO; default=
--   email: USER-DEFINED; nullable=YES; default=
--   display_name: text; nullable=YES; default=
--   status: USER-DEFINED; nullable=NO; default='active'::user_status
--   last_login_at: timestamp with time zone; nullable=YES; default=
--   created_at: timestamp with time zone; nullable=NO; default=now()
--   updated_at: timestamp with time zone; nullable=NO; default=now()

-- Table: public.wallet_verifications
--   id: uuid; nullable=NO; default=gen_random_uuid()
--   organization_id: uuid; nullable=NO; default=
--   user_id: uuid; nullable=YES; default=
--   chain_id: integer; nullable=NO; default=
--   wallet_address: text; nullable=NO; default=
--   status: text; nullable=NO; default='pending'::text
--   challenge_nonce: text; nullable=NO; default=
--   challenge_message: text; nullable=NO; default=
--   challenge_expires_at: timestamp with time zone; nullable=NO; default=
--   signature: text; nullable=YES; default=
--   verified_at: timestamp with time zone; nullable=YES; default=
--   revoked_at: timestamp with time zone; nullable=YES; default=
--   created_at: timestamp with time zone; nullable=NO; default=now()
--   updated_at: timestamp with time zone; nullable=NO; default=now()

-- Table: public.webhook_deliveries
--   id: uuid; nullable=NO; default=gen_random_uuid()
--   organization_id: uuid; nullable=NO; default=
--   webhook_id: uuid; nullable=NO; default=
--   event_name: text; nullable=NO; default=
--   status: text; nullable=NO; default='pending'::text
--   attempt_count: integer; nullable=NO; default=0
--   last_status_code: integer; nullable=YES; default=
--   last_error: text; nullable=YES; default=
--   created_at: timestamp with time zone; nullable=NO; default=now()
--   delivered_at: timestamp with time zone; nullable=YES; default=

-- Table: public.webhooks
--   id: uuid; nullable=NO; default=gen_random_uuid()
--   organization_id: uuid; nullable=NO; default=
--   name: text; nullable=NO; default=
--   url: text; nullable=NO; default=
--   secret_hash: text; nullable=NO; default=
--   subscribed_events: ARRAY; nullable=NO; default=
--   status: USER-DEFINED; nullable=NO; default='active'::webhook_status
--   failure_count: integer; nullable=NO; default=0
--   created_by_user_id: uuid; nullable=YES; default=
--   created_at: timestamp with time zone; nullable=NO; default=now()
--   updated_at: timestamp with time zone; nullable=NO; default=now()

-- Indexes
CREATE UNIQUE INDEX _valen_migrations_filename_key ON public._valen_migrations USING btree (filename);
CREATE UNIQUE INDEX _valen_migrations_pkey ON public._valen_migrations USING btree (id);
CREATE UNIQUE INDEX admin_actions_pkey ON public.admin_actions USING btree (id);
CREATE INDEX idx_admin_actions_actor_created ON public.admin_actions USING btree (actor_user_id, created_at);
CREATE INDEX idx_admin_actions_organization_created ON public.admin_actions USING btree (organization_id, created_at);
CREATE INDEX idx_admin_actions_target ON public.admin_actions USING btree (target_type, target_id);
CREATE UNIQUE INDEX agent_wallets_chain_wallet_unique ON public.agent_wallets USING btree (chain_id, wallet_address);
CREATE UNIQUE INDEX agent_wallets_pkey ON public.agent_wallets USING btree (id);
CREATE INDEX idx_agent_wallets_agent_id ON public.agent_wallets USING btree (agent_id);
CREATE INDEX idx_agent_wallets_organization_chain ON public.agent_wallets USING btree (organization_id, chain_id);
CREATE UNIQUE INDEX idx_agent_wallets_primary_per_chain ON public.agent_wallets USING btree (agent_id, chain_id) WHERE ((is_primary = true) AND (status = 'active'::text));
CREATE UNIQUE INDEX agents_pkey ON public.agents USING btree (id);
CREATE INDEX idx_agents_default_policy_id ON public.agents USING btree (default_policy_id);
CREATE INDEX idx_agents_external_ref ON public.agents USING btree (external_ref) WHERE (external_ref IS NOT NULL);
CREATE INDEX idx_agents_metadata_gin ON public.agents USING gin (metadata);
CREATE INDEX idx_agents_organization_agent_type ON public.agents USING btree (organization_id, agent_type);
CREATE INDEX idx_agents_organization_status ON public.agents USING btree (organization_id, status);
CREATE UNIQUE INDEX api_keys_key_prefix_unique ON public.api_keys USING btree (key_prefix);
CREATE UNIQUE INDEX api_keys_pkey ON public.api_keys USING btree (id);
CREATE INDEX idx_api_keys_active_expiring ON public.api_keys USING btree (organization_id, expires_at) WHERE ((status = 'active'::text) AND (expires_at IS NOT NULL));
CREATE INDEX idx_api_keys_agent_id ON public.api_keys USING btree (agent_id);
CREATE INDEX idx_api_keys_expires_at ON public.api_keys USING btree (expires_at);
CREATE INDEX idx_api_keys_mandate_id ON public.api_keys USING btree (mandate_id);
CREATE INDEX idx_api_keys_organization_status ON public.api_keys USING btree (organization_id, status);
CREATE UNIQUE INDEX audit_commitments_pkey ON public.audit_commitments USING btree (id);
CREATE INDEX idx_audit_commitments_audit_log_id ON public.audit_commitments USING btree (audit_log_id);
CREATE INDEX idx_audit_commitments_chain_commitment ON public.audit_commitments USING btree (chain_id, commitment_hash);
CREATE INDEX idx_audit_commitments_tx_hash ON public.audit_commitments USING btree (tx_hash);
CREATE UNIQUE INDEX audit_events_pkey ON public.audit_events USING btree (id);
CREATE INDEX idx_audit_events_event_hash ON public.audit_events USING btree (event_hash);
CREATE INDEX idx_audit_events_event_name_created ON public.audit_events USING btree (event_name, created_at);
CREATE INDEX idx_audit_events_org_created_desc ON public.audit_events USING btree (organization_id, created_at DESC) WHERE (organization_id IS NOT NULL);
CREATE INDEX idx_audit_events_related_entity ON public.audit_events USING btree (related_entity_type, related_entity_id);
CREATE UNIQUE INDEX audit_logs_pkey ON public.audit_logs USING btree (id);
CREATE INDEX idx_audit_logs_actor ON public.audit_logs USING btree (actor_type, actor_id);
CREATE INDEX idx_audit_logs_chain_tx_hash ON public.audit_logs USING btree (chain_id, tx_hash);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs USING btree (entity_type, entity_id);
CREATE INDEX idx_audit_logs_event_hash ON public.audit_logs USING btree (event_hash);
CREATE INDEX idx_audit_logs_org_created_desc ON public.audit_logs USING btree (organization_id, created_at DESC) WHERE (organization_id IS NOT NULL);
CREATE INDEX idx_audit_logs_organization_created ON public.audit_logs USING btree (organization_id, created_at);
CREATE UNIQUE INDEX chain_networks_chain_id_unique ON public.chain_networks USING btree (chain_id);
CREATE UNIQUE INDEX chain_networks_pkey ON public.chain_networks USING btree (id);
CREATE INDEX idx_chain_networks_environment ON public.chain_networks USING btree (environment);
CREATE INDEX idx_chain_networks_is_supported ON public.chain_networks USING btree (is_supported);
CREATE INDEX idx_chain_networks_supports_stylus ON public.chain_networks USING btree (supports_stylus);
CREATE UNIQUE INDEX compliance_attestations_pkey ON public.compliance_attestations USING btree (id);
CREATE INDEX idx_compliance_attestations_active_subject ON public.compliance_attestations USING btree (organization_id, subject_type, subject_ref, expires_at) WHERE (status = 'passed'::compliance_status);
CREATE INDEX idx_compliance_attestations_attestation_hash ON public.compliance_attestations USING btree (attestation_hash);
CREATE INDEX idx_compliance_attestations_expires_at ON public.compliance_attestations USING btree (expires_at);
CREATE INDEX idx_compliance_attestations_org_subject ON public.compliance_attestations USING btree (organization_id, subject_type, subject_ref);
CREATE INDEX idx_compliance_attestations_provider_subject_ref ON public.compliance_attestations USING btree (provider, subject_ref);
CREATE UNIQUE INDEX compliance_checks_pkey ON public.compliance_checks USING btree (id);
CREATE INDEX idx_compliance_checks_execution_id ON public.compliance_checks USING btree (execution_id);
CREATE INDEX idx_compliance_checks_expires_at ON public.compliance_checks USING btree (expires_at);
CREATE INDEX idx_compliance_checks_org_status_checked ON public.compliance_checks USING btree (organization_id, status, checked_at);
CREATE INDEX idx_compliance_checks_subject ON public.compliance_checks USING btree (subject_type, subject_ref);
CREATE UNIQUE INDEX contract_deployments_chain_name_version_unique ON public.contract_deployments USING btree (chain_id, contract_name, version);
CREATE UNIQUE INDEX contract_deployments_pkey ON public.contract_deployments USING btree (id);
CREATE INDEX idx_contract_deployments_active_by_name ON public.contract_deployments USING btree (contract_name, chain_id) WHERE (status = 'active'::deployment_status);
CREATE INDEX idx_contract_deployments_chain_status ON public.contract_deployments USING btree (chain_id, status);
CREATE INDEX idx_contract_deployments_contract_address ON public.contract_deployments USING btree (contract_address);
CREATE UNIQUE INDEX dead_letter_jobs_pkey ON public.dead_letter_jobs USING btree (id);
CREATE INDEX idx_dead_letter_jobs_execution_id ON public.dead_letter_jobs USING btree (execution_id);
CREATE INDEX idx_dead_letter_jobs_organization_created ON public.dead_letter_jobs USING btree (organization_id, created_at);
CREATE INDEX idx_dead_letter_jobs_queue_status ON public.dead_letter_jobs USING btree (queue_name, status);
CREATE INDEX idx_dead_letter_jobs_status ON public.dead_letter_jobs USING btree (status);
CREATE UNIQUE INDEX emergency_actions_pkey ON public.emergency_actions USING btree (id);
CREATE INDEX idx_emergency_actions_actor_created ON public.emergency_actions USING btree (actor_user_id, created_at);
CREATE INDEX idx_emergency_actions_chain_tx_hash ON public.emergency_actions USING btree (chain_id, tx_hash);
CREATE INDEX idx_emergency_actions_scope ON public.emergency_actions USING btree (scope, scope_ref);
CREATE UNIQUE INDEX executions_organization_idempotency_unique ON public.executions USING btree (organization_id, idempotency_key);
CREATE UNIQUE INDEX executions_pkey ON public.executions USING btree (id);
CREATE INDEX idx_executions_agent_created ON public.executions USING btree (agent_id, created_at);
CREATE INDEX idx_executions_mandate_id ON public.executions USING btree (mandate_id);
CREATE INDEX idx_executions_org_created_desc ON public.executions USING btree (organization_id, created_at DESC);
CREATE INDEX idx_executions_organization_status_created ON public.executions USING btree (organization_id, status, created_at);
CREATE INDEX idx_executions_policy_version_id ON public.executions USING btree (policy_version_id);
CREATE INDEX idx_executions_status_created ON public.executions USING btree (status, created_at) WHERE (status <> ALL (ARRAY['executed'::execution_status, 'failed'::execution_status, 'cancelled'::execution_status]));
CREATE INDEX idx_executions_target_chain_address ON public.executions USING btree (target_chain_id, target_address);
CREATE UNIQUE INDEX feature_flags_key_environment_unique ON public.feature_flags USING btree (key, environment);
CREATE UNIQUE INDEX feature_flags_pkey ON public.feature_flags USING btree (id);
CREATE INDEX idx_feature_flags_enabled ON public.feature_flags USING btree (enabled);
CREATE INDEX idx_intent_idempotency_keys_expires_at ON public.intent_idempotency_keys USING btree (expires_at);
CREATE INDEX idx_intent_idempotency_keys_org_expires ON public.intent_idempotency_keys USING btree (organization_id, expires_at);
CREATE UNIQUE INDEX intent_idempotency_keys_organization_key_unique ON public.intent_idempotency_keys USING btree (organization_id, idempotency_key);
CREATE UNIQUE INDEX intent_idempotency_keys_pkey ON public.intent_idempotency_keys USING btree (id);
CREATE INDEX idx_mandates_active_agent_chain ON public.mandates USING btree (agent_id, chain_id) WHERE (status = 'active'::text);
CREATE INDEX idx_mandates_agent_status ON public.mandates USING btree (agent_id, status);
CREATE UNIQUE INDEX idx_mandates_chain_onchain_mandate_id ON public.mandates USING btree (chain_id, onchain_mandate_id) WHERE (onchain_mandate_id IS NOT NULL);
CREATE INDEX idx_mandates_expiring ON public.mandates USING btree (valid_until) WHERE (status = 'active'::text);
CREATE INDEX idx_mandates_organization_status ON public.mandates USING btree (organization_id, status);
CREATE INDEX idx_mandates_policy_id ON public.mandates USING btree (policy_id);
CREATE INDEX idx_mandates_signer_address ON public.mandates USING btree (signer_address);
CREATE UNIQUE INDEX idx_mandates_typed_data_hash_unique ON public.mandates USING btree (typed_data_hash) WHERE (typed_data_hash IS NOT NULL);
CREATE INDEX idx_mandates_valid_until ON public.mandates USING btree (valid_until);
CREATE UNIQUE INDEX mandates_pkey ON public.mandates USING btree (id);
CREATE INDEX idx_nonce_locks_chain_expires ON public.nonce_locks USING btree (chain_id, expires_at);
CREATE INDEX idx_nonce_locks_chain_signer_nonce ON public.nonce_locks USING btree (chain_id, signer_address, nonce_value);
CREATE INDEX idx_nonce_locks_expires_at ON public.nonce_locks USING btree (expires_at);
CREATE UNIQUE INDEX nonce_locks_lock_key_unique ON public.nonce_locks USING btree (lock_key);
CREATE UNIQUE INDEX nonce_locks_pkey ON public.nonce_locks USING btree (id);
CREATE INDEX idx_notifications_organization_status_created ON public.notifications USING btree (organization_id, status, created_at);
CREATE INDEX idx_notifications_priority_status ON public.notifications USING btree (priority, status);
CREATE INDEX idx_notifications_recipient ON public.notifications USING btree (recipient_type, recipient_ref);
CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id);
CREATE INDEX idx_organizations_default_chain_id ON public.organizations USING btree (default_chain_id);
CREATE INDEX idx_organizations_plan ON public.organizations USING btree (plan);
CREATE INDEX idx_organizations_status ON public.organizations USING btree (status);
CREATE UNIQUE INDEX organizations_pkey ON public.organizations USING btree (id);
CREATE UNIQUE INDEX organizations_slug_unique ON public.organizations USING btree (slug);
CREATE INDEX idx_policies_active_version_id ON public.policies USING btree (active_version_id);
CREATE INDEX idx_policies_organization_status ON public.policies USING btree (organization_id, status);
CREATE UNIQUE INDEX policies_pkey ON public.policies USING btree (id);
CREATE INDEX idx_policy_versions_organization_status ON public.policy_versions USING btree (organization_id, status);
CREATE UNIQUE INDEX idx_policy_versions_policy_rules_hash ON public.policy_versions USING btree (policy_id, rules_hash) WHERE (rules_hash IS NOT NULL);
CREATE INDEX idx_policy_versions_policy_status ON public.policy_versions USING btree (policy_id, status);
CREATE INDEX idx_policy_versions_rules_hash ON public.policy_versions USING btree (rules_hash);
CREATE UNIQUE INDEX policy_versions_pkey ON public.policy_versions USING btree (id);
CREATE UNIQUE INDEX policy_versions_policy_version_unique ON public.policy_versions USING btree (policy_id, version_number);
CREATE INDEX idx_risk_models_model_hash ON public.risk_models USING btree (model_hash);
CREATE INDEX idx_risk_models_platform_defaults ON public.risk_models USING btree (name, version) WHERE (organization_id IS NULL);
CREATE INDEX idx_risk_models_status ON public.risk_models USING btree (status);
CREATE UNIQUE INDEX risk_models_organization_name_version_unique ON public.risk_models USING btree (organization_id, name, version);
CREATE UNIQUE INDEX risk_models_pkey ON public.risk_models USING btree (id);
CREATE INDEX idx_risk_scores_execution_calculated ON public.risk_scores USING btree (execution_id, calculated_at DESC);
CREATE INDEX idx_risk_scores_execution_id ON public.risk_scores USING btree (execution_id);
CREATE INDEX idx_risk_scores_org_tier_calculated ON public.risk_scores USING btree (organization_id, tier, calculated_at);
CREATE INDEX idx_risk_scores_risk_model_id ON public.risk_scores USING btree (risk_model_id);
CREATE INDEX idx_risk_scores_score_hash ON public.risk_scores USING btree (score_hash);
CREATE UNIQUE INDEX risk_scores_pkey ON public.risk_scores USING btree (id);
CREATE INDEX idx_settlements_chain_block_number ON public.settlements USING btree (chain_id, block_number);
CREATE UNIQUE INDEX idx_settlements_chain_tx_hash ON public.settlements USING btree (chain_id, tx_hash) WHERE (tx_hash IS NOT NULL);
CREATE INDEX idx_settlements_chain_tx_pending ON public.settlements USING btree (chain_id, tx_hash) WHERE ((status = ANY (ARRAY['submitted'::settlement_status, 'confirmed'::settlement_status])) AND (tx_hash IS NOT NULL));
CREATE UNIQUE INDEX idx_settlements_chain_user_operation_hash ON public.settlements USING btree (chain_id, user_operation_hash) WHERE (user_operation_hash IS NOT NULL);
CREATE INDEX idx_settlements_execution_id ON public.settlements USING btree (execution_id);
CREATE INDEX idx_settlements_on_chain_settlement_id ON public.settlements USING btree (on_chain_settlement_id) WHERE (on_chain_settlement_id IS NOT NULL);
CREATE INDEX idx_settlements_organization_status_created ON public.settlements USING btree (organization_id, status, created_at);
CREATE INDEX idx_settlements_pending_org ON public.settlements USING btree (organization_id, created_at) WHERE (status = ANY (ARRAY['pending'::settlement_status, 'prepared'::settlement_status, 'submitted'::settlement_status]));
CREATE UNIQUE INDEX settlements_pkey ON public.settlements USING btree (id);
CREATE INDEX idx_team_members_org_active ON public.team_members USING btree (organization_id) WHERE (status = 'active'::team_member_status);
CREATE INDEX idx_team_members_organization_role ON public.team_members USING btree (organization_id, role);
CREATE INDEX idx_team_members_organization_status ON public.team_members USING btree (organization_id, status);
CREATE INDEX idx_team_members_user_active ON public.team_members USING btree (user_id) WHERE (status = 'active'::team_member_status);
CREATE INDEX idx_team_members_user_id ON public.team_members USING btree (user_id);
CREATE UNIQUE INDEX team_members_organization_user_unique ON public.team_members USING btree (organization_id, user_id);
CREATE UNIQUE INDEX team_members_pkey ON public.team_members USING btree (id);
CREATE UNIQUE INDEX idx_users_email_unique ON public.users USING btree (email) WHERE (email IS NOT NULL);
CREATE INDEX idx_users_last_login_at ON public.users USING btree (last_login_at);
CREATE INDEX idx_users_status ON public.users USING btree (status);
CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);
CREATE UNIQUE INDEX users_privy_user_id_unique ON public.users USING btree (privy_user_id);
CREATE INDEX idx_wallet_verifications_organization_status ON public.wallet_verifications USING btree (organization_id, status);
CREATE INDEX idx_wallet_verifications_wallet_address ON public.wallet_verifications USING btree (wallet_address);
CREATE UNIQUE INDEX wallet_verifications_org_chain_wallet_unique ON public.wallet_verifications USING btree (organization_id, chain_id, wallet_address);
CREATE UNIQUE INDEX wallet_verifications_pkey ON public.wallet_verifications USING btree (id);
CREATE INDEX idx_webhook_deliveries_event_name ON public.webhook_deliveries USING btree (event_name);
CREATE INDEX idx_webhook_deliveries_organization_status ON public.webhook_deliveries USING btree (organization_id, status);
CREATE INDEX idx_webhook_deliveries_pending ON public.webhook_deliveries USING btree (status, created_at) WHERE (status = ANY (ARRAY['pending'::text, 'retrying'::text]));
CREATE INDEX idx_webhook_deliveries_webhook_created ON public.webhook_deliveries USING btree (webhook_id, created_at);
CREATE UNIQUE INDEX webhook_deliveries_pkey ON public.webhook_deliveries USING btree (id);
CREATE INDEX idx_webhooks_created_by_user_id ON public.webhooks USING btree (created_by_user_id);
CREATE INDEX idx_webhooks_organization_status ON public.webhooks USING btree (organization_id, status);
CREATE INDEX idx_webhooks_subscribed_events_gin ON public.webhooks USING gin (subscribed_events);
CREATE UNIQUE INDEX webhooks_pkey ON public.webhooks USING btree (id);
