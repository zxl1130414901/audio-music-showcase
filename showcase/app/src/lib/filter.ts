import type { FilterState, Repo, TriState } from '../types/repo';
import { gpuFilterValue, windowsFilterValue } from './flags';

export function createEmptyFilters(): FilterState {
  return {
    q: '',
    categories: [],
    soundTypes: [],
    languages: [],
    licenses: [],
    platforms: 'all',
    gpu: 'all',
    sampleReady: 'all',
  };
}

export function matchesKeyword(repo: Repo, keyword: string): boolean {
  const needle = keyword.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [
    repo.owner,
    repo.repo,
    repo.id,
    repo.descriptionZh,
    repo.category,
    repo.language ?? '',
    repo.bestFor,
    ...repo.soundTypes,
    ...repo.tags,
    ...repo.techStack,
  ]
    .join(' ')
    .toLowerCase();
  return needle.split(/\s+/).every((word) => haystack.includes(word));
}

function matchesTri(value: boolean, tri: TriState): boolean {
  if (tri === 'all') return true;
  return tri === 'yes' ? value : !value;
}

function matchesAny(value: string, selected: string[]): boolean {
  return selected.length === 0 || selected.includes(value);
}

/** 关键词 AND，同组多选 OR。 */
export function filterRepos(repos: Repo[], filters: FilterState): Repo[] {
  return repos.filter((repo) => {
    if (!matchesKeyword(repo, filters.q)) return false;
    if (!matchesAny(repo.category, filters.categories)) return false;
    if (filters.soundTypes.length > 0) {
      const hit = filters.soundTypes.some((type) =>
        [...repo.soundTypes, repo.category, ...repo.tags].some((value) => value.includes(type)),
      );
      if (!hit) return false;
    }
    if (!matchesAny(repo.language ?? '未知', filters.languages)) return false;
    if (!matchesAny(repo.license ?? '未声明', filters.licenses)) return false;
    if (!matchesTri(windowsFilterValue(repo.windowsSupport), filters.platforms)) return false;
    if (!matchesTri(gpuFilterValue(repo.gpuAcceleration), filters.gpu)) return false;
    if (!matchesTri(repo.sample.status === 'ok', filters.sampleReady)) return false;
    return true;
  });
}

export function hasActiveFilters(filters: FilterState): boolean {
  return (
    filters.q.trim() !== '' ||
    filters.categories.length > 0 ||
    filters.soundTypes.length > 0 ||
    filters.languages.length > 0 ||
    filters.licenses.length > 0 ||
    filters.platforms !== 'all' ||
    filters.gpu !== 'all' ||
    filters.sampleReady !== 'all'
  );
}

export function countActiveFilters(filters: FilterState): number {
  let count = 0;
  if (filters.q.trim()) count += 1;
  count += filters.categories.length;
  count += filters.soundTypes.length;
  count += filters.languages.length;
  count += filters.licenses.length;
  if (filters.platforms !== 'all') count += 1;
  if (filters.gpu !== 'all') count += 1;
  if (filters.sampleReady !== 'all') count += 1;
  return count;
}

function uniqueSorted(values: Array<string | null>): string[] {
  const set = new Set(values.filter((value): value is string => Boolean(value)));
  return [...set].sort((a, b) => a.localeCompare(b, 'zh-CN'));
}

export function collectFilterOptions(repos: Repo[]): {
  categories: string[];
  soundTypes: string[];
  languages: string[];
  licenses: string[];
} {
  return {
    categories: uniqueSorted(repos.map((repo) => repo.category)),
    soundTypes: uniqueSorted(repos.flatMap((repo) => repo.soundTypes)),
    languages: uniqueSorted(repos.map((repo) => repo.language ?? '未知')),
    licenses: uniqueSorted(repos.map((repo) => repo.license ?? '未声明')),
  };
}

export function toggleFilterValue(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export function updateFilter<K extends keyof FilterState>(
  filters: FilterState,
  key: K,
  value: FilterState[K],
): FilterState {
  return { ...filters, [key]: value };
}
