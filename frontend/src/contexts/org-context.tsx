'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { ORG_STORAGE_KEY } from '@/lib/constants';
import type { OrganizationDto } from '@/types/api';

type OrgContextValue = {
  orgId: string | null;
  organization: OrganizationDto | null;
  loading: boolean;
  setOrgId: (id: string) => void;
  refreshOrganization: () => Promise<void>;
};

const OrgContext = createContext<OrgContextValue | null>(null);

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const { token, me } = useAuth();
  const [orgId, setOrgIdState] = useState<string | null>(null);
  const [organization, setOrganization] = useState<OrganizationDto | null>(null);
  const [loading, setLoading] = useState(false);

  const setOrgId = useCallback((id: string) => {
    setOrgIdState(id);
    localStorage.setItem(ORG_STORAGE_KEY, id);
  }, []);

  const refreshOrganization = useCallback(async () => {
    if (!token || !orgId) {
      setOrganization(null);
      return;
    }
    const org = await api.organizations.get(token, orgId);
    setOrganization(org);
  }, [token, orgId]);

  useEffect(() => {
    if (!me?.organizations?.length) {
      setOrgIdState(null);
      setOrganization(null);
      return;
    }

    const stored = localStorage.getItem(ORG_STORAGE_KEY);
    const valid = me.organizations.find((o) => o.id === stored && o.status === 'active');
    const fallback = me.organizations.find((o) => o.status === 'active') ?? me.organizations[0];
    const selected = valid?.id ?? fallback.id;
    setOrgIdState(selected);
    localStorage.setItem(ORG_STORAGE_KEY, selected);
  }, [me]);

  useEffect(() => {
    if (!token || !orgId) {
      setOrganization(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    api.organizations
      .get(token, orgId)
      .then((org) => {
        if (!cancelled) setOrganization(org);
      })
      .catch(() => {
        if (!cancelled) setOrganization(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, orgId]);

  const value = useMemo(
    () => ({ orgId, organization, loading, setOrgId, refreshOrganization }),
    [orgId, organization, loading, setOrgId, refreshOrganization],
  );

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrganization() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error('useOrganization must be used within OrgProvider');
  return ctx;
}
