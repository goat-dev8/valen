import {
  normalizeExecutionAmount,
  normalizeExecutionAmountWei,
} from './amount.util';

describe('amount util', () => {
  it('normalizes decimal USDC amounts to 6-decimal base units', () => {
    expect(normalizeExecutionAmount('0.001', 6)).toBe('1000');
    expect(normalizeExecutionAmount('1.25', 6)).toBe('1250000');
  });

  it('normalizes integer human amounts to base units', () => {
    expect(normalizeExecutionAmount('1', 6)).toBe('1000000');
    expect(normalizeExecutionAmount('5', 6)).toBe('5000000');
    expect(normalizeExecutionAmount('10', 18)).toBe('10000000000000000000');
  });

  it('preserves the legacy ETH wei parser', () => {
    expect(normalizeExecutionAmountWei('0.001')).toBe('1000000000000000');
  });
});
