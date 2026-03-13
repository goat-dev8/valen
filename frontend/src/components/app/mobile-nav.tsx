'use client';

import { X } from 'lucide-react';

export function MobileNavDrawer({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <>
      <button type="button" className="mobile-nav-backdrop" aria-label="Close menu" onClick={onClose} />
      <aside className="mobile-nav-drawer">
        <div className="mobile-nav-drawer__header">
          <span className="mobile-nav-drawer__title">Menu</span>
          <button type="button" onClick={onClose} className="app-header-icon" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </aside>
    </>
  );
}
