ALTER TABLE mandates
  ADD COLUMN IF NOT EXISTS scope_snapshot jsonb;

COMMENT ON COLUMN mandates.scope_snapshot IS 'Frozen agent scope + policy metadata at mandate sign time; sole runtime authority for intent matching';
