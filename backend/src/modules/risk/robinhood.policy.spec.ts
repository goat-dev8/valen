import { evaluateRobinhoodPolicy } from './robinhood.policy';

describe('evaluateRobinhoodPolicy', () => {
  it('allows supported Robinhood ticker scenarios under limits', () => {
    expect(
      evaluateRobinhoodPolicy({
        actionType: 'robinhood_token_transfer',
        metadata: { robinhood: { ticker: 'TSLA', scenario: 'allowed' } },
      }),
    ).toEqual({ allowed: true, reasonCode: 'allowed', ticker: 'TSLA' });
  });

  it('refuses over-limit Robinhood ticker scenarios', () => {
    expect(
      evaluateRobinhoodPolicy({
        actionType: 'robinhood_token_transfer',
        metadata: { robinhood: { ticker: 'TSLA', scenario: 'refused' } },
      }),
    ).toEqual({ allowed: false, reasonCode: 'over_limit', ticker: 'TSLA' });
  });

  it('ignores non-Robinhood actions', () => {
    expect(evaluateRobinhoodPolicy({ actionType: 'transfer', metadata: {} })).toEqual({
      allowed: true,
      reasonCode: 'allowed',
      ticker: null,
    });
  });
});
