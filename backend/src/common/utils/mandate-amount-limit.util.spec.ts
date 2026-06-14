import { normalizeMandateAmountForDb, parseMandateAmountLimit } from './mandate-amount-limit.util';

describe('mandate amount limit util', () => {
  it('parses token suffixed policy limits', () => {
    expect(parseMandateAmountLimit('100 USDG')).toEqual({
      amount: '100',
      unit: 'USDG',
      display: '100 USDG',
    });
    expect(parseMandateAmountLimit('1 USDC')).toEqual({
      amount: '1',
      unit: 'USDC',
      display: '1 USDC',
    });
  });

  it('parses descriptive units and share limits', () => {
    expect(parseMandateAmountLimit('250 USDC equivalent')).toEqual({
      amount: '250',
      unit: 'USDC equivalent',
      display: '250 USDC equivalent',
    });
    expect(parseMandateAmountLimit('500 shares')).toEqual({
      amount: '500',
      unit: 'shares',
      display: '500 shares',
    });
  });

  it('normalizes numeric db values', () => {
    expect(normalizeMandateAmountForDb('100 USDG')).toBe('100');
    expect(normalizeMandateAmountForDb('1000 USDG')).toBe('1000');
    expect(normalizeMandateAmountForDb('23.479999 USDC')).toBe('23.479999');
    expect(normalizeMandateAmountForDb('100')).toBe('100');
    expect(normalizeMandateAmountForDb('')).toBeNull();
  });
});
