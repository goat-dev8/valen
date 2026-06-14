'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { Building2, ChevronDown, LogOut, Settings, Shield, User, Wallet } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useOrganization } from '@/contexts/org-context';

const ROLE_LABELS: Record<string, string> = {
  organization_owner: 'Organization Owner',
  admin: 'Admin',
  operator: 'Operator',
  viewer: 'Viewer',
  member: 'Member',
};

export function UserMenu() {
  const router = useRouter();
  const { logout: privyLogout } = usePrivy();
  const { me, logout } = useAuth();
  const { organization } = useOrganization();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const displayName = me?.user.displayName ?? me?.user.email ?? 'User';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const membership = me?.organizations.find((o) => o.id === organization?.id);
  const roleKey = membership?.role ?? 'member';
  const roleLabel = ROLE_LABELS[roleKey] ?? roleKey.replace(/_/g, ' ');

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    await privyLogout().catch(() => undefined);
    logout();
    router.push('/login');
  };

  const items = [
    { href: '/organization/profile', label: 'Profile', icon: User },
    { href: '/organization/profile', label: 'Organization', icon: Building2 },
    { href: '/dashboard/authority', label: 'Wallets', icon: Wallet },
    { href: '/organization/profile#identity', label: 'Identity', icon: Shield },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="user-menu" ref={rootRef}>
      <button
        type="button"
        className="user-menu__trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <div className="app-header-avatar">{initials}</div>
        <div className="hidden md:block text-left">
          <p className="app-header-user__name">{displayName}</p>
          <p className="app-header-user__role">{roleLabel}</p>
        </div>
        <ChevronDown className={`user-menu__chevron hidden h-4 w-4 md:block ${open ? 'user-menu__chevron--open' : ''}`} />
      </button>

      {open && (
        <div className="user-menu__panel" role="menu">
          <div className="user-menu__header">
            <div className="app-header-avatar">{initials}</div>
            <div>
              <p className="user-menu__name">{displayName}</p>
              <p className="user-menu__role">{roleLabel}</p>
              <p className="user-menu__org">{organization?.name ?? 'Organization'}</p>
            </div>
          </div>
          <div className="user-menu__items">
            {items.map((item) => (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className="user-menu__item"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </div>
          <button type="button" className="user-menu__logout" onClick={() => void handleLogout()}>
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
