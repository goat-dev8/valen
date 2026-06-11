import Link from 'next/link';
import { ValenLogo } from '@/components/brand/valen-logo';

const PIPELINE = [
  { step: 'Agent', detail: 'Register agents, link wallets, issue API keys. Intents submitted via Render API.' },
  { step: 'Compliance', detail: 'Stylus ComplianceEngine attestation on Arbitrum Sepolia and Robinhood Testnet.' },
  { step: 'Risk', detail: 'RiskEngine scoring with approval gates for high-tier intents.' },
  { step: 'Policy', detail: 'PolicyEngine evaluation against org-bound policy versions.' },
  { step: 'Settlement', detail: 'ValenSettlement submit → approve → execute on-chain with audit trail.' },
  { step: 'Audit', detail: 'Immutable audit_logs: execution.attested, settlement.submit/approve/executed.' },
];

const NETWORKS = [
  { name: 'Arbitrum Sepolia', chainId: 421614, settlement: '0x993622D55Ea095aB71165Caf191B21E6e3A71D4A' },
  { name: 'Robinhood Testnet', chainId: 46630, settlement: '0x91CdD9a481C732bEB09Ce039da23DC11e83547a4' },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#012b54]">
      <header className="border-b border-[#eef0f3] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <ValenLogo href="/" size="xl" />
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-[#64748b] hover:text-[#012b54]">
              Sign in
            </Link>
            <Link href="/login" className="rounded-lg bg-[#007dfc] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0066d4]">
              Open Dashboard
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#007dfc]">Permission Layer for Agentic Finance</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
          VALEN governs agent intents from submission to on-chain settlement.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-[#64748b]">
          Production backend on Render. Supabase database. Verified contracts on Arbitrum Sepolia and Robinhood Testnet.
          Stylus engines for compliance, risk, and policy. No mock pipeline — every dashboard view reads live API data.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/login" className="rounded-lg bg-[#007dfc] px-6 py-3 font-semibold text-white hover:bg-[#0066d4]">
            Sign in with Privy
          </Link>
          <a
            href="https://valen-api-m3g4.onrender.com/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-[#dbeafe] bg-white px-6 py-3 font-semibold text-[#007dfc] hover:bg-[#eff6ff]"
          >
            API Docs
          </a>
        </div>
      </section>

      <section className="border-y border-[#eef0f3] bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-bold">Execution Pipeline</h2>
          <p className="mt-2 text-[#64748b]">What runs today when you submit an intent from the dashboard.</p>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PIPELINE.map((item, i) => (
              <div key={item.step} className="rounded-xl border border-[#eef0f3] bg-[#f8fafc] p-5">
                <p className="text-xs font-semibold uppercase text-[#007dfc]">Step {i + 1}</p>
                <h3 className="mt-2 text-lg font-semibold">{item.step}</h3>
                <p className="mt-2 text-sm text-[#64748b]">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-bold">Live Networks</h2>
          <p className="mt-2 text-[#64748b]">Settlement contracts deployed and verified on both testnets.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {NETWORKS.map((net) => (
              <div key={net.chainId} className="rounded-xl border border-[#eef0f3] bg-white p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{net.name}</h3>
                  <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">Chain {net.chainId}</span>
                </div>
                <p className="mt-4 text-xs font-medium uppercase text-[#64748b]">ValenSettlement</p>
                <p className="mt-1 break-all font-mono text-sm">{net.settlement}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[#eef0f3] bg-[#012b54] py-16 text-white">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="text-2xl font-bold">Ready to use</h2>
          <p className="mx-auto mt-4 max-w-xl text-[#94a3b8]">
            Sign in, register an agent, submit an intent, and monitor compliance, risk, settlement, and audit — all backed by Render and on-chain contracts.
          </p>
          <Link href="/login" className="mt-8 inline-block rounded-lg bg-[#007dfc] px-8 py-3 font-semibold text-white hover:bg-[#0066d4]">
            Get Started
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#eef0f3] bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 text-sm text-[#64748b]">
          <ValenLogo href="/" size="md" />
          <p>API: valen-api-m3g4.onrender.com · Settlement pipeline proven 10/10 on Render</p>
        </div>
      </footer>
    </main>
  );
}
