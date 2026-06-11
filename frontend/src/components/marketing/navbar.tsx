'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { ValenLogo } from '@/components/brand/valen-logo';

const NAV_LINKS = [
  { href: '#about', label: 'Solution' },
  { href: '#features', label: 'Features' },
  { href: '#case-study', label: 'Case Studies' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQs' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled ? 'bg-white/90 backdrop-blur-md' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-[86px] w-full max-w-[1300px] items-center justify-between px-4">
        <ValenLogo href="#home" size="nav" />

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[#31485f] transition-colors hover:text-[#007dfc]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <Link href="/login" className="text-sm font-medium text-[#31485f] transition-colors hover:text-[#007dfc]">
            Log in
          </Link>
          <Link href="/login" className="btn-nav inline-block">
            Dashboard
          </Link>
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          className="text-[#012b54] lg:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Animated bottom border with traveling lime dot (reference: navbar-border-line-animation) */}
      <div className="nav-border-line">
        <div className="nav-border-dot" />
      </div>

      {open && (
        <div className="border-t border-[#eef0f3] bg-white px-4 pb-6 pt-4 lg:hidden">
          <nav className="flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-[#31485f]"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/login" className="text-sm font-medium text-[#31485f]" onClick={() => setOpen(false)}>
              Log in
            </Link>
            <Link href="/login" className="btn-nav inline-block w-fit" onClick={() => setOpen(false)}>
              Dashboard
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
