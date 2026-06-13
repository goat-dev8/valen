import { knownAssetForMandateValue } from './known-assets';

/** Resolve template / form input to the asset string sent to the API. */
export function resolveIntentAssetForSubmit(input: {
  chainId: number;
  rawAsset: string;
  templateAsset?: string;
  templateActionType?: string;
  robinhoodTicker?: string;
}): string {
  const raw = input.rawAsset.trim();
  if (!raw || raw.toLowerCase() === 'custom') {
    const template = input.templateAsset?.trim();
    if (template) return template;
    if (input.robinhoodTicker) return input.robinhoodTicker;
    return 'native';
  }

  if (
    input.templateActionType === 'robinhood_token_transfer' &&
    input.robinhoodTicker &&
    raw.toUpperCase() === input.robinhoodTicker.toUpperCase()
  ) {
    return input.robinhoodTicker.toUpperCase();
  }

  const known = knownAssetForMandateValue(input.chainId, raw);
  if (known) return known.mandateValue;

  return raw;
}

export function assetSelectValue(chainId: number, rawAsset: string): string {
  const known = knownAssetForMandateValue(chainId, rawAsset);
  if (known) return known.mandateValue;
  return 'custom';
}
