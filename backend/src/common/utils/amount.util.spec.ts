import {
  normalizeExecutionAmount,
  normalizeExecutionAmountWei,
} from './amount.util';

describe('amount util', () => {
  it('normalizes decimal USDC amounts to 6-decimal base units', () => {
    expect(normalizeExecutionAmount('0.001', 6)).toBe('1000');
    expect(normalizeExecutionAmount('1.25', 6)).toBe('1250000');
  });

  it('keeps integer strings as already-normalized base units', () => {
    expect(normalizeExecutionAmount('1000', 6)).toBe('1000');
  });

  it('preserves the legacy ETH wei parser', () => {
    expect(normalizeExecutionAmountWei('0.001')).toBe('1000000000000000');
  });
});
