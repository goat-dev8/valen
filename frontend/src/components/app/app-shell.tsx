import { Sidebar } from '@/components/app/sidebar';
import { AppHeader } from '@/components/app/header';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <AppHeader />
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
