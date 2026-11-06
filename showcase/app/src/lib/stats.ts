import type { Repo } from '../types/repo';

export interface OverviewStats {
  total: number;
  sampled: number;
  failed: number;
  missing: number;
  categories: number;
  soundTypes: number;
  totalSampleBytes: number;
  totalSampleSeconds: number;
}

export function computeOverviewStats(repos: Repo[]): OverviewStats {
  let sampled = 0;
  let failed = 0;
  let missing = 0;
  let totalSampleBytes = 0;
  let totalSampleSeconds = 0;
  const categories = new Set<string>();
  const soundTypes = new Set<string>();

  for (const repo of repos) {
    categories.add(repo.category);
    for (const type of repo.soundTypes) soundTypes.add(type);
    if (repo.sample.status === 'ok') sampled += 1;
    else if (repo.sample.status === 'failed' || repo.sample.status === 'skipped') failed += 1;
    else missing += 1;
    totalSampleBytes += repo.sample.spec?.bytes ?? 0;
    totalSampleSeconds += repo.sample.durationSec ?? 0;
  }

  return {
    total: repos.length,
    sampled,
    failed,
    missing,
    categories: categories.size,
    soundTypes: soundTypes.size,
    totalSampleBytes,
    totalSampleSeconds,
  };
}

export function countBySoundType(repos: Repo[]): Array<{ type: string; count: number }> {
  const counts = new Map<string, number>();
  for (const repo of repos) {
    for (const type of repo.soundTypes) counts.set(type, (counts.get(type) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}
