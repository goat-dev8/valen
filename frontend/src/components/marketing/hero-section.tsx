'use client';

import Image from 'next/image';
import Link from 'next/link';
import { HeroDashboardMock } from '@/components/marketing/hero-dashboard-mock';

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

const CHAIN_BADGES = [
  { name: 'Arbitrum Sepolia', src: '/arbitrum-logo.png' },
  { name: 'Robinhood Chain Testnet', src: '/robinhood-chain-logo.svg' },
];

export function HeroSection() {
  return (
    <section id="home" className="hero-wrapper">
      <div className="container banner">
        <div className="hero-all-content-area">
          {/* hero-content-block — text sits above the wallpaper */}
          <div className="hero-content-block">
            <div className="fade-up mx-auto flex w-full max-w-[310px] items-center justify-center gap-2.5 rounded-full border border-[#eef0f3] bg-white py-[5px] pl-2 pr-4">
              <div className="flex items-center">
                {CHAIN_BADGES.map((chain, i) => (
                  <Image
                    key={chain.name}
                    src={chain.src}
                    alt={chain.name}
                    width={32}
                    height={32}
                    className="hero-chain-badge"
                    style={{ marginLeft: i === 0 ? 0 : -6 }}
                  />
                ))}
              </div>
              <span className="text-sm leading-5 text-[#31485f]">Live on 2 Arbitrum chains</span>
            </div>

            <h1 className="hero-headline">
              <span className="hero-headline-line fade-up fade-up-delay-1">The operating system</span>
              <span className="hero-headline-line fade-up fade-up-delay-2">
                for{' '}
                <span className="hero-headline-mark text-frame-underline">autonomous finance</span>.
              </span>
            </h1>

            <p className="fade-up fade-up-delay-3 mx-auto max-w-[520px] text-lg leading-7 text-[#31485f]">
              Create an agent, give it a USDC budget and rules, let it act, and see immutable proof for every
              approval or refusal across Arbitrum and Robinhood.
            </p>

            <div className="fade-up fade-up-delay-4 flex flex-wrap justify-center gap-[15px]">
              <Link href="/dashboard" className="btn-primary inline-block">
                Create Agent
              </Link>
              <Link href="/login" className="btn-white inline-block">
                See Proof Flow
              </Link>
            </div>

            <div className="hero-pipeline fade-up fade-up-delay-5">
              {['Connect', 'Agent', 'Rules', 'USDC Budget', 'Execute', 'Proof'].map(
                (step, i, arr) => (
                  <span key={step} className="hero-pipeline-item">
                    <span
                      className={
                        i >= 2 && i <= 3
                          ? 'hero-pipeline-step hero-pipeline-step-engine'
                          : 'hero-pipeline-step'
                      }
                    >
                      {step}
                    </span>
                    {i < arr.length - 1 && (
                      <span className="hero-pipeline-sep" aria-hidden="true">
                        →
                      </span>
                    )}
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

      <div className="dashbord-image-wrapper fade-up fade-up-delay-5">
        <HeroDashboardMock />
        <div className="dashbord-image-overly" aria-hidden="true" />
      </div>
    </section>
  );
}
