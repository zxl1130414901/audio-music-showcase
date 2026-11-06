import type { DetailEvidence, Repo, RepoDetail } from '../types/repo';
import { CLI_LABELS, GPU_LABELS, WINDOWS_LABELS } from './flags';
import { formatDuration, formatSampleRate } from './format';

/** 真档案缺失 / 字段为空时，用基础字段合成一份可读档案，保证详情页不空白。 */
export function buildFallbackDetail(repo: Repo, evidence: DetailEvidence[] = []): RepoDetail {
  const sample = repo.sample;
  return {
    id: repo.id,
    taglineZh: repo.signatureZh ?? repo.descriptionZh,
    summaryZh: repo.descriptionZh,
    whatItMakes:
      repo.bestFor || repo.soundTypes.length > 0
        ? [
            {
              type: repo.soundTypes[0] ?? repo.category,
              exampleZh: repo.bestFor || `${repo.category}方向的典型产出`,
              strength: repo.pros[0] ?? '样例与档案未提供更多细节',
            },
          ]
        : [],
    useCases: [],
    capabilities: {
      maxDurationZh: sample.durationSec ? `样例 ${formatDuration(sample.durationSec)}` : '未标注',
      formatsZh: repo.outputFormats,
      sampleRateZh: formatSampleRate(sample.spec),
      realtimeZh: repo.category.includes('合成') || repo.category.includes('引擎') ? '偏实时' : '未标注',
      batchZh:
        repo.batchable === 'yes' ? '可批量' : repo.batchable === 'partial' ? '可脚本化' : '未标注',
      platformZh: `${WINDOWS_LABELS[repo.windowsSupport]} · GPU ${GPU_LABELS[repo.gpuAcceleration]} · CLI ${CLI_LABELS[repo.cliHeadless]}`,
    },
    ceilingZh: '',
    workflow: [],
    differentiators: repo.pros,
    limits: repo.cons,
    compareTips: [],
    evidence,
    signatureZh: repo.signatureZh,
    chooseWhenZh: repo.chooseWhenZh,
    avoidWhenZh: repo.avoidWhenZh,
    contrastWith: repo.contrastWith,
  };
}

/** 真档案优先，空字段回落合成档案；不覆盖任何真实内容。 */
export function mergeDetail(
  repo: Repo,
  detail: RepoDetail | undefined,
  evidence: DetailEvidence[] = [],
): { detail: RepoDetail; isFallback: boolean } {
  const fallback = buildFallbackDetail(repo, evidence);
  if (!detail) return { detail: fallback, isFallback: true };

  return {
    detail: {
      id: repo.id,
      taglineZh: detail.taglineZh || fallback.taglineZh,
      summaryZh: detail.summaryZh || fallback.summaryZh,
      whatItMakes: detail.whatItMakes.length > 0 ? detail.whatItMakes : fallback.whatItMakes,
      useCases: detail.useCases,
      capabilities: {
        maxDurationZh: detail.capabilities.maxDurationZh || fallback.capabilities.maxDurationZh,
        formatsZh:
          detail.capabilities.formatsZh.length > 0
            ? detail.capabilities.formatsZh
            : fallback.capabilities.formatsZh,
        sampleRateZh: detail.capabilities.sampleRateZh || fallback.capabilities.sampleRateZh,
        realtimeZh: detail.capabilities.realtimeZh || fallback.capabilities.realtimeZh,
        batchZh: detail.capabilities.batchZh || fallback.capabilities.batchZh,
        platformZh: detail.capabilities.platformZh || fallback.capabilities.platformZh,
      },
      ceilingZh: detail.ceilingZh || fallback.ceilingZh,
      workflow: detail.workflow,
      differentiators: detail.differentiators,
      limits: detail.limits,
      compareTips: detail.compareTips,
      evidence: [...detail.evidence, ...evidence.filter((item) => !detail.evidence.some((existing) => existing.field === item.field))],
      signatureZh: detail.signatureZh ?? repo.signatureZh,
      chooseWhenZh: detail.chooseWhenZh ?? repo.chooseWhenZh,
      avoidWhenZh: detail.avoidWhenZh ?? repo.avoidWhenZh,
      contrastWith: detail.contrastWith ?? repo.contrastWith,
    },
    isFallback: false,
  };
}
