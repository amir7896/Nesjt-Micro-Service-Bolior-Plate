import { parseDurationMs, parseDurationSeconds } from './duration.util';

describe('duration utils', () => {
  it('parses millisecond durations', () => {
    expect(parseDurationMs('15m')).toBe(15 * 60_000);
    expect(parseDurationMs('1d')).toBe(86_400_000);
    expect(parseDurationMs('7d')).toBe(7 * 86_400_000);
    expect(parseDurationMs('invalid', 1000)).toBe(1000);
  });

  it('parses second durations', () => {
    expect(parseDurationSeconds('15m')).toBe(15 * 60);
    expect(parseDurationSeconds('1d')).toBe(86_400);
    expect(parseDurationSeconds('2h')).toBe(7200);
    expect(parseDurationSeconds('bad', 30)).toBe(30);
  });
});
