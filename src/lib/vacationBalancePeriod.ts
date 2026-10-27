interface PeriodBalance {
  year: number;
  period_start: string | null;
  period_end: string | null;
}

// Explicit dates take precedence over legacy year labels.
export function findVacationBalanceForPeriod<T extends PeriodBalance>(
  balances: T[],
  periodYear: number,
): T | null {
  const start = `${periodYear}-03-01`;
  const end = `${periodYear + 1}-02-28`;
  return balances.find(balance => balance.period_start === start && balance.period_end === end)
    ?? balances.find(balance => !balance.period_start && !balance.period_end && balance.year === periodYear)
    ?? null;
}

export function currentVacationPeriodYear(now = new Date()): number {
  return now.getMonth() >= 2 ? now.getFullYear() : now.getFullYear() - 1;
}