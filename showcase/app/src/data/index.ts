import { emptyDiscovery, type DiscoveryDoc } from '../types/discovery';
import { emptyIntents, type IntentDoc } from '../types/intents';
import type { Dataset, DetailEvidence, RepoDetail } from '../types/repo';
import { adaptDataset, type RawSampleEntry } from './adapter';
import { fallbackDiscovery, fallbackIntents } from './fallback';

export interface LoadedDataset {
  dataset: Dataset;
  details: Record<string, RepoDetail>;
  evidence: Record<string, DetailEvidence[]>;
  samples: Record<string, RawSampleEntry>;
  discovery: DiscoveryDoc;
  intents: IntentDoc;
  source: {
    file: string;
    detailsDir: string;
    sampleRoot: string;
    isSample: boolean;
    loadedAt: string;
    detailCount: number;
    sampleCount: number;
    repoCount: number;
  };
}

function isDict(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** 合并真实选型数据；字段为空时逐项回落到内置音频选型契约。 */
function mergeDiscovery(raw: unknown): DiscoveryDoc {
  if (!isDict(raw)) return fallbackDiscovery;
  const doc = raw as Partial<DiscoveryDoc>;
  return {
    ...emptyDiscovery(),
    ...doc,
    scenarios: Array.isArray(doc.scenarios) && doc.scenarios.length > 0 ? doc.scenarios : fallbackDiscovery.scenarios,
    constraints:
      Array.isArray(doc.constraints) && doc.constraints.length > 0
        ? doc.constraints
        : fallbackDiscovery.constraints,
    quickPicks:
      Array.isArray(doc.quickPicks) && doc.quickPicks.length > 0
        ? doc.quickPicks
        : fallbackDiscovery.quickPicks,
    soundTypes:
      Array.isArray(doc.soundTypes) && doc.soundTypes.length > 0
        ? doc.soundTypes
        : fallbackDiscovery.soundTypes,
    sampleGroups:
      Array.isArray(doc.sampleGroups) && doc.sampleGroups.length > 0
        ? doc.sampleGroups
        : fallbackDiscovery.sampleGroups,
    synonyms: isDict(doc.synonyms) ? doc.synonyms : fallbackDiscovery.synonyms,
    warnings: Array.isArray(doc.warnings) ? doc.warnings : [],
  };
}

function mergeIntents(raw: unknown): IntentDoc {
  if (!isDict(raw)) return fallbackIntents;
  const doc = raw as Partial<IntentDoc>;
  const repos = isDict(doc.repos) ? (doc.repos as IntentDoc['repos']) : fallbackIntents.repos;
  const scenarios = isDict(doc.scenarios)
    ? (doc.scenarios as IntentDoc['scenarios'])
    : fallbackIntents.scenarios;
  return {
    updatedAt: typeof doc.updatedAt === 'string' ? doc.updatedAt : fallbackIntents.updatedAt,
    repos: Object.keys(repos).length > 0 ? repos : fallbackIntents.repos,
    scenarios: Object.keys(scenarios).length > 0 ? scenarios : fallbackIntents.scenarios,
    global: Array.isArray(doc.global) && doc.global.length > 0 ? doc.global : fallbackIntents.global,
  };
}

function collectEvidence(raw: unknown[]): Record<string, DetailEvidence[]> {
  const byRepo: Record<string, DetailEvidence[]> = {};
  for (const item of raw) {
    if (!isDict(item)) continue;
    const repoId = typeof item.repoId === 'string' ? item.repoId : item.id;
    if (typeof repoId !== 'string') continue;
    const entry: DetailEvidence = {
      field: typeof item.field === 'string' ? item.field : '—',
      source: typeof item.source === 'string' ? item.source : typeof item.sourcePath === 'string' ? item.sourcePath : '—',
      noteZh: typeof item.noteZh === 'string' ? item.noteZh : typeof item.note === 'string' ? item.note : '',
    };
    (byRepo[repoId] ??= []).push(entry);
  }
  return byRepo;
}

export async function loadDataset(): Promise<LoadedDataset> {
  const module = await import('virtual:showcase');
  const adapted = adaptDataset(
    module.reposPayload,
    module.payloadKind,
    (module.sampleIndexPayload ?? {}) as Record<string, RawSampleEntry>,
    module.detailsPayload ?? {},
  );
  return {
    dataset: adapted.dataset,
    details: adapted.details,
    evidence: collectEvidence(module.evidencePayload ?? []),
    samples: adapted.samples,
    discovery: mergeDiscovery(module.discoveryPayload),
    intents: mergeIntents(module.intentsPayload),
    source: module.dataSource,
  };
}

export function assertDataset(dataset: Dataset, isSample = false): void {
  if (!dataset || !Array.isArray(dataset.repos)) {
    throw new Error('数据格式错误：缺少 repos 数组。');
  }
  if (!isSample && dataset.repos.length < 40) {
    throw new Error(`数据条数不足：期望至少 40 条，实际 ${dataset.repos.length} 条。`);
  }
  dataset.repos.forEach((repo, index) => {
    if (!repo || typeof repo.id !== 'string' || typeof repo.repo !== 'string') {
      throw new Error(`数据格式错误：第 ${index + 1} 条仓库缺少 id/repo。`);
    }
    if (!repo.sample || !repo.scores) {
      throw new Error(`数据格式错误：仓库 ${repo.id} 缺少 sample/scores。`);
    }
  });
}

export { emptyIntents };
