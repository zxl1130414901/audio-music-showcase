import type { Scores } from '../types/repo';

export type ScoreKey = keyof Scores;

export interface ScoreDimension {
  key: ScoreKey;
  label: string;
  weight: number;
  hint: string;
}

/** 音频站把「性能」换成「音质」，权重与视频站保持同一套六维口径。 */
export const SCORE_DIMENSIONS: readonly ScoreDimension[] = [
  { key: 'maturity', label: '成熟度', weight: 0.2, hint: '版本迭代与稳定性' },
  { key: 'usability', label: '易用性', weight: 0.2, hint: '上手与调试成本' },
  { key: 'audioQuality', label: '音质', weight: 0.2, hint: '样例听感与处理精度' },
  { key: 'docs', label: '文档', weight: 0.15, hint: '示例与可读性' },
  { key: 'windows', label: 'Windows', weight: 0.125, hint: '本机可用程度' },
  { key: 'activity', label: '活跃度', weight: 0.125, hint: '近期提交与维护' },
];

export function computeOverallScore(scores: Scores): number {
  const total = SCORE_DIMENSIONS.reduce((sum, dim) => {
    const value = scores[dim.key];
    const safe = Number.isFinite(value) ? Math.min(5, Math.max(1, value)) : 1;
    return sum + safe * dim.weight;
  }, 0);
  return Math.round(total * 10) / 10;
}

export function scorePercent(score: number): number {
  return Math.min(100, Math.max(0, (score / 5) * 100));
}
