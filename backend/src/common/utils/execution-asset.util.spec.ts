import {
  ARBITRUM_SEPOLIA_USDC,
  resolveAssetDisplayMetadata,
  resolveOnChainAssetAddress,
} from './execution-asset.util';

describe('execution-asset.util', () => {
  it('resolves native asset to default on-chain address', () => {
    expect(resolveOnChainAssetAddress('native')).toBe('0x0000000000000000000000000000000000000001');
    expect(resolveOnChainAssetAddress(undefined)).toBe('0x0000000000000000000000000000000000000001');
  });

  it('canonicalizes Arbitrum Sepolia USDC metadata', () => {
    const meta = resolveAssetDisplayMetadata(421614, ARBITRUM_SEPOLIA_USDC);
    expect(meta.assetSymbol).toBe('USDC');
    expect(meta.assetDecimals).toBe(6);
    expect(meta.settlementMode).toBe('policy_label_only');
    expect(meta.settlementExplanation).toContain('native ETH');
  });

  it('maps Robinhood TSLA demo label', () => {
    const meta = resolveAssetDisplayMetadata(46630, 'TSLA');
    expect(meta.assetSymbol).toBe('TSLA');
    expect(meta.settlementMode).toBe('policy_label_only');
  });

  it('maps native ETH settlement mode', () => {
    const meta = resolveAssetDisplayMetadata(421614, 'native');
    expect(meta.assetSymbol).toBe('ETH');
    expect(meta.settlementMode).toBe('native_eth');
  });
});
