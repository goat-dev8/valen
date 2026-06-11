import { AppShell } from '@/components/app/app-shell';
import { AuthGuard } from '@/components/app/auth-guard';
import { NoOrgState } from '@/components/app/no-org-state';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>
        <NoOrgState />
        {children}
      </AppShell>
    </AuthGuard>
  );
}
