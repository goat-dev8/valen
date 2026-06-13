const DENYLISTED_TICKERS = new Set<string>();
const SUPPORTED_TICKERS = new Set(['TSLA', 'AMZN', 'PLTR', 'NFLX', 'AMD', 'USDG']);

export type RobinhoodPolicyVerdict = {
  allowed: boolean;
  reasonCode: 'allowed' | 'unsupported_ticker' | 'denylisted_ticker' | 'outside_window' | 'over_limit';
  ticker: string | null;
};

function metadataRecord(metadata: Record<string, unknown>): Record<string, unknown> | null {
  const value = metadata.robinhood;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function evaluateRobinhoodPolicy(input: {
  actionType: string;
  metadata: Record<string, unknown>;
  now?: Date;
}): RobinhoodPolicyVerdict {
  if (input.actionType !== 'robinhood_token_transfer') {
    return { allowed: true, reasonCode: 'allowed', ticker: null };
  }

  const robinhood = metadataRecord(input.metadata);
  const ticker = typeof robinhood?.ticker === 'string' ? robinhood.ticker.toUpperCase() : null;
  const scenario = typeof robinhood?.scenario === 'string' ? robinhood.scenario : null;
  const hour = (input.now ?? new Date()).getUTCHours();

  if (!ticker || !SUPPORTED_TICKERS.has(ticker)) {
    return { allowed: false, reasonCode: 'unsupported_ticker', ticker };
  }
  if (DENYLISTED_TICKERS.has(ticker)) {
    return { allowed: false, reasonCode: 'denylisted_ticker', ticker };
  }
  if (scenario === 'refused') {
    return { allowed: false, reasonCode: 'over_limit', ticker };
  }
  if (scenario === 'outside-window' || hour < 0 || hour > 23) {
    return { allowed: false, reasonCode: 'outside_window', ticker };
  }

  return { allowed: true, reasonCode: 'allowed', ticker };
}
