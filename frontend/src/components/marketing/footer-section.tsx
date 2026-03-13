'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ValenLogo } from '@/components/brand/valen-logo';

const MAIN_PAGES = [
  { href: '#home', label: 'Home' },
  { href: '#about', label: 'About' },
  { href: '#features', label: 'Services' },
  { href: '#get-started', label: 'Contact' },
  { href: '#pricing', label: 'Pricing' },
];

const UTILITY_PAGES = [
  { href: '#faq', label: 'FAQs' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#integrations', label: 'Integrations' },
  { href: '/login', label: 'Login' },
];

const SOCIALS = [
  { href: '#', label: 'FACEBOOK' },
  { href: '#', label: 'INSTAGRAM' },
  { href: '#', label: 'LINKEDIN' },
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

            <p className="footer-newsletter-title">Subscribe For Our Newsletter</p>

            <form
              className="footer-newsletter-form"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                name="email"
                placeholder="Email"
                className="footer-newsletter-input"
                aria-label="Email address"
              />
              <button type="submit" className="footer-newsletter-submit" aria-label="Subscribe">
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </button>
            </form>

            <label className="footer-privacy">
              <input type="checkbox" name="privacy" className="footer-privacy-checkbox" />
              <span>I agree to the Privacy Policy</span>
            </label>
          </div>

          <div className="footer-nav-cols">
            <div className="footer-nav-col">
              <h4 className="footer-nav-title">MAIN PAGES</h4>
              <ul className="footer-nav-links">
                {MAIN_PAGES.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer-nav-col">
              <h4 className="footer-nav-title">UTILITY PAGES</h4>
              <ul className="footer-nav-links">
                {UTILITY_PAGES.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer-nav-col">
              <h4 className="footer-nav-title">SOCIALS</h4>
              <ul className="footer-nav-links">
                {SOCIALS.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href}>{link.label}</Link>
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
