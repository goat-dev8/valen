'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck, Activity, Scale } from 'lucide-react';

/**
 * Vertical border lines inside .hero-border-frame (reference: .border-line).
 * Each line has a gradient dot that falls down on a loop.
 */
function BorderLines({ count, baseDelay = 0 }: { count: number; baseDelay?: number }) {
  return (
    <div className="hero-border-frame">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`hero-border-line ${i % 3 === 1 ? 'hidden md:block' : ''} ${
            i % 4 === 3 ? 'hidden lg:block' : ''
          }`}
        >
          <div
            className="hero-border-dot"
            style={{ animationDelay: `${baseDelay + i * 0.9}s`, animationDuration: `${5 + (i % 4)}s` }}
          />
        </div>
      ))}
    </div>
  );
}

const TRUST_AVATARS = [
  { label: 'A', bg: '#007dfc' },
  { label: 'R', bg: '#012b54' },
  { label: 'S', bg: '#5fa8f5' },
];

export function HeroSection() {
  return (
    <section id="home" className="hero-wrapper">
      <div className="container banner">
        <div className="hero-all-content-area">
          {/* hero-content-block — text sits above the wallpaper */}
          <div className="hero-content-block">
            <div className="fade-up mx-auto flex w-full max-w-[290px] items-center justify-center gap-2 rounded-full border border-[#eef0f3] bg-white py-[5px] pl-2 pr-4">
              <div className="flex items-center">
                {TRUST_AVATARS.map((a, i) => (
                  <span
                    key={a.label}
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-semibold text-white"
                    style={{ backgroundColor: a.bg, marginLeft: i === 0 ? 0 : -5 }}
                  >
                    {a.label}
                  </span>
                ))}
              </div>
              <span className="text-sm leading-5 text-[#31485f]">Live on 2 Arbitrum chains</span>
            </div>

            <div className="flex flex-col items-center text-center">
              <h1 className="fade-up fade-up-delay-1 text-[40px] font-semibold leading-[1.07] text-[#012b54] md:text-[52px] lg:text-[58px] lg:leading-[62px]">
                Intent flows in.
              </h1>
              <div className="fade-up fade-up-delay-2 flex flex-col items-center gap-x-[11px] md:flex-row">
                <span className="text-[40px] font-semibold leading-[1.07] text-[#012b54] md:text-[52px] lg:text-[58px] lg:leading-[62px]">
                  Policy&nbsp;
                </span>
                <span className="text-frame-underline text-[40px] font-semibold leading-[1.07] text-[#007dfc] md:text-[52px] lg:text-[58px] lg:leading-[62px]">
                  stands guard.
                </span>
              </div>
              <h2 className="fade-up fade-up-delay-2 text-[40px] font-semibold leading-[1.07] text-[#012b54] md:text-[52px] lg:text-[58px] lg:leading-[62px]">
                Capital flows out — on your terms.
              </h2>
            </div>

            <p className="fade-up fade-up-delay-3 mx-auto max-w-[520px] text-lg leading-7 text-[#31485f]">
              The permission layer between autonomous agents and onchain settlement — mandates,
              risk, and policy enforced before anything executes.
            </p>

            <div className="fade-up fade-up-delay-4 flex flex-wrap justify-center gap-[15px]">
              <Link href="/dashboard" className="btn-primary inline-block">
                Start Building
              </Link>
              <Link href="/login" className="btn-white inline-block">
                View Architecture
              </Link>
            </div>

            <div className="fade-up fade-up-delay-5 mx-auto flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 font-mono text-xs text-[#31485f]/70">
              {['Agent', 'Intent', 'Compliance', 'Risk', 'Policy', 'Settlement', 'Audit'].map(
                (step, i, arr) => (
                  <span key={step} className="flex items-center gap-2">
                    <span className={i >= 2 && i <= 4 ? 'font-semibold text-[#007dfc]' : ''}>{step}</span>
                    {i < arr.length - 1 && <span className="text-[#c9c7c0]">→</span>}
                  </span>
                ),
              )}
            </div>
          </div>

          {/* Animated vertical border lines (reference: .border-line inside hero-all-content-area) */}
          <BorderLines count={14} />

          {/* Banner wallpaper — same placement as reference .banner-bg-image */}
          <Image
            src="/banner-bg.png"
            alt="valen-banner-background"
            width={1440}
            height={550}
            sizes="(max-width: 1439px) 100vw, 1440px"
            priority
            className="banner-bg-image"
          />
        </div>
      </div>

      {/* Hero card overlaps wallpaper (reference: .dashbord-image-wrapper) */}
      <div className="dashbord-image-wrapper fade-up fade-up-delay-5">
        <div className="w-full rounded-[20px] border border-[#eef0f3] bg-white p-6 shadow-[0_30px_60px_-30px_rgba(1,43,84,0.25)] md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
            </div>
            <span className="rounded-full bg-[#eaf4ff] px-3 py-1 text-xs font-medium text-[#007dfc]">
              valen-settlement · live
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#eef0f3] bg-[#f8f9fb] p-5 text-left">
              <ShieldCheck className="mb-3 h-6 w-6 text-[#007dfc]" />
              <p className="text-sm font-semibold text-[#012b54]">Compliance Engine</p>
              <p className="mt-1 text-xs leading-5 text-[#31485f]">
                Deterministic Stylus verdicts. Fail-closed by design.
              </p>
            </div>
            <div className="rounded-2xl border border-[#eef0f3] bg-[#f8f9fb] p-5 text-left">
              <Activity className="mb-3 h-6 w-6 text-[#007dfc]" />
              <p className="text-sm font-semibold text-[#012b54]">Risk Scoring</p>
              <p className="mt-1 text-xs leading-5 text-[#31485f]">
                0–100 onchain risk tiers with human approval escalation.
              </p>
            </div>
            <div className="rounded-2xl border border-[#eef0f3] bg-[#f8f9fb] p-5 text-left">
              <Scale className="mb-3 h-6 w-6 text-[#007dfc]" />
              <p className="text-sm font-semibold text-[#012b54]">Policy Enforcement</p>
              <p className="mt-1 text-xs leading-5 text-[#31485f]">
                Versioned policy hashes bound to every settlement.
              </p>
            </div>
          </div>
        </div>
        <div className="dashbord-image-overly" aria-hidden="true" />
      </div>
    </section>
  );
}
