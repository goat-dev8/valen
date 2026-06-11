'use client';

import { useRouter } from 'next/navigation';
import { Bell, Moon, Search, Palette, MessageSquare, ShoppingCart, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useOrganization } from '@/contexts/org-context';

export function AppHeader({ title }: { title?: string }) {
  const router = useRouter();
  const { me, logout } = useAuth();
  const { organization } = useOrganization();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const displayName = me?.user.displayName ?? me?.user.email ?? 'User';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const role = me?.organizations.find((o) => o.id === organization?.id)?.role?.replace(/_/g, ' ') ?? 'Member';
  return (
    <header className="app-header">
      <div className="app-header-search">
        <Search className="h-4 w-4 text-[#94a3b8]" />
        <input type="text" placeholder="Search executions, agents, policies..." className="app-search-input" />
        <kbd className="app-search-kbd">⌘K</kbd>
      </div>

      <div className="app-header-actions">
        <button type="button" className="app-header-icon" aria-label="Language">
          <span className="text-sm">🇬🇧</span>
        </button>
        <button type="button" className="app-header-icon" aria-label="Dark mode">
          <Moon className="h-[18px] w-[18px]" />
        </button>
        <button type="button" className="app-header-icon" aria-label="Theme">
          <Palette className="h-[18px] w-[18px]" />
        </button>
        <button type="button" className="app-header-icon relative" aria-label="Cart">
          <ShoppingCart className="h-[18px] w-[18px]" />
          <span className="app-header-badge">1</span>
        </button>
        <button type="button" className="app-header-icon relative" aria-label="Messages">
          <MessageSquare className="h-[18px] w-[18px]" />
          <span className="app-header-badge">10</span>
        </button>
        <button type="button" className="app-header-icon relative" aria-label="Notifications">
          <Bell className="h-[18px] w-[18px]" />
          <span className="app-header-dot" />
        </button>

        <button type="button" onClick={handleLogout} className="app-header-icon" aria-label="Logout">
          <LogOut className="h-[18px] w-[18px]" />
        </button>

        <div className="app-header-user">
          <div className="app-header-avatar">{initials}</div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-[#012b54]">{displayName}</p>
            <p className="text-xs capitalize text-[#64748b]">{role}</p>
          </div>
        </div>
      </div>

      {title && <span className="sr-only">{title}</span>}
    </header>
  );
}
