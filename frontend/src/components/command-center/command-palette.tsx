'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bot, FileCheck, LayoutDashboard, Search, Shield, TrendingUp, Zap } from 'lucide-react';
import { hrefForParsedCommand, parseCommand } from '@/lib/command-parser';
import { INTENT_TEMPLATES } from '@/lib/intent-templates';
import { NAV_SECTIONS } from '@/lib/navigation';

type PaletteItem = {
  id: string;
  label: string;
  hint?: string;
  href: string;
  group: string;
};

function buildPaletteItems(): PaletteItem[] {
  const pages: PaletteItem[] = NAV_SECTIONS.flatMap((section) =>
    section.items.map((item) => ({
      id: item.href,
      label: item.label,
      hint: section.label,
      href: item.href,
      group: 'Pages',
    })),
  );

  const demos: PaletteItem[] = INTENT_TEMPLATES.slice(0, 6).map((template) => ({
    id: `template-${template.id}`,
    label: template.name,
    hint: template.description.slice(0, 48),
    href: `/dashboard/executions/new?template=${template.id}&amount=${template.amount}`,
    group: 'Demo actions',
  }));

  const commands: PaletteItem[] = [
    { id: 'cmd-usdc', label: 'Pay 0.001 USDC', href: hrefForParsedCommand(parseCommand('Pay 0.001 USDC')!), group: 'Commands' },
    { id: 'cmd-tsla', label: 'Refused TSLA', href: hrefForParsedCommand(parseCommand('Refused TSLA')!), group: 'Commands' },
    { id: 'cmd-x402', label: 'x402 payment', href: '/dashboard/payments', group: 'Commands' },
    { id: 'cmd-proof', label: 'Outcome ledger', href: '/dashboard/proofs', group: 'Commands' },
    { id: 'cmd-agent', label: 'Create governed agent', href: '/dashboard/agents/studio', group: 'Commands' },
  ];

  return [...commands, ...demos, ...pages];
}

const GROUP_ICONS: Record<string, typeof LayoutDashboard> = {
  Commands: Zap,
  'Demo actions': TrendingUp,
  Pages: LayoutDashboard,
};

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const items = useMemo(() => buildPaletteItems(), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0, 12);
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.hint?.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q),
    );
  }, [items, query]);

  const navigate = useCallback(
    (href: string) => {
      onClose();
      setQuery('');
      router.push(href);
    },
    [onClose, router],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const grouped = filtered.reduce<Record<string, PaletteItem[]>>((acc, item) => {
    acc[item.group] = acc[item.group] ?? [];
    acc[item.group].push(item);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 p-4 pt-[12vh]" onClick={onClose}>
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#E8ECF0] bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div className="flex items-center gap-2 border-b border-[#E8ECF0] px-4 py-3">
          <Search className="h-4 w-4 text-[#8B98A5]" aria-hidden />
          <input
            autoFocus
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && filtered[0]) navigate(filtered[0].href);
            }}
            placeholder="Search pages, demos, commands…"
            className="flex-1 bg-transparent text-sm text-[#1A2332] outline-none placeholder:text-[#8B98A5]"
            aria-label="Search command palette"
          />
          <kbd className="hidden rounded border border-[#E8ECF0] bg-[#F4F6F8] px-1.5 py-0.5 text-[10px] font-medium text-[#8B98A5] sm:inline">
            esc
          </kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-[#8B98A5]">No matches</p>
          ) : (
            Object.entries(grouped).map(([group, groupItems]) => {
              const Icon = GROUP_ICONS[group] ?? FileCheck;
              return (
                <div key={group} className="mb-2">
                  <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8B98A5]">
                    {group}
                  </p>
                  {groupItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigate(item.href)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-[#F4F6F8]"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-[#0066FF]" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[#1A2332]">{item.label}</p>
                        {item.hint && <p className="truncate text-xs text-[#8B98A5]">{item.hint}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              );
            })
          )}
        </div>
        <div className="flex items-center justify-between border-t border-[#E8ECF0] px-4 py-2 text-[10px] text-[#8B98A5]">
          <span>Type to filter · Enter to open</span>
          <span className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            <Bot className="h-3 w-3" />
            Governed actions only
          </span>
        </div>
      </div>
    </div>
  );
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return {
    open,
    openPalette: () => setOpen(true),
    closePalette: () => setOpen(false),
    togglePalette: () => setOpen((prev) => !prev),
  };
}
