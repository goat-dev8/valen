'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { RESOURCE_SECTIONS } from '@/lib/resources';

function CopyAddress({ address }: { address: string }) {
  return (
    <button
      type="button"
      className="mt-1 block break-all font-mono text-xs text-[#64748b] hover:text-[#007dfc]"
      onClick={() => navigator.clipboard.writeText(address)}
      title="Click to copy"
    >
      {address}
    </button>
  );
}

export default function ResourcesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Resources"
        description="Explorers, faucets, and contract addresses for Arbitrum Sepolia and Robinhood Testnet."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {RESOURCE_SECTIONS.map((section) => (
          <section key={section.title} className="app-card">
            <h3 className="app-card-title">{section.title}</h3>
            <p className="mt-2 text-sm leading-6 text-[#64748b]">{section.description}</p>
            <div className="mt-4 space-y-3">
              {section.links.map((link) => (
                <div key={link.label} className="rounded-2xl border border-[#eef0f3] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#012b54]">{link.label}</p>
                      {link.description && (
                        <p className="mt-1 text-xs leading-5 text-[#64748b]">{link.description}</p>
                      )}
                      {link.address && <CopyAddress address={link.address} />}
                    </div>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="app-btn app-btn-outline shrink-0 text-xs"
                    >
                      Open
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="app-card">
        <h3 className="app-card-title">VALEN Proof Pages</h3>
        <p className="mt-2 text-sm leading-6 text-[#64748b]">
          Every governed action produces a shareable proof. Use these entry points after executing an intent or x402 payment.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/dashboard/executions" className="app-btn app-btn-outline">
            Execution proofs
          </Link>
          <Link href="/proofs/pack" className="app-btn app-btn-outline">
            Public proof pack
          </Link>
          <Link href="/dashboard/payments" className="app-btn app-btn-outline">
            x402 payments
          </Link>
        </div>
      </section>
    </div>
  );
}
