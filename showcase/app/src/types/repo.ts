/**
 * 音效/音乐开源项目的数据契约。
 *
 * 真实数据来自 `showcase/data/repos.json`；数据未就绪时由 `manifest.json`
 * 经 `src/data/adapter.ts` 归一化，字段语义保持一致，UI 不需要区分来源。
 */

export type GpuRequirement = 'required' | 'optional' | 'none' | 'unknown';
export type CliSupport = 'yes' | 'partial' | 'no' | 'unknown';
export type WindowsSupport = 'works' | 'workaround' | 'broken' | 'unknown';
export type Batchable = 'yes' | 'partial' | 'no' | 'unknown';
export type SampleStatus = 'ok' | 'failed' | 'skipped' | 'missing' | 'unknown';

export interface Scores {
  maturity: number;
  usability: number;
  audioQuality: number;
  docs: number;
  windows: number;
  activity: number;
}

/** 一段 15–30 秒样例里「这段在演示什么」。 */
export interface SampleSegment {
  startSec: number;
  endSec: number;
  capZh: string;
}

export interface SampleSpec {
  durationSec: number;
  sampleRate?: number;
  channels?: number;
  codec?: string;
  bytes?: number;
}

export interface SampleInfo {
  status: SampleStatus;
  /** 相对 F:\coding音乐 的路径，如 `_samples/<id>/sample.wav`。 */
  audioPath: string | null;
  waveformPath: string | null;
  spectrogramPath: string | null;
  durationSec: number | null;
  spec: SampleSpec | null;
  noteZh: string;
  segments: SampleSegment[];
  /** 样例覆盖的能力点（样例 meta 自带）。 */
  capabilitiesZh: string[];
  signatureZh: string | null;
  chooseWhenZh: string | null;
  contrastWith: string[];
  limitsZh: string | null;
  evidenceZh: string | null;
  verifyLogZh: string | null;
  /** 出样链路：official / wrapper / manual / none。 */
  pipeline: string;
  /** 出样失败/跳过时，页面要回答「为什么做不了」。 */
  blockerZh: string | null;
  /** 要补什么条件才可能出样。 */
  whatItWouldNeedZh: string | null;
}

export interface Repo {
  id: string;
  owner: string;
  repo: string;
  url: string;
  homepage: string | null;
  stars: number;
  forks: number | null;
  license: string | null;
  language: string | null;
  createdAt: string;
  updatedAt: string | null;
  pushedAt: string;
  descriptionZh: string;
  category: string;
  /** 声音类型：纯合成 / 采样乐器 / 神经网络生成 / 环境音 / 语音 / 可视化 / 处理与转码。 */
  soundTypes: string[];
  techStack: string[];
  outputFormats: string[];
  gpuAcceleration: GpuRequirement;
  cliHeadless: CliSupport;
  windowsSupport: WindowsSupport;
  installComplexity: number;
  batchable: Batchable;
  /** 是否以实时交互为主要使用方式（由档案 capabilities.realtimeZh 派生）。 */
  realtime: boolean;
  scores: Scores;
  pros: string[];
  cons: string[];
  bestFor: string;
  pitfalls: string[];
  tags: string[];
  alternatives: string[];
  /** 「一耳朵是什么」——决策行第一句。 */
  signatureZh: string | null;
  /** 「什么时候选它」。 */
  chooseWhenZh: string | null;
  /** 「什么时候别选它」。 */
  avoidWhenZh: string | null;
  /** 与之形成对照的仓库 id（A/B 试听的默认候选）。 */
  contrastWith: string[];
  sample: SampleInfo;
  localPath?: string;
  source?: string;
}

export interface DatasetMeta {
  title?: string;
  generatedAt?: string;
  note?: string;
  [key: string]: unknown;
}

export interface Dataset {
  meta: DatasetMeta;
  repos: Repo[];
}

/* ================================================================
   深度档案：与 ..\data\details\<id>.json 对齐（字段全部可选，缺失即降级）
   ================================================================ */

export interface WhatItMakesItem {
  type: string;
  exampleZh: string;
  strength: string;
}

export interface UseCaseItem {
  scenarioZh: string;
  whoZh: string;
  whyZh: string;
  deliverableZh: string;
  fit: string;
}

export interface DetailCapabilities {
  maxDurationZh: string;
  formatsZh: string[];
  sampleRateZh: string;
  realtimeZh: string;
  batchZh: string;
  platformZh: string;
}

export interface WorkflowStep {
  stepZh: string;
  detailZh: string;
  effortZh: string;
}

export interface CompareTip {
  vs: string;
  adviceZh: string;
}

export interface DetailEvidence {
  field: string;
  source: string;
  noteZh: string;
}

export interface RepoDetail {
  id: string;
  taglineZh: string;
  summaryZh: string;
  whatItMakes: WhatItMakesItem[];
  useCases: UseCaseItem[];
  capabilities: DetailCapabilities;
  ceilingZh: string;
  workflow: WorkflowStep[];
  differentiators: string[];
  limits: string[];
  compareTips: CompareTip[];
  evidence: DetailEvidence[];
  /** 为什么这台机器出不了样（档案层，样例 meta 缺失时回填给卡片/详情）。 */
  blockerZh?: string | null;
  /** 补齐什么条件才可能出样。 */
  whatItWouldNeedZh?: string | null;
  signatureZh?: string | null;
  chooseWhenZh?: string | null;
  avoidWhenZh?: string | null;
  contrastWith?: string[];
}

/** 详情页运行时档案：缺失时由基础字段合成回退档案。 */
export interface DetailRecord extends RepoDetail {
  isFallback: boolean;
}

export type ViewKey = 'home' | 'scenario' | 'matrix' | 'detail' | 'ab';

export type SortKey =
  | 'name'
  | 'stars'
  | 'updated'
  | 'category'
  | 'language'
  | 'platform'
  | 'gpu'
  | 'cli'
  | 'install'
  | 'duration'
  | 'sample'
  | 'overall';

export type SortDirection = 'asc' | 'desc';
export type TriState = 'all' | 'yes' | 'no';

export interface FilterState {
  q: string;
  categories: string[];
  soundTypes: string[];
  languages: string[];
  licenses: string[];
  platforms: TriState;
  gpu: TriState;
  sampleReady: TriState;
}

export interface RouteState {
  view: ViewKey;
  repoId: string | null;
  scenarioId: string | null;
  /** 从哪个视图进入详情，返回时保留上下文。 */
  fromView: ViewKey | null;
  filters: FilterState;
  sortKey: SortKey;
  sortDir: SortDirection;
  /** A/B 试听的候选（最多 2 个）。 */
  selected: string[];
  abIds: [string | null, string | null];
}
