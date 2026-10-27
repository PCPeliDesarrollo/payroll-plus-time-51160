import { describe, it as test } from 'node:test';
import assert from 'node:assert/strict';
import { findVacationBalanceForPeriod } from './vacationBalancePeriod';

describe('Vacation balance period selection', () => {
  test('Cristina has 5 days remaining in March 2026–February 2027 despite a legacy year label', () => {
    const cristina = {
      year: 2025, period_start: '2026-03-01', period_end: '2027-02-28',
      total_days: 10, used_days: 5, remaining_days: 5,
    };
    assert.equal(findVacationBalanceForPeriod([cristina], 2026)?.remaining_days, 5);
    assert.equal(findVacationBalanceForPeriod([cristina], 2025), null);
  });

  test('Historical balances do not replace the selected period balance', () => {
    const balances = [
      { year: 2025, period_start: '2025-03-01', period_end: '2026-02-28', remaining_days: 0 },
      { year: 2026, period_start: '2026-03-01', period_end: '2027-02-28', remaining_days: 5 },
    ];
    assert.equal(findVacationBalanceForPeriod(balances, 2026)?.remaining_days, 5);
  });

  test('Undated legacy balances only apply to their year', () => {
    const legacy = { year: 2026, period_start: null, period_end: null, remaining_days: 5 };
    assert.equal(findVacationBalanceForPeriod([legacy], 2026)?.remaining_days, 5);
    assert.equal(findVacationBalanceForPeriod([legacy], 2027), null);
  });
});