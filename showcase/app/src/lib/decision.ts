import type { Repo, RepoDetail } from '../types/repo';

export interface Decision {
  signatureZh: string | null;
  chooseWhenZh: string | null;
  avoidWhenZh: string | null;
  contrastWith: string[];
}

/** 字段优先级：仓库层（真实数据 / 样例 meta）> 详情档案；缺失就是 null，由 UI 隐藏。 */
export function resolveDecision(repo: Repo, detail?: RepoDetail): Decision {
  return {
    signatureZh: repo.signatureZh ?? detail?.signatureZh ?? null,
    chooseWhenZh: repo.chooseWhenZh ?? detail?.chooseWhenZh ?? null,
    avoidWhenZh: repo.avoidWhenZh ?? detail?.avoidWhenZh ?? null,
    contrastWith: [...new Set([...repo.contrastWith, ...(detail?.contrastWith ?? [])])].filter(
      (id) => id !== repo.id,
    ),
  };
}

export function hasDecision(repo: Repo, detail?: RepoDetail): boolean {
  const decision = resolveDecision(repo, detail);
  return Boolean(decision.signatureZh || decision.chooseWhenZh || decision.avoidWhenZh);
}

/** 「别选」的兜底：只在数据明确写了 limits 时用，不凭印象编造。 */
export function fallbackAvoid(repo: Repo, detail?: RepoDetail): string | null {
  return repo.avoidWhenZh ?? detail?.avoidWhenZh ?? repo.sample.limitsZh ?? null;
}
