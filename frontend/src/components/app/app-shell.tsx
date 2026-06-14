'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Sidebar } from '@/components/app/sidebar';
import { AppHeader } from '@/components/app/header';
import { MobileNavDrawer } from '@/components/app/mobile-nav';
import { useCommandPalette } from '@/components/command-center/command-palette';

const CommandPalette = dynamic(
  () => import('@/components/command-center/command-palette').then((mod) => mod.CommandPalette),
  { ssr: false },
);

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { open, openPalette, closePalette } = useCommandPalette();

  return (
    <div className="app-layout">
      <Sidebar className="hidden lg:flex" />
      <MobileNavDrawer open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <Sidebar className="!relative !w-full !border-0 !shadow-none" />
      </MobileNavDrawer>
      <div className="app-main">
        <AppHeader onMenuClick={() => setMobileOpen(true)} onSearchClick={openPalette} />
        <main className="app-content">{children}</main>
      </div>
      <CommandPalette open={open} onClose={closePalette} />
    </div>
  );
}
