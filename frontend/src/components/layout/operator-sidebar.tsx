'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Boxes,
  Database,
  FileSearch,
  FlaskConical,
  Gavel,
  Landmark,
  Layers,
  ListChecks,
  Server,
  Settings2,
  ShieldCheck,
  Workflow,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/dashboard', label: 'System Health', icon: Activity },
  { href: '/dashboard/env', label: 'Environment', icon: Settings2 },
  { href: '/dashboard/database', label: 'Database', icon: Database },
  { href: '/dashboard/queues', label: 'Queues', icon: Workflow },
  { href: '/dashboard/contracts', label: 'Contracts', icon: Boxes },
  { href: '/dashboard/stylus', label: 'Stylus', icon: Layers },
  { href: '/dashboard/settlement', label: 'Settlement Lab', icon: FlaskConical },
  { href: '/dashboard/governance', label: 'Governance Lab', icon: Gavel },
  { href: '/dashboard/treasury', label: 'Treasury', icon: Landmark },
  { href: '/dashboard/audit', label: 'Audit', icon: FileSearch },
  { href: '/dashboard/validation', label: 'E2E Validation', icon: ShieldCheck },
];

export function OperatorSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-neutral-200 bg-neutral-950 text-neutral-100">
      <div className="border-b border-neutral-800 px-5 py-5">
        <div className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          <div>
            <p className="text-sm font-semibold tracking-wide">VALEN Operator</p>
            <p className="text-xs text-neutral-400">Internal validation dashboard</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                active ? 'bg-white text-neutral-950' : 'text-neutral-300 hover:bg-neutral-900 hover:text-white',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-neutral-800 p-4 text-xs text-neutral-500">
        <div className="flex items-center gap-2">
          <ListChecks className="h-4 w-4" />
          Live infrastructure only — no mocks
        </div>
      </div>
    </aside>
  );
}
