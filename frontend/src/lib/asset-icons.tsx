/** Maps asset symbols to existing icons in /public */
const ICON_BY_SYMBOL: Record<string, string> = {
  USDC: '/usdc.svg',
  USDG: '/usdg.svg',
  TSLA: '/tsla.svg',
  AMZN: '/amzn.svg',
  PLTR: '/pltr.svg',
  NFLX: '/nflx.svg',
  AMD: '/amd.svg',
  ETH: '/arbitrum-logo.png',
};

export function assetIconUrl(symbol: string | null | undefined): string | null {
  if (!symbol) return null;
  return ICON_BY_SYMBOL[symbol.toUpperCase()] ?? null;
}

export function AssetIcon({
  symbol,
  size = 24,
  className = '',
}: {
  symbol: string;
  size?: number;
  className?: string;
}) {
  const src = assetIconUrl(symbol);
  if (!src) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full bg-[#e8f4ff] text-[10px] font-bold text-[#007dfc] ${className}`}
        style={{ width: size, height: size }}
      >
        {symbol.slice(0, 3)}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`${symbol} icon`}
      width={size}
      height={size}
      className={`rounded-full object-contain ${className}`}
    />
  );
}
