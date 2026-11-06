/**
 * 数据适配层：真实 `repos.json` 与临时 `manifest.json` 都归一化成同一份 Repo。
 *
 * 真数据到位后无需改 UI——`vite.config.ts` 里 repos.json 存在即自动切换。
 * 字段缺失时按文件名 / 语言 / 描述做保守推断，并在数据源上标记 mock。
 */

import type {
  Batchable,
  CliSupport,
  Dataset,
  DatasetMeta,
  GpuRequirement,
  Repo,
  RepoDetail,
  SampleInfo,
  SampleSegment,
  SampleSpec,
  Scores,
  WindowsSupport,
} from '../types/repo';
import { daysSince } from '../lib/format';

export interface RawSampleEntry {
  id: string;
  audioFile?: string;
  waveformFile?: string;
  spectrogramFile?: string;
  meta?: unknown;
  audioBytes?: number;
  status?: string;
}

export interface AdaptedDataset {
  dataset: Dataset;
  details: Record<string, RepoDetail>;
  samples: Record<string, RawSampleEntry>;
}

type Dict = Record<string, unknown>;

function dict(value: unknown): Dict | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Dict)
    : null;
}

function str(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function num(...values: unknown[]): number | null {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }
  return null;
}

function bool(...values: unknown[]): boolean | null {
  for (const value of values) {
    if (typeof value === 'boolean') return value;
  }
  return null;
}

function list(...values: unknown[]): string[] {
  for (const value of values) {
    if (Array.isArray(value)) {
      return value
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter((item): item is string => Boolean(item));
    }
    if (typeof value === 'string' && value.trim()) {
      return value
        .split(/[,，/|;]/)
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/* ------------------------------------------------------------------ 分类与声音类型 */

interface CategoryRule {
  category: string;
  pattern: RegExp;
}

/** 顺序即优先级：越具体的 AI 生成先判，最后才是工具与库。 */
const CATEGORY_RULES: readonly CategoryRule[] = [
  {
    category: '音乐生成',
    pattern: /musicgen|music generation|text-to-music|song ?generation|audio-diffusion|audiolm|soundstorm|stable-audio|musicgen|melody/i,
  },
  {
    category: '音效生成',
    pattern: /sound effect|foley|audio ?ldm|audioldm|text-to-audio|audio ?lcm|mmaudio|audiostory|generative audio/i,
  },
  {
    category: '语音处理',
    pattern: /speech|voice|tts|asr|whisper|vocal|singing|voice ?clone|vits|sovits/i,
  },
  {
    category: '母带与修复',
    pattern: /matchering|mastering|vocal ?remover|source separation|denoise|restoration|stem/i,
  },
  {
    category: '合成器与音源',
    pattern: /synth|soundfont|sf2|fluidsynth|surge|dsp|oscillator|fundsp|faust|glicol|brickworks/i,
  },
  {
    category: 'Tracker 与音序器',
    pattern: /tracker|milky|bamboo|bassoon|midi|sequencer|daw|stargate|yadaw|dawdreamer|openmusic/i,
  },
  {
    category: '音频引擎与库',
    pattern: /audio ?kit|naudio|core ?audio|audio engine|audio library|portaudio|miniaudio|tiny ?sound ?font/i,
  },
  {
    category: '分析与可视化',
    pattern: /visuali[sz]|spectrogram|spectral|analysis|analyser|essentia|aubio|pyAudioAnalysis|audioflux|nnAudio|led ?strip/i,
  },
  {
    category: '转码与批处理',
    pattern: /transcod|ffmpeg|batch|convert|encode|audio ?mass|codec/i,
  },
  {
    category: '互动音乐与工具',
    pattern: /supercollider|cardinal|comfyui|ableton|vst|plugin|modular/i,
  },
];

const SOUND_TYPE_RULES: readonly { type: string; pattern: RegExp }[] = [
  {
    type: '神经网络生成',
    pattern: /audiocraft|musicgen|audio ?ldm|audioldm|audio ?lcm|stable-audio|audiolm|soundstorm|audio-diffusion|mmaudio|audiostory|text-to-audio|generative|neural|diffusion|transformer|model|torch|tensorflow/i,
  },
  { type: '采样乐器', pattern: /soundfont|sf2|sampler|sample library|sfz|sound ?bank|tiny ?sound ?font|fluidsynth/i },
  {
    type: '纯合成',
    pattern: /synth|oscillator|dsp|faust|fundsp|glicol|brickworks|surge|modular|tracker|chiptune|midi/i,
  },
  { type: '环境音', pattern: /ambient|environment|field recording|nature|soundscape|foley|room tone/i },
  { type: '语音', pattern: /speech|voice|tts|asr|whisper|vocal|sing|clone/i },
  { type: '可视化', pattern: /visuali[sz]|spectrogram|spectrum|analyser|led|oscilloscope|waveform/i },
];

function textOf(raw: Dict): string {
  return [
    str(raw.repo, raw.name, raw.full_name, raw.id) ?? '',
    str(raw.description, raw.descriptionZh, raw.summary, raw.tagline) ?? '',
    str(raw.category) ?? '',
    ...list(raw.topics, raw.tags, raw.techStack),
  ].join(' ');
}

function guessCategory(raw: Dict, text: string): string {
  const given = str(raw.category, raw.categoryZh);
  if (given) return given;
  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(text)) return rule.category;
  }
  const language = str(raw.language) ?? '';
  if (/javascript|typescript/i.test(language)) return '音频引擎与库';
  return '音频工具';
}

function guessSoundTypes(raw: Dict, text: string, category: string): string[] {
  const given = list(raw.soundTypes, raw.soundTags, raw.audioTypes);
  if (given.length > 0) return given;
  const types: string[] = [];
  for (const rule of SOUND_TYPE_RULES) {
    if (rule.pattern.test(text)) types.push(rule.type);
  }
  if (types.length === 0) {
    if (category.includes('生成')) types.push('神经网络生成');
    else if (category.includes('可视化')) types.push('可视化');
    else types.push('纯合成');
  }
  return types;
}

/* ------------------------------------------------------------------ 平台 / 约束 */

function normalizeGpu(raw: Dict, text: string): GpuRequirement {
  const value = str(raw.gpuAcceleration, raw.gpu, raw.needsGpu, raw.gpuRequirement)?.toLowerCase();
  if (value) {
    if (/required|yes|true|must/.test(value)) return 'required';
    if (/optional|partial|maybe/.test(value)) return 'optional';
    if (/none|no|false/.test(value)) return 'none';
  }
  const flag = bool(raw.gpuAcceleration, raw.needsGpu);
  if (flag !== null) return flag ? 'required' : 'none';
  if (/cuda|gpu acceleration|requires? (an? )?gpu/i.test(text)) return 'required';
  if (/pytorch|torch|tensorflow|diffusion|transformer|deep learning/i.test(text)) return 'optional';
  return 'none';
}

function normalizeWindows(raw: Dict, text: string): WindowsSupport {
  const value = str(raw.windowsSupport, raw.windows, raw.platform)?.toLowerCase();
  if (value) {
    if (/works|yes|true|native|win/.test(value)) return 'works';
    if (/workaround|partial|wsl/.test(value)) return 'workaround';
    if (/broken|no|false|mac|linux only/.test(value)) return 'broken';
  }
  const flag = bool(raw.windowsSupport);
  if (flag !== null) return flag ? 'works' : 'broken';
  if (/windows|win32|win64|\.net|c#|wpf|winforms/i.test(text)) return 'works';
  if (/macos|mac only|ios|swift|objective-c|coreaudio|audiokit/i.test(text)) return 'broken';
  return 'unknown';
}

function normalizeCli(raw: Dict, text: string): CliSupport {
  const value = str(raw.cliHeadless, raw.cli, raw.hasCli)?.toLowerCase();
  if (value) {
    if (/yes|true|cli|headless/.test(value)) return 'yes';
    if (/partial|some/.test(value)) return 'partial';
    if (/no|false|library/.test(value)) return 'no';
  }
  const flag = bool(raw.cliHeadless, raw.hasCli);
  if (flag !== null) return flag ? 'yes' : 'no';
  if (/command[- ]?line|cli|terminal|headless|daemon|batch render/i.test(text)) return 'yes';
  if (/library|framework|sdk|api/i.test(text)) return 'partial';
  return 'unknown';
}

function normalizeBatchable(raw: Dict, text: string, cli: CliSupport): Batchable {
  const value = str(raw.batchable, raw.batch)?.toLowerCase();
  if (value) {
    if (/yes|true|batch/.test(value)) return 'yes';
    if (/partial|script/.test(value)) return 'partial';
    if (/no|false/.test(value)) return 'no';
  }
  const flag = bool(raw.batchable);
  if (flag !== null) return flag ? 'yes' : 'no';
  if (cli === 'yes') return /batch|script|pipeline|automation/i.test(text) ? 'yes' : 'partial';
  return 'unknown';
}

function guessInstallComplexity(raw: Dict, text: string, language: string | null): number {
  const given = num(raw.installComplexity);
  if (given !== null) return clamp(Math.round(given), 1, 5);
  let level = 3;
  if (/c#|javascript|typescript/i.test(language ?? '')) level = 2;
  else if (/python|jupyter/i.test(language ?? '')) level = 3;
  else if (/c\+\+|rust|swift|objective-c/i.test(language ?? '')) level = 4;
  if (/pip install|npm install|prebuilt|binary release|appimage|installer/i.test(text)) level -= 1;
  if (/build from source|cmake|compile|requires? (visual studio|xcode)|cuda toolkit/i.test(text)) level += 1;
  return clamp(level, 1, 5);
}

/* ------------------------------------------------------------------ 评分（仅占位数据使用） */

function baseScores(
  stars: number,
  updatedIso: string,
  language: string | null,
  install: number,
  windows: WindowsSupport,
  hasReadme: boolean,
): Scores {
  const maturity = clamp(1 + 4 * (Math.log10(stars + 1) / Math.log10(25_000)), 1, 5);
  const usability = clamp(6 - install + (/javascript|typescript|c#/i.test(language ?? '') ? 0.4 : 0), 1, 5);
  const docs = clamp(hasReadme ? 3.6 : 2.8, 1, 5);
  const windowsScore =
    windows === 'works' ? 4.5 : windows === 'workaround' ? 3.1 : windows === 'broken' ? 1.5 : 2.7;
  const updatedDays = daysSince(updatedIso);
  const activity = !Number.isFinite(updatedDays)
    ? 1
    : updatedDays < 90
      ? 5
      : updatedDays < 365
        ? 4
        : updatedDays < 730
          ? 3
          : updatedDays < 1825
            ? 2
            : 1;
  return {
    maturity: round1(maturity),
    usability: round1(usability),
    audioQuality: 3.6,
    docs: round1(docs),
    windows: round1(windowsScore),
    activity: round1(activity),
  };
}

/* ------------------------------------------------------------------ 样例 */

function readMetaSegments(meta: Dict | null): SampleSegment[] {
  if (!meta) return [];
  const raw = meta.segments;
  if (!Array.isArray(raw)) return [];
  const segments: SampleSegment[] = [];
  for (const item of raw) {
    const entry = dict(item);
    if (!entry) continue;
    const start = num(entry.startSec, entry.start, entry.t);
    const end = num(entry.endSec, entry.end, entry.tEnd);
    const cap = str(entry.capZh, entry.capabilityZh, entry.descZh, entry.cap);
    if (start === null || end === null || !cap) continue;
    segments.push({ startSec: start, endSec: end, capZh: cap });
  }
  return segments;
}

function normalizeSpec(entry: RawSampleEntry, meta: Dict | null): SampleSpec | null {
  const spec = dict(meta?.spec);
  const duration = num(spec?.durationSec, meta?.durationSec);
  const sampleRate = num(spec?.sampleRate, meta?.sampleRate);
  const channels = num(spec?.channels, meta?.channels);
  const codecFromSpec = str(spec?.codec);
  const bytes = num(spec?.bytes, entry.audioBytes, meta?.bytes);
  if (duration === null && sampleRate === null && bytes === null) return null;
  return {
    durationSec: duration ?? 0,
    ...(sampleRate !== null ? { sampleRate } : {}),
    ...(channels !== null ? { channels } : {}),
    ...(codecFromSpec ? { codec: codecFromSpec } : {}),
    ...(bytes !== null ? { bytes } : {}),
  };
}

function sampleInfoFrom(
  id: string,
  entry: RawSampleEntry | undefined,
  rawSample: Dict | null,
): SampleInfo {
  const meta = dict(entry?.meta);
  const segments = readMetaSegments(meta);
  const spec = normalizeSpec(entry ?? { id }, meta);
  const duration = spec?.durationSec && spec.durationSec > 0 ? spec.durationSec : num(rawSample?.durationSec);
  const audioFile = entry?.audioFile ?? null;
  const audioPath =
    audioFile !== null
      ? str(rawSample?.audioPath, rawSample?.samplePath, `_samples/${id}/${audioFile}`)
      : null;
  const waveformFile = entry?.waveformFile ?? null;
  const spectrogramFile = entry?.spectrogramFile ?? null;
  const metaStatus = str(meta?.status, rawSample?.status);
  const status =
    audioPath !== null
      ? 'ok'
      : metaStatus === 'failed'
        ? 'failed'
        : metaStatus === 'skipped'
          ? 'skipped'
          : 'missing';
  const noteZh =
    str(rawSample?.noteZh, rawSample?.note, meta?.statusNoteZh) ??
    (status === 'ok'
      ? '样例已生成，可直接试听。'
      : status === 'failed'
        ? '样例生成失败：这条没能产出可验收音频。'
        : status === 'skipped'
          ? '样例未出：在本机条件下没有产出可验收音频。'
          : '样例生成中：音频与频谱尚未就绪。');

  return {
    status,
    audioPath,
    waveformPath: waveformFile ? `_samples/${id}/${waveformFile}` : null,
    spectrogramPath: spectrogramFile ? `_samples/${id}/${spectrogramFile}` : null,
    durationSec: duration ?? null,
    spec,
    noteZh,
    segments,
    capabilitiesZh: list(meta?.capabilitiesZh, rawSample?.capabilitiesZh, rawSample?.capabilities),
    signatureZh: str(meta?.signatureZh, rawSample?.signatureZh),
    chooseWhenZh: str(meta?.chooseWhenZh, rawSample?.chooseWhenZh),
    contrastWith: list(meta?.contrastWith, rawSample?.contrastWith),
    limitsZh: str(meta?.limitsZh, rawSample?.limitsZh),
    evidenceZh: str(meta?.evidenceZh, rawSample?.evidenceZh, meta?.evidence),
    verifyLogZh: str(dict(meta?.verify)?.logZh),
    pipeline: str(meta?.pipeline, rawSample?.pipeline) ?? (audioPath ? 'official' : 'none'),
    blockerZh: str(meta?.blockerZh, rawSample?.blockerZh),
    whatItWouldNeedZh: str(meta?.whatItWouldNeed, meta?.whatItWouldNeedZh, rawSample?.whatItWouldNeedZh),
  };
}

/* ------------------------------------------------------------------ Repo */

export function adaptRepo(
  raw: unknown,
  index: number,
  samples: Record<string, RawSampleEntry>,
): Repo | null {
  const entry = dict(raw);
  if (!entry) return null;

  const fullName = str(entry.full_name, entry.fullName, `${str(entry.owner) ?? ''}/${str(entry.repo) ?? ''}`);
  const owner = str(entry.owner) ?? (fullName?.split('/')[0] ?? 'unknown');
  const repoName = str(entry.repo) ?? (fullName?.split('/')[1] ?? `repo-${index + 1}`);
  const id = str(entry.id, entry.localDir) ?? `${owner}__${repoName}`;
  const url = str(entry.url, entry.html_url, `https://github.com/${owner}/${repoName}`) ?? '';
  const description = str(entry.descriptionZh, entry.description, entry.summaryZh, entry.summary) ?? '暂无描述';
  const text = textOf({ ...entry, repo: repoName, full_name: fullName ?? repoName }) + ' ' + description;
  const category = guessCategory(entry, text);
  const language = str(entry.language);
  const stars = num(entry.stars, entry.stargazers_count) ?? 0;
  const pushedAt =
    str(entry.pushedAt, entry.pushed_at, entry.updatedAt, entry.updated_at, entry.createdAt) ??
    new Date().toISOString();
  const createdAt = str(entry.createdAt, entry.created_at, pushedAt) ?? pushedAt;
  const windows = normalizeWindows(entry, text);
  const gpu = normalizeGpu(entry, text);
  const cli = normalizeCli(entry, text);
  const installComplexity = guessInstallComplexity(entry, text, language);
  const batchable = normalizeBatchable(entry, text, cli);
  const soundTypes = guessSoundTypes(entry, text, category);
  const rawSample = dict(entry.sample);
  const sample = sampleInfoFrom(id, samples[id], rawSample);
  const rawScores = dict(entry.scores);
  const scores: Scores =
    rawScores !== null
      ? {
          maturity: num(rawScores.maturity) ?? 3,
          usability: num(rawScores.usability) ?? 3,
          audioQuality: num(rawScores.audioQuality) ?? 3,
          docs: num(rawScores.docs) ?? 3,
          windows: num(rawScores.windows) ?? 3,
          activity: num(rawScores.activity) ?? 3,
        }
      : baseScores(stars, pushedAt, language, installComplexity, windows, bool(entry.hasReadme) ?? true);

  return {
    id,
    owner,
    repo: repoName,
    url,
    homepage: str(entry.homepage),
    stars,
    forks: num(entry.forks, entry.forks_count),
    license: str(entry.license),
    language,
    createdAt,
    updatedAt: str(entry.updatedAt, entry.updated_at),
    pushedAt,
    descriptionZh: description,
    category,
    soundTypes,
    techStack: list(entry.techStack, entry.tech_stack, entry.topics),
    outputFormats: list(entry.outputFormats, entry.formats, entry.outputFormatsZh),
    gpuAcceleration: gpu,
    cliHeadless: cli,
    windowsSupport: windows,
    installComplexity,
    batchable,
    realtime: false,
    scores,
    pros: list(entry.pros),
    cons: list(entry.cons),
    bestFor: str(entry.bestFor, entry.bestForZh) ?? '',
    pitfalls: list(entry.pitfalls),
    tags: list(entry.tags, entry.topics),
    alternatives: list(entry.alternatives),
    signatureZh: str(entry.signatureZh, sample.signatureZh),
    chooseWhenZh: str(entry.chooseWhenZh, sample.chooseWhenZh),
    avoidWhenZh: str(entry.avoidWhenZh, entry.whenNotZh),
    contrastWith: list(entry.contrastWith, sample.contrastWith),
    sample,
    ...(str(entry.localPath) ? { localPath: str(entry.localPath) as string } : {}),
    ...(str(entry.source) ? { source: str(entry.source) as string } : {}),
  };
}

/** 为占位数据补一条可解释的决策行（真数据字段优先，缺失才用这句）。 */
export function enrichDecision(repo: Repo): Repo {
  if (repo.signatureZh && repo.chooseWhenZh) return repo;
  const signature =
    repo.signatureZh ??
    `${repo.soundTypes[0] ?? '音频'}方向的「${repo.category}」，${repo.language ?? '多语言'}生态，${repo.stars >= 1000 ? '社区规模较大' : '体量较小'}。`;
  const choose =
    repo.chooseWhenZh ??
    (repo.gpuAcceleration === 'none' && repo.windowsSupport === 'works'
      ? '要在 Windows 本机快速跑起来、且不想被 GPU 卡住时，优先试它。'
      : null);
  const avoid =
    repo.avoidWhenZh ??
    (repo.gpuAcceleration === 'required'
      ? '没有独立显卡、或者只想双击开箱即用时先别选它。'
      : null);
  return {
    ...repo,
    signatureZh: signature,
    chooseWhenZh: choose,
    avoidWhenZh: avoid,
  };
}

/* ------------------------------------------------------------------ 档案 */

function adaptUseCases(value: unknown): RepoDetail['useCases'] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const entry = dict(item);
    if (!entry) return [];
    return [
      {
        scenarioZh: str(entry.scenarioZh, entry.scenario) ?? '',
        whoZh: str(entry.whoZh, entry.who) ?? '',
        whyZh: str(entry.whyZh, entry.why) ?? '',
        deliverableZh: str(entry.deliverableZh, entry.deliverable) ?? '',
        fit: str(entry.fit) ?? '',
      },
    ];
  });
}

function adaptWhatItMakes(value: unknown): RepoDetail['whatItMakes'] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const entry = dict(item);
    if (!entry) return [];
    return [
      {
        type: str(entry.type, entry.nameZh, entry.name) ?? '',
        exampleZh: str(entry.exampleZh, entry.example) ?? '',
        strength: str(entry.strength) ?? '',
      },
    ];
  });
}

function adaptWorkflow(value: unknown): RepoDetail['workflow'] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const entry = dict(item);
    if (!entry) return [];
    return [
      {
        stepZh: str(entry.stepZh, entry.step) ?? '',
        detailZh: str(entry.detailZh, entry.detail) ?? '',
        effortZh: str(entry.effortZh, entry.effort) ?? '',
      },
    ];
  });
}

function adaptCompareTips(value: unknown): RepoDetail['compareTips'] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const entry = dict(item);
    if (!entry) return [];
    return [{ vs: str(entry.vs) ?? '', adviceZh: str(entry.adviceZh, entry.advice, entry.whenZh) ?? '' }];
  });
}

function adaptEvidence(value: unknown): RepoDetail['evidence'] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const entry = dict(item);
    if (!entry) return [];
    return [
      {
        field: str(entry.field) ?? '',
        source: str(entry.source, entry.sourcePath) ?? '',
        noteZh: str(entry.noteZh, entry.note) ?? '',
      },
    ];
  });
}

export function adaptDetail(id: string, raw: unknown): RepoDetail | null {
  const entry = dict(raw);
  if (!entry) return null;
  const capabilities = dict(entry.capabilities);
  return {
    id,
    taglineZh: str(entry.taglineZh, entry.tagline) ?? '',
    summaryZh: str(entry.summaryZh, entry.summary) ?? '',
    whatItMakes: adaptWhatItMakes(entry.whatItMakes),
    useCases: adaptUseCases(entry.useCases),
    capabilities: {
      maxDurationZh: str(capabilities?.maxDurationZh) ?? '',
      formatsZh: list(capabilities?.formatsZh, capabilities?.exportFormatsZh),
      sampleRateZh: str(capabilities?.sampleRateZh) ?? '',
      realtimeZh: str(capabilities?.realtimeZh) ?? '',
      batchZh: str(capabilities?.batchZh) ?? '',
      platformZh: str(capabilities?.platformZh) ?? '',
    },
    ceilingZh: str(entry.ceilingZh, entry.ceilingsZh, entry.ceiling) ?? '',
    workflow: adaptWorkflow(entry.workflow),
    differentiators: list(entry.differentiators),
    limits: list(entry.limits, entry.limitsZh),
    compareTips: adaptCompareTips(entry.compareTips),
    evidence: adaptEvidence(entry.evidence),
    blockerZh: str(entry.blockerZh),
    whatItWouldNeedZh: str(entry.whatItWouldNeed, entry.whatItWouldNeedZh),
    signatureZh: str(entry.signatureZh),
    chooseWhenZh: str(entry.chooseWhenZh),
    avoidWhenZh: str(entry.avoidWhenZh),
    contrastWith: list(entry.contrastWith),
  };
}

/* ------------------------------------------------------------------ 数据集 */

export function buildDataset(
  payload: unknown,
  kind: 'repos' | 'manifest',
  samples: Record<string, RawSampleEntry> = {},
): Dataset {
  const container = dict(payload);
  const rawList: unknown[] = Array.isArray(payload)
    ? payload
    : Array.isArray(container?.repos)
      ? (container.repos as unknown[])
      : [];
  const meta = (container?.meta as DatasetMeta | undefined) ?? {
    title: kind === 'manifest' ? '占位数据（manifest.json）' : '音效/音乐开源项目',
    generatedAt: new Date().toISOString(),
    note: kind === 'manifest' ? '由 manifest.json 归一化的临时数据' : undefined,
  };
  const repos: Repo[] = [];
  rawList.forEach((item, index) => {
    const repo = adaptRepo(item, index, samples);
    if (repo) repos.push(repo);
  });
  return { meta, repos };
}

export function adaptDataset(
  payload: unknown,
  kind: 'repos' | 'manifest',
  samples: Record<string, RawSampleEntry>,
  rawDetails: Record<string, unknown>,
): AdaptedDataset {
  const dataset = buildDataset(payload, kind, samples);
  dataset.repos = dataset.repos.map((repo) => enrichDecision(repo));
  const details: Record<string, RepoDetail> = {};
  for (const [id, raw] of Object.entries(rawDetails)) {
    const detail = adaptDetail(id, raw);
    if (detail) details[id] = detail;
  }
  // 档案层的「为什么出不了样」回填到样例上；无样例但有明确阻断时按「做不了」展示。
  dataset.repos = dataset.repos.map((repo) => {
    const detail = details[repo.id];
    if (!detail) return repo;
    const blockerZh = repo.sample.blockerZh ?? detail.blockerZh ?? null;
    const realtime = /可实时|支持实时|实时低延迟/.test(detail.capabilities.realtimeZh);
    const status =
      repo.sample.status === 'missing' && blockerZh ? 'failed' : repo.sample.status;
    return {
      ...repo,
      realtime,
      sample: {
        ...repo.sample,
        status,
        blockerZh,
        whatItWouldNeedZh: repo.sample.whatItWouldNeedZh ?? detail.whatItWouldNeedZh ?? null,
        noteZh:
          status === 'failed' && repo.sample.status === 'missing'
            ? '样例做不出来：本机条件下没有产出可验收音频。'
            : repo.sample.noteZh,
      },
    };
  });
  return { dataset, details, samples };
}
