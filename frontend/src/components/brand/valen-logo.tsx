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
  href?: string;
  className?: string;
};

export function ValenLogo({
  size = 'md',
  showWordmark = true,
  href,
  className,
}: ValenLogoProps) {
  const dimension = SIZE_MAP[size];

  const content = (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
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
            'font-semibold tracking-tight text-[#012b54]',
            size === 'hero'
              ? 'text-4xl'
              : size === 'xl' || size === 'nav' || size === 'lg'
                ? 'text-3xl'
                : 'text-2xl',
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
