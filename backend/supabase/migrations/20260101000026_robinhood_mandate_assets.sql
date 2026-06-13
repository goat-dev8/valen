-- Expand demo Robinhood mandate to include all verified stock token tickers and addresses.

UPDATE mandates SET
  allowed_assets = ARRAY[
    '0x7E955252E15c84f5768B83c41a71F9eba181802F',
    'native',
    'TSLA', 'AMZN', 'PLTR', 'NFLX', 'AMD',
    '0xC9f9c86933092BbbfFF3CCb4b105A4A94bf3Bd4E',
    '0x5884aD2f920c162CFBbACc88C9C51AA75eC09E02',
    '0x1FBE1a0e43594b3455993B5dE5Fd0A7A266298d0',
    '0x3b8262A63d25f0477c4DDE23F83cfe22Cb768C93',
    '0x71178BAc73cBeb415514eB542a8995b82669778d'
  ]::text[],
  updated_at = now()
WHERE id = 'aab33461-c700-4df7-bbc2-742019d49354';
