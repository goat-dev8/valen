import Link from 'next/link';
import { ValenLogo } from '@/components/brand/valen-logo';

const PRODUCT_LINKS = [
  { href: '#about', label: 'Solution' },
  { href: '#case-study', label: 'Case Studies' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#integrations', label: 'Integrations' },
];

const INFO_LINKS = [
  { href: '#faq', label: 'FAQs' },
  { href: '#how-it-works', label: 'How It Works' },
];

export function FooterSection() {
  return (
    <footer className="footer-section">
      <div className="landing-container">
        <div className="footer-top">
          <div className="footer-brand">
            <ValenLogo href="#home" size="hero" showWordmark />
            <p className="footer-tagline">
              Enforce compliance, risk scoring, and policy before any agent settles onchain.
            </p>
            <div className="footer-social">
              {['FB', 'IG', 'LI', 'X'].map((s) => (
                <span key={s} className="footer-social-icon">{s}</span>
              ))}
            </div>
          </div>

          <div className="footer-links-grid">
            <div>
              <h4 className="footer-links-title">Product</h4>
              <ul className="footer-links">
                {PRODUCT_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="footer-links-title">Information</h4>
              <ul className="footer-links">
                {INFO_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2025 VALEN. All Rights Reserved.</span>
          <span>Compliance Layer for Agentic Finance</span>
        </div>
      </div>
    </footer>
  );
}
