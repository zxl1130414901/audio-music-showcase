import type { Repo } from '../types/repo';
import type { SoundTypeEntry } from '../types/discovery';

/** 按「听感」归类：命中声音类型词表、标签、分类或描述里的关键词。 */
export function matchesSoundType(repo: Repo, entry: SoundTypeEntry): boolean {
  if (repo.soundTypes.some((type) => entry.keywords.includes(type) || type === entry.titleZh)) {
    return true;
  }
  const haystack = [
    repo.category,
    ...repo.soundTypes,
    ...repo.tags,
    ...repo.techStack,
    repo.descriptionZh,
  ]
    .join(' ')
    .toLowerCase();
  return entry.keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
}

export function reposOfSoundType(repos: Repo[], entry: SoundTypeEntry): Repo[] {
  return repos.filter((repo) => matchesSoundType(repo, entry));
}

export interface SoundTypeCount {
  id: string;
  entry: SoundTypeEntry;
  count: number;
}

export function soundTypeCounts(repos: Repo[], entries: SoundTypeEntry[]): SoundTypeCount[] {
  return entries.map((entry) => ({ id: entry.id, entry, count: reposOfSoundType(repos, entry).length }));
}

export function findSoundType(
  entries: SoundTypeEntry[],
  id: string | null,
): SoundTypeEntry | null {
  return entries.find((entry) => entry.id === id) ?? null;
}
