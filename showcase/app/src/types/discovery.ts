/** 选型契约：与 `..\data\discovery.json` 对齐；音频站额外允许 soundTypes / sampleGroups。 */

export type Verdict = 'first' | 'alt' | 'heavy';

export interface ScenarioRecommendation {
  repoId: string;
  verdict: Verdict;
  whyZh: string;
  timeZh: string;
}

export interface ScenarioFilters {
  categories: string[];
  tags: string[];
  soundTypes?: string[];
}

export interface DiscoveryScenario {
  id: string;
  titleZh: string;
  descZh: string;
  questionZh: string;
  recommended: ScenarioRecommendation[];
  filters: ScenarioFilters;
}

export type ConstraintField =
  | 'windowsTier'
  | 'needsGpu'
  | 'installComplexity'
  | 'pipeline'
  | 'hasCli'
  | 'batchable';

export type ConstraintOp = 'in' | 'eq' | 'lte' | 'gte';

export interface DiscoveryConstraint {
  id: string;
  titleZh: string;
  descZh: string;
  apply: {
    type: 'field';
    field: ConstraintField;
    op: ConstraintOp;
    value: string | string[] | number | boolean;
  };
}

export interface QuickPick {
  needZh: string;
  repoId: string;
  whyZh: string;
  timeZh: string;
}

export interface DiscoveryWarning {
  scopeZh: string;
  riskZh: string;
}

/** 「我想要什么样的声音」：按听感而非技术栈进入。 */
export interface SoundTypeEntry {
  id: string;
  titleZh: string;
  descZh: string;
  /** 命中仓库 soundTypes / tags / category / 描述里任意一个词即算该类。 */
  keywords: string[];
}

/** 同一需求的对比样例：同标签、同长度，放一起让差异自己说话。 */
export interface SampleGroup {
  id: string;
  titleZh: string;
  descZh: string;
  repoIds: string[];
}

export interface DiscoveryDoc {
  updatedAt?: string;
  scenarios: DiscoveryScenario[];
  constraints: DiscoveryConstraint[];
  quickPicks: QuickPick[];
  soundTypes: SoundTypeEntry[];
  sampleGroups: SampleGroup[];
  synonyms: Record<string, string[]>;
  warnings: DiscoveryWarning[];
}

export function emptyDiscovery(): DiscoveryDoc {
  return {
    scenarios: [],
    constraints: [],
    quickPicks: [],
    soundTypes: [],
    sampleGroups: [],
    synonyms: {},
    warnings: [],
  };
}
