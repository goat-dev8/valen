'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ValenLogo } from '@/components/brand/valen-logo';

const MAIN_PAGES = [
  { href: '#home', label: 'Home' },
  { href: '#modules', label: 'Modules' },
  { href: '#how-it-works', label: 'Journey' },
  { href: '#demos', label: 'Demos' },
  { href: '#get-started', label: 'Get Started' },
];

const UTILITY_PAGES = [
  { href: '/proofs/pack', label: 'Proof Pack' },
  { href: '/agents/valen', label: 'Agent Profile' },
  { href: 'https://valen-api-m3g4.onrender.com/docs', label: 'API Docs' },
  { href: '/login', label: 'Login' },
];

const LEFT_BARS = [72, 96, 120, 88, 104];
const RIGHT_BARS = [88, 112, 80, 96, 72];

export function FooterSection() {
  return (
    <footer className="footer-section">
      <div className="landing-container footer-container">
        <div className="footer-top">
          <div className="footer-brand-col">
            <ValenLogo href="#home" size="md" variant="light" />
            <p className="footer-tagline">
              Compliance, risk, and permission layer for agentic finance. Infrastructure — not a wallet or DEX.
            </p>
            <Link href="/login" className="footer-cta-link">
              Launch dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="footer-nav-cols">
            <div className="footer-nav-col">
              <h4 className="footer-nav-title">PRODUCT</h4>
              <ul className="footer-nav-links">
                {MAIN_PAGES.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer-nav-col">
              <h4 className="footer-nav-title">RESOURCES</h4>
              <ul className="footer-nav-links">
                {UTILITY_PAGES.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith('http') ? (
                      <a href={link.href} target="_blank" rel="noopener noreferrer">
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href}>{link.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-watermark-wrap">
        <div className="footer-geo footer-geo-left" aria-hidden="true">
          {LEFT_BARS.map((width, i) => (
            <span
              key={`left-${i}`}
              className="footer-geo-bar"
              style={{ width: `${width}px`, opacity: 0.35 + i * 0.12 }}
            />
          ))}
        </div>

        <div className="footer-watermark" aria-hidden="true">
          VALEN
        </div>

        <div className="footer-geo footer-geo-right" aria-hidden="true">
          {RIGHT_BARS.map((width, i) => (
            <span
              key={`right-${i}`}
              className="footer-geo-bar"
              style={{ width: `${width}px`, opacity: 0.35 + i * 0.12 }}
            />
          ))}
        </div>
      </div>
    </footer>
  );
}
