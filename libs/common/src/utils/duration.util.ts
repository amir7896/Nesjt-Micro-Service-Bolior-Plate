const MS: Record<string, number> = {
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

const SECONDS: Record<string, number> = {
  s: 1,
  m: 60,
  h: 3600,
  d: 86400,
};

function parseAmount(
  expiresIn: string,
): { amount: number; unit: string } | null {
  const match = /^(\d+)([smhd])$/.exec(expiresIn);
  if (!match) {
    return null;
  }
  return { amount: Number(match[1]), unit: match[2] };
}

export function parseDurationMs(
  expiresIn: string,
  fallbackMs = 7 * 86_400_000,
): number {
  const parsed = parseAmount(expiresIn);
  if (!parsed) {
    return fallbackMs;
  }
  return parsed.amount * (MS[parsed.unit] ?? MS.d);
}

export function parseDurationSeconds(
  expiresIn: string,
  fallbackSeconds = 24 * 60 * 60,
): number {
  const parsed = parseAmount(expiresIn);
  if (!parsed) {
    return fallbackSeconds;
  }
  return parsed.amount * (SECONDS[parsed.unit] ?? 60);
}
