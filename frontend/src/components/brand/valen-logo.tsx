import Link from 'next/link';
import { cn } from '@/lib/utils';

export const VALEN_LOGO_SRC = '/valen-logo.svg';

const SIZE_MAP = {
  xs: 32,
  sm: 40,
  md: 48,
  nav: 60,
  lg: 68,
  xl: 96,
  hero: 128,
} as const;

type ValenLogoProps = {
  size?: keyof typeof SIZE_MAP;
  showWordmark?: boolean;
  variant?: 'dark' | 'light';
  href?: string;
  className?: string;
};

export function ValenLogo({
  size = 'md',
  showWordmark = true,
  variant = 'dark',
  href,
  className,
}: ValenLogoProps) {
  const dimension = SIZE_MAP[size];

  const content = (
    <span
      className={cn(
        'inline-flex items-center',
        size === 'hero' ? 'gap-1.5' : 'gap-0.5',
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={VALEN_LOGO_SRC}
        alt="VALEN"
        width={dimension}
        height={dimension}
        className="shrink-0 object-contain"
        style={{ width: dimension, height: dimension }}
      />
      {showWordmark && (
        <span
          className={cn(
            'valen-wordmark -ml-0.5',
            variant === 'light' ? 'valen-wordmark-light' : 'valen-wordmark-dark',
            size === 'hero'
              ? 'valen-wordmark-hero'
              : size === 'xl' || size === 'nav' || size === 'lg'
                ? 'valen-wordmark-lg'
                : 'valen-wordmark-md',
          )}
        >
          VALEN
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}
