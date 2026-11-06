import type { Repo, RepoDetail } from '../types/repo';
import { formatDuration } from './format';
import { windowsLevel } from './flags';

export type ABDiff = 'same' | 'different' | 'missing';

export interface ABRow {
  label: string;
  aZh: string;
  bZh: string;
  diff: ABDiff;
}

export interface ABConclusion {
  /** 三句话以内，先音色、再时长、再适用场合。 */
  summaryZh: string;
  rows: ABRow[];
  /** 任一侧缺样例时给出可执行的下一步。 */
  caveatZh: string | null;
}

function text(value: string | null | undefined, fallback = '档案未就绪'): string {
  return value && value.trim() ? value.trim() : fallback;
}

function signatureOf(repo: Repo, detail?: RepoDetail | null): string {
  return text(detail?.signatureZh ?? repo.signatureZh ?? repo.sample.signatureZh);
}

function durationZh(repo: Repo): string {
  const seconds = repo.sample.durationSec;
  if (!seconds) return '样例缺位';
  return `${formatDuration(seconds)}${repo.sample.spec?.sampleRate ? ` · ${(repo.sample.spec.sampleRate / 1000).toFixed(0)} kHz` : ''}`;
}

function gateZh(repo: Repo): string {
  const win =
    windowsLevel(repo.windowsSupport) === 'works'
      ? 'Windows 可用'
      : windowsLevel(repo.windowsSupport) === 'workaround'
        ? 'Windows 需绕路'
        : windowsLevel(repo.windowsSupport) === 'broken'
          ? 'Windows 不可用'
          : 'Windows 未验证';
  const gpu =
    repo.gpuAcceleration === 'required'
      ? '需要 GPU'
      : repo.gpuAcceleration === 'optional'
        ? 'GPU 可选'
        : repo.gpuAcceleration === 'none'
          ? '无需 GPU'
          : 'GPU 未知';
  const cli = repo.cliHeadless === 'yes' ? '有 CLI' : repo.cliHeadless === 'partial' ? '有 API' : '需写代码';
  return `${win} · ${gpu} · ${cli} · 安装 ${repo.installComplexity}/5`;
}

function compareText(a: string, b: string, missingTokens: string[] = ['档案未就绪', '样例缺位']): ABDiff {
  if (missingTokens.some((token) => a.includes(token) || b.includes(token))) return 'missing';
  return a === b ? 'same' : 'different';
}

/** 生成并排试听页的对比结论；缺失字段降级成「档案未就绪」，绝不编造听感。 */
export function buildABConclusion(
  a: Repo,
  b: Repo,
  detailA?: RepoDetail | null,
  detailB?: RepoDetail | null,
): ABConclusion {
  const soundA = a.soundTypes.length > 0 ? a.soundTypes.join(' / ') : '未分类';
  const soundB = b.soundTypes.length > 0 ? b.soundTypes.join(' / ') : '未分类';
  const sigA = signatureOf(a, detailA);
  const sigB = signatureOf(b, detailB);
  const durA = durationZh(a);
  const durB = durationZh(b);
  const chooseA = text(detailA?.chooseWhenZh ?? a.chooseWhenZh);
  const chooseB = text(detailB?.chooseWhenZh ?? b.chooseWhenZh);
  const avoidA = text(detailA?.avoidWhenZh ?? a.avoidWhenZh, '未标注不适用场景');
  const avoidB = text(detailB?.avoidWhenZh ?? b.avoidWhenZh, '未标注不适用场景');

  const sameDuration = a.sample.durationSec != null && b.sample.durationSec != null
    ? Math.abs(a.sample.durationSec - b.sample.durationSec) < 0.5
    : false;

  const summaryZh = [
    `${a.repo} 是「${soundA}」，${b.repo} 是「${soundB}」。`,
    a.sample.durationSec && b.sample.durationSec
      ? sameDuration
        ? `两条样例都是 ${formatDuration(a.sample.durationSec)}，可以按同一时间轴对听。`
        : `样例长度不同（${durA} vs ${durB}），先对齐段落再比音色。`
      : '样例尚未齐备，时长差异暂时无法判断。',
    `适用场合：${a.repo} —— ${chooseA}；${b.repo} —— ${chooseB}。`,
  ].join('');

  const rows: ABRow[] = [
    { label: '声音类型', aZh: soundA, bZh: soundB, diff: soundA === soundB ? 'same' : 'different' },
    { label: '听感定位', aZh: sigA, bZh: sigB, diff: compareText(sigA, sigB) },
    { label: '样例时长', aZh: durA, bZh: durB, diff: compareText(durA, durB) },
    { label: '运行门槛', aZh: gateZh(a), bZh: gateZh(b), diff: compareText(gateZh(a), gateZh(b)) },
    { label: '什么时候选它', aZh: chooseA, bZh: chooseB, diff: compareText(chooseA, chooseB) },
    { label: '什么时候别选', aZh: avoidA, bZh: avoidB, diff: compareText(avoidA, avoidB) },
  ];

  const caveatZh =
    a.sample.status !== 'ok' || b.sample.status !== 'ok'
      ? '有一条样例还在生成：可以先用能力分段与档案判断，样例就绪后再对听。'
      : null;

  return { summaryZh, rows, caveatZh };
}
