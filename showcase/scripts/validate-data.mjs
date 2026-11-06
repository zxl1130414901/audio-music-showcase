#!/usr/bin/env node
/**
 * 校验 F:\coding音乐\showcase\data 下四份数据文件。
 * 用法：node showcase/scripts/validate-data.mjs
 * 退出码：0 全部通过；1 存在 ERROR。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(__dirname, '..', 'data');
const ROOT = path.resolve(DATA, '..', '..');

const errors = [];
const warns = [];
const push = (list, msg) => list.push(msg);

function readJson(file) {
  if (!fs.existsSync(file)) {
    errors.push(`缺少文件: ${path.relative(ROOT, file)}`);
    return null;
  }
  let raw = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  try {
    return JSON.parse(raw);
  } catch (e) {
    errors.push(`JSON 解析失败 ${path.relative(ROOT, file)}: ${e.message}`);
    return null;
  }
}

const manifest = readJson(path.join(ROOT, 'manifest.json'));
const reposDoc = readJson(path.join(DATA, 'repos.json'));
const evidenceDoc = readJson(path.join(DATA, 'evidence.json'));
const discovery = readJson(path.join(DATA, 'discovery.json'));

const manifestIds = new Set((manifest || []).map((r) => `${r.owner}__${r.repo}`));
const manifestById = new Map((manifest || []).map((r) => [`${r.owner}__${r.repo}`, r]));

const repoList = reposDoc?.repos || [];
const repoIds = repoList.map((r) => r.id);
const repoIdSet = new Set(repoIds);

/* ---------------- repos.json ---------------- */
const REPO_FIELDS = [
  'id', 'owner', 'repo', 'name', 'localDir', 'url', 'homepage', 'stars', 'forks', 'openIssues',
  'license', 'language', 'createdAt', 'pushedAt', 'updatedAt', 'descriptionZh', 'category',
  'techStack', 'tags', 'scores', 'pros', 'cons', 'bestFor', 'pitfalls', 'alternatives',
  'installComplexity', 'windowsTier', 'renderBackends', 'outputFormats', 'sample', 'tokenRequired',
];
const SCORE_KEYS = ['capability', 'usability', 'performance', 'audioQuality', 'docs', 'ecosystem'];
const CATEGORIES = new Set([
  '音乐生成', '音效生成', 'TTS', '语音分离', '语音处理', '音频分析', 'DSP库',
  '合成器', 'tracker', '音频编辑', '可视化', '音频框架', '模型工具链',
]);
const WINDOWS_TIERS = new Set(['works', 'workaround', 'broken', 'unknown']);
const SOUND_TYPES = new Set(['神经网络生成', '采样乐器', '纯合成', '环境音', '语音', '可视化', '处理与转码', '分析']);
const dateOnly = (v) => (v ? String(v).slice(0, 10) : null);

if (repoList.length !== 56) errors.push(`repos.json 应为 56 条，实际 ${repoList.length}`);
if (new Set(repoIds).size !== repoIds.length) errors.push('repos.json 存在重复 id');
for (const id of manifestIds) if (!repoIdSet.has(id)) errors.push(`manifest 仓库未覆盖: ${id}`);
for (const id of repoIdSet) if (!manifestIds.has(id)) errors.push(`repos.json 出现 manifest 外 id: ${id}`);

const sampleStats = { ok: 0, skipped: 0, failed: 0 };

for (const r of repoList) {
  const miss = REPO_FIELDS.filter((f) => !(f in r));
  if (miss.length) push(errors, `${r.id}: 缺字段 ${miss.join(',')}`);
  if (r.id !== `${r.owner}__${r.repo}`) push(errors, `${r.id}: id 与 owner__repo 不一致`);
  if (r.name !== r.repo) push(errors, `${r.id}: name 必须等于 repo`);
  if (r.localDir !== r.id) push(errors, `${r.id}: localDir 必须等于 id`);
  if (!r.url.startsWith('https://github.com/')) push(errors, `${r.id}: url 非法`);
  if (r.homepage !== null && !/^https?:\/\//.test(r.homepage)) push(errors, `${r.id}: homepage 非 null 但不是合法 URL`);
  if (r.openIssues !== null) push(warns, `${r.id}: openIssues 非 null（manifest 无此字段）`);
  if (!CATEGORIES.has(r.category)) push(errors, `${r.id}: category 非法 ${r.category}`);
  if (!WINDOWS_TIERS.has(r.windowsTier)) push(errors, `${r.id}: windowsTier 非法 ${r.windowsTier}`);
  if (!Number.isInteger(r.installComplexity) || r.installComplexity < 1 || r.installComplexity > 5)
    push(errors, `${r.id}: installComplexity 应为 1–5 整数`);
  if (typeof r.descriptionZh !== 'string' || r.descriptionZh.length > 40)
    push(errors, `${r.id}: descriptionZh 缺失或超过 40 字`);
  if (!Array.isArray(r.pros) || r.pros.length < 3 || r.pros.length > 5)
    push(errors, `${r.id}: pros 需 3–5 条`);
  if (!Array.isArray(r.cons) || r.cons.length < 2 || r.cons.length > 4)
    push(errors, `${r.id}: cons 需 2–4 条`);
  if (!Array.isArray(r.pitfalls) || r.pitfalls.length < 1 || r.pitfalls.length > 3)
    push(errors, `${r.id}: pitfalls 需 1–3 条`);
  if (!Array.isArray(r.tags) || r.tags.length < 3) push(errors, `${r.id}: tags 至少 3 个`);
  if (!Array.isArray(r.techStack) || r.techStack.length < 2) push(errors, `${r.id}: techStack 至少 2 项`);
  if (!Array.isArray(r.renderBackends) || !r.renderBackends.length) push(errors, `${r.id}: renderBackends 为空`);
  if (!Array.isArray(r.outputFormats) || !r.outputFormats.length) push(errors, `${r.id}: outputFormats 为空`);
  if (!r.scores || typeof r.scores !== 'object') push(errors, `${r.id}: scores 缺失`);
  else for (const k of SCORE_KEYS) {
    if (!Number.isInteger(r.scores[k]) || r.scores[k] < 1 || r.scores[k] > 5)
      push(errors, `${r.id}: scores.${k} 应为 1–5 整数`);
  }
const SAMPLE_STATUS = new Set(['ok', 'skipped', 'failed']);
const SAMPLE_DIR = path.join(ROOT, '_samples');

function readSampleMeta(id) {
  const file = path.join(SAMPLE_DIR, id, 'meta.json');
  if (!fs.existsSync(file)) {
    errors.push(`_samples/${id}: 缺 meta.json`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
  } catch (e) {
    errors.push(`_samples/${id}/meta.json 解析失败: ${e.message}`);
    return null;
  }
}

const validateSample = (r) => {
  const meta = readSampleMeta(r.id);
  const s = r.sample || {};
  if (!SAMPLE_STATUS.has(s.status)) {
    push(errors, `${r.id}: sample.status 非法 ${s.status}（只允许 ok|skipped|failed）`);
    return;
  }
  sampleStats[s.status] += 1;
  if (meta && meta.status !== s.status)
    push(errors, `${r.id}: sample.status=${s.status} 与 meta.json=${meta.status} 不一致`);

  if (s.status === 'ok') {
    if (typeof s.audioPath !== 'string' || !fs.existsSync(path.join(ROOT, s.audioPath)))
      push(errors, `${r.id}: ok 但 audioPath 不存在 ${s.audioPath}`);
    if (!s.spec || typeof s.spec !== 'object') push(errors, `${r.id}: ok 但 spec 缺失`);
    else {
      if (s.spec.sampleRate !== 44100) push(errors, `${r.id}: 采样率应为 44100，实际 ${s.spec.sampleRate}`);
      if (!(typeof s.spec.durationSec === 'number' && s.spec.durationSec > 0))
        push(errors, `${r.id}: spec.durationSec 非法`);
      if (!Number.isInteger(s.spec.channels)) push(errors, `${r.id}: spec.channels 非法`);
    }
    if (!(typeof s.durationSec === 'number' && s.durationSec > 0))
      push(errors, `${r.id}: ok 但 durationSec 非法`);
    if (!Array.isArray(s.segments) || !s.segments.length) push(errors, `${r.id}: ok 但 segments 为空`);
    if (s.blockerZh !== null) push(errors, `${r.id}: ok 的 blockerZh 应为 null`);
    for (const seg of s.segments || []) {
      if (typeof seg.startSec !== 'number' || typeof seg.endSec !== 'number' || !seg.capZh)
        push(errors, `${r.id}: segments 项字段非法`);
    }
  } else {
    if (s.audioPath !== null) push(errors, `${r.id}: ${s.status} 的 audioPath 应为 null`);
    if (typeof s.blockerZh !== 'string' || !s.blockerZh.trim())
      push(errors, `${r.id}: ${s.status} 缺 blockerZh`);
    if (typeof s.whatItWouldNeedZh !== 'string' || !s.whatItWouldNeedZh.trim())
      push(errors, `${r.id}: ${s.status} 缺 whatItWouldNeedZh`);
  }

  const detailFile = path.join(DATA, 'details', `${r.id}.json`);
  if (fs.existsSync(detailFile)) {
    const d = JSON.parse(fs.readFileSync(detailFile, 'utf8').replace(/^\uFEFF/, ''));
    const norm = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);
    if (norm(d.blockerZh) !== norm(s.blockerZh))
      push(errors, `${r.id}: details.blockerZh 与 sample.blockerZh 不一致`);
    if (norm(d.whatItWouldNeed) !== norm(s.whatItWouldNeedZh))
      push(errors, `${r.id}: details.whatItWouldNeed 与 sample.whatItWouldNeedZh 不一致`);
  }
};
validateSample(r);
  for (const alt of r.alternatives || []) {
    if (alt === r.id) push(errors, `${r.id}: alternatives 不能指向自己`);
    else if (!manifestIds.has(alt)) push(errors, `${r.id}: alternatives 引用不存在的 id ${alt}`);
  }
  if (!Array.isArray(r.alternatives) || r.alternatives.length < 2)
    push(errors, `${r.id}: alternatives 至少 2 个`);
  if (!r.bestFor || typeof r.bestFor !== 'string') push(errors, `${r.id}: bestFor 缺失`);

  // 展示站 adapter 兼容字段
  if (r.windowsSupport !== r.windowsTier) push(errors, `${r.id}: windowsSupport 必须等于 windowsTier`);
  if (!['required', 'optional', 'none', 'unknown'].includes(r.gpuAcceleration))
    push(errors, `${r.id}: gpuAcceleration 非法 ${r.gpuAcceleration}`);
  if (!['yes', 'partial', 'no', 'unknown'].includes(r.cliHeadless))
    push(errors, `${r.id}: cliHeadless 非法 ${r.cliHeadless}`);
  if (!['yes', 'partial', 'no', 'unknown'].includes(r.batchable))
    push(errors, `${r.id}: batchable 非法 ${r.batchable}`);
  if (typeof r.tokenRequired !== 'boolean')
    push(errors, `${r.id}: tokenRequired 必须为布尔值`);
  if (!Array.isArray(r.soundTypes) || !r.soundTypes.length)
    push(errors, `${r.id}: soundTypes 为空`);
  for (const s of r.soundTypes || []) if (!SOUND_TYPES.has(s)) push(errors, `${r.id}: soundTypes 非法 ${s}`);
  for (const k of ['maturity', 'windows', 'activity']) {
    if (typeof r.scores?.[k] !== 'number' || r.scores[k] < 1 || r.scores[k] > 5)
      push(errors, `${r.id}: scores.${k} 派生值缺失或越界`);
  }
  if (!r.signatureZh || !r.chooseWhenZh) push(errors, `${r.id}: signatureZh/chooseWhenZh 为空`);
  if (!Array.isArray(r.contrastWith) || !r.contrastWith.length) push(errors, `${r.id}: contrastWith 为空`);
  for (const c of r.contrastWith || []) if (!manifestIds.has(c)) push(errors, `${r.id}: contrastWith 引用不存在 ${c}`);

  const m = manifestById.get(r.id);
  if (m) {
    if (r.stars !== m.stars) push(errors, `${r.id}: stars=${r.stars} 与 manifest ${m.stars} 不符`);
    if (r.forks !== m.forks) push(errors, `${r.id}: forks=${r.forks} 与 manifest ${m.forks} 不符`);
    if (r.license !== m.license) push(errors, `${r.id}: license=${r.license} 与 manifest ${m.license} 不符`);
    if (r.language !== m.language) push(errors, `${r.id}: language=${r.language} 与 manifest ${m.language} 不符`);
    if (r.createdAt !== dateOnly(m.created_at)) push(errors, `${r.id}: createdAt 与 manifest 不符`);
    if (r.pushedAt !== dateOnly(m.pushed_at)) push(errors, `${r.id}: pushedAt 与 manifest 不符`);
    if (r.updatedAt !== dateOnly(m.updated_at)) push(errors, `${r.id}: updatedAt 与 manifest 不符`);
  }
}

const gatedIds = new Set(repoList.filter((r) => r.tokenRequired === true).map((r) => r.id));

/* ---------------- details ---------------- */
const detailsDir = path.join(DATA, 'details');
const detailFiles = fs.existsSync(detailsDir) ? fs.readdirSync(detailsDir).filter((f) => f.endsWith('.json')) : [];
const detailIds = detailFiles.map((f) => f.replace(/\.json$/, ''));
if (detailIds.length !== 56) errors.push(`details 应为 56 份，实际 ${detailIds.length}`);
for (const id of repoIds) if (!detailIds.includes(id)) errors.push(`details 缺少 ${id}.json`);
for (const id of detailIds) if (!repoIdSet.has(id)) errors.push(`details 存在多余文件 ${id}.json`);

const DETAIL_FIELDS = [
  'id', 'taglineZh', 'summaryZh', 'whatItMakes', 'useCases', 'featureCallouts',
  'ceilingsZh', 'workflowZh', 'workflow', 'compareTips', 'evidence', 'blockerZh', 'whatItWouldNeed',
];
const STRENGTHS = new Set(['核心能力', '进阶能力', '辅助能力', '附加能力', '特色能力', '扩展能力', '可用', '有限', '未交付']);
const FITS = new Set(['适合', '勉强', '不适合']);

for (const id of detailIds) {
  const d = readJson(path.join(detailsDir, `${id}.json`));
  if (!d) continue;
  for (const f of DETAIL_FIELDS) if (!(f in d)) errors.push(`details/${id}: 缺字段 ${f}`);
  if (d.id !== id) errors.push(`details/${id}: id 字段不一致`);
  const len = (s) => (typeof s === 'string' ? [...s].length : 0);
  if (len(d.taglineZh) < 20 || len(d.taglineZh) > 30) errors.push(`details/${id}: taglineZh 需 20–30 字（现 ${len(d.taglineZh)}）`);
  if (len(d.summaryZh) < 150 || len(d.summaryZh) > 250) errors.push(`details/${id}: summaryZh 需 150–250 字（现 ${len(d.summaryZh)}）`);
  if (len(d.ceilingsZh) < 200 || len(d.ceilingsZh) > 350) errors.push(`details/${id}: ceilingsZh 需 200–350 字（现 ${len(d.ceilingsZh)}）`);
  if (!Array.isArray(d.whatItMakes) || d.whatItMakes.length < 3) errors.push(`details/${id}: whatItMakes < 3`);
  for (const w of d.whatItMakes || []) {
    if (!w.type || !w.exampleZh || !STRENGTHS.has(w.strength)) errors.push(`details/${id}: whatItMakes 项字段/枚举非法`);
  }
  if (!Array.isArray(d.useCases) || d.useCases.length < 4) errors.push(`details/${id}: useCases < 4`);
  for (const u of d.useCases || []) {
    if (!u.scenarioZh || !u.whoZh || !u.whyZh || !u.deliverableZh || !FITS.has(u.fit))
      errors.push(`details/${id}: useCases 项字段/枚举非法`);
  }
  if (!Array.isArray(d.featureCallouts) || d.featureCallouts.length < 4) errors.push(`details/${id}: featureCallouts < 4`);
  for (const c of d.featureCallouts || []) {
    if (!c.titleZh || !c.descZh) errors.push(`details/${id}: featureCallouts 项缺字段`);
    else {
      if (len(c.titleZh) < 4 || len(c.titleZh) > 8) errors.push(`details/${id}: featureCallouts 标题需 4–8 字: ${c.titleZh}`);
      if (len(c.descZh) < 8 || len(c.descZh) > 25) errors.push(`details/${id}: featureCallouts 说明需 8–25 字: ${c.descZh}`);
    }
  }
  if (!Array.isArray(d.workflow) || d.workflow.length < 3) errors.push(`details/${id}: workflow < 3 步`);
  if (typeof d.workflowZh !== 'string' || len(d.workflowZh) < 10) errors.push(`details/${id}: workflowZh 缺失或过短`);
  if (!Array.isArray(d.compareTips) || d.compareTips.length < 2) errors.push(`details/${id}: compareTips < 2`);
  for (const t of d.compareTips || []) {
    if (!manifestIds.has(t.vs)) errors.push(`details/${id}: compareTips.vs 不存在 ${t.vs}`);
    if (t.vs === id) errors.push(`details/${id}: compareTips.vs 指向自己`);
    if (!t.whenZh) errors.push(`details/${id}: compareTips 缺 whenZh`);
    if (!t.adviceZh) errors.push(`details/${id}: compareTips 缺 adviceZh（展示站兼容）`);
  }
  // 展示站详情页兼容字段
  if (d.ceilingZh !== d.ceilingsZh) errors.push(`details/${id}: ceilingZh 必须与 ceilingsZh 一致`);
  if (!d.capabilities || typeof d.capabilities !== 'object') errors.push(`details/${id}: capabilities 缺失`);
  else for (const k of ['maxDurationZh', 'sampleRateZh', 'realtimeZh', 'platformZh']) {
    if (!d.capabilities[k]) errors.push(`details/${id}: capabilities.${k} 缺失`);
  }
  if (!Array.isArray(d.differentiators) || d.differentiators.length < 4) errors.push(`details/${id}: differentiators < 4`);
  if (!Array.isArray(d.limits) || d.limits.length < 2) errors.push(`details/${id}: limits < 2`);
  if (!Array.isArray(d.contrastWith) || !d.contrastWith.length) errors.push(`details/${id}: contrastWith 为空`);
  for (const c of d.contrastWith || []) if (!manifestIds.has(c)) errors.push(`details/${id}: contrastWith 引用不存在 ${c}`);
  if (!Array.isArray(d.evidence) || d.evidence.length < 3) errors.push(`details/${id}: evidence < 3`);
  for (const e of d.evidence || []) {
    if (!e.field || !e.source || !e.noteZh) errors.push(`details/${id}: evidence 项字段缺失`);
    const srcFile = String(e.source).split('#')[0];
    const abs = path.join(ROOT, id, srcFile);
    if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) errors.push(`details/${id}: evidence 路径不存在或不是文件 ${e.source}`);
  }
  if (d.blockerZh !== null && typeof d.blockerZh !== 'string') errors.push(`details/${id}: blockerZh 应为 string|null`);
  if (d.whatItWouldNeed !== null && typeof d.whatItWouldNeed !== 'string') errors.push(`details/${id}: whatItWouldNeed 应为 string|null`);
  const breaking = repoList.find((x) => x.id === id)?.windowsTier === 'broken';
  if (breaking && !d.blockerZh) warns.push(`details/${id}: windowsTier=broken 但 blockerZh 为 null`);
}

/* ---------------- evidence.json ---------------- */
const evList = evidenceDoc?.repos || [];
if (evList.length !== 56) errors.push(`evidence.json 应为 56 条，实际 ${evList.length}`);
const evById = new Map(evList.map((e) => [e.id, e]));
for (const r of repoList) {
  const e = evById.get(r.id);
  if (!e) { errors.push(`evidence 缺少 ${r.id}`); continue; }
  if (!Array.isArray(e.filesRead) || e.filesRead.length < 2) errors.push(`evidence/${r.id}: filesRead 至少 2 个`);
  if (!Array.isArray(e.claims)) { errors.push(`evidence/${r.id}: claims 缺失`); continue; }
  const targetSet = new Set(e.claims.map((c) => c.target));
  r.pros.forEach((_, i) => { if (!targetSet.has(`pros[${i}]`)) errors.push(`evidence/${r.id}: 缺 pros[${i}] claim`); });
  r.cons.forEach((_, i) => { if (!targetSet.has(`cons[${i}]`)) errors.push(`evidence/${r.id}: 缺 cons[${i}] claim`); });
  for (const c of e.claims) {
    if (!c.source || !c.quote) errors.push(`evidence/${r.id}: claim 缺 source/quote (${c.target})`);
    const srcFile = String(c.source).split('#')[0];
    const abs = path.join(ROOT, r.id, srcFile);
    if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) errors.push(`evidence/${r.id}: source 不存在或不是文件 ${c.source}`);
    if ([...String(c.quote)].length > 120) warns.push(`evidence/${r.id}: quote 超过 120 字 (${c.target})`);
  }
}

/* ---------------- discovery.json ---------------- */
if (!discovery) push(errors, 'discovery.json 无法读取');
else {
  const sc = discovery.scenarios || [];
  if (sc.length < 8 || sc.length > 12) errors.push(`discovery: 场景应 8–12 个，实际 ${sc.length}`);
  for (const s of sc) {
    if (!s.id || !s.titleZh || !s.descZh || !s.questionZh) errors.push(`discovery/${s.id}: 基本信息缺失`);
    if (!manifestIds.has(s.first)) errors.push(`discovery/${s.id}: first 不存在 ${s.first}`);
    if (gatedIds.has(s.first)) errors.push(`discovery/${s.id}: first 不能是需要 HF Token 的 gated 仓库 ${s.first}`);
    if (!s.whyZh) errors.push(`discovery/${s.id}: 缺 whyZh`);
    if (!Array.isArray(s.alternatives) || s.alternatives.length < 1) errors.push(`discovery/${s.id}: 备选不足`);
    for (const a of s.alternatives || []) {
      if (!manifestIds.has(a.repoId)) errors.push(`discovery/${s.id}: 备选不存在 ${a.repoId}`);
      if (a.repoId === s.first) errors.push(`discovery/${s.id}: 备选与 first 重复`);
      if (!a.whyZh) errors.push(`discovery/${s.id}: 备选缺 whyZh`);
      if (gatedIds.has(a.repoId) && !/Token|gated/i.test(a.whyZh))
        warns.push(`discovery/${s.id}: 备选 ${a.repoId} 需 Token，whyZh 未写明`);
    }
    // 展示站场景卡片兼容结构
    if (!Array.isArray(s.recommended) || s.recommended.length !== (s.alternatives?.length || 0) + 1)
      errors.push(`discovery/${s.id}: recommended 数量应为 first+备选`);
    else {
      if (s.recommended[0]?.repoId !== s.first || s.recommended[0]?.verdict !== 'first')
        errors.push(`discovery/${s.id}: recommended[0] 必须为 first`);
      for (const rec of s.recommended) {
        if (!rec.timeZh || !rec.whyZh) errors.push(`discovery/${s.id}: recommended 缺 timeZh/whyZh`);
      }
    }
    if (!s.filters || !Array.isArray(s.filters.categories) || !s.filters.categories.length)
      errors.push(`discovery/${s.id}: filters.categories 缺失`);
    for (const st of s.filters?.soundTypes || []) if (!SOUND_TYPES.has(st)) errors.push(`discovery/${s.id}: soundTypes 非法 ${st}`);
  }
  if (!Array.isArray(discovery.constraints) || discovery.constraints.length < 4)
    errors.push('discovery: constraints 至少 4 条');
  for (const c of discovery.constraints || []) {
    if (!c.id || !c.titleZh || !c.descZh || !Array.isArray(c.fits)) errors.push(`discovery/constraint ${c.id}: 字段缺失`);
    for (const id of c.fits || []) {
      if (!manifestIds.has(id)) errors.push(`discovery/constraint ${c.id}: 引用不存在 id ${id}`);
      if (gatedIds.has(id)) errors.push(`discovery/constraint ${c.id}: 需 Token 的 ${id} 不能作为「本机可跑」`);
    }
    if (!c.apply || !c.apply.field || !c.apply.op) errors.push(`discovery/constraint ${c.id}: apply 缺失`);
  }
  if (!Array.isArray(discovery.quickPicks) || discovery.quickPicks.length < 4)
    errors.push('discovery: quickPicks 至少 4 条');
  for (const q of discovery.quickPicks || []) {
    if (!manifestIds.has(q.repoId)) errors.push(`discovery/quickPick: 引用不存在 id ${q.repoId}`);
    if (gatedIds.has(q.repoId)) errors.push(`discovery/quickPick: 需 Token 的 ${q.repoId} 不能作为快捷推荐`);
    if (!q.needZh || !q.whyZh) errors.push('discovery/quickPick: 缺 needZh/whyZh');
    if (!q.timeZh) errors.push('discovery/quickPick: 缺 timeZh');
  }
  if (!Array.isArray(discovery.soundTypes) || discovery.soundTypes.length < 6)
    errors.push('discovery: soundTypes 少于 6 类');
  for (const st of discovery.soundTypes || []) {
    if (!st.id || !st.titleZh || !st.descZh) errors.push('discovery/soundType: 字段缺失');
  }
  if (!Array.isArray(discovery.sampleGroups)) errors.push('discovery: sampleGroups 缺失');
  for (const g of discovery.sampleGroups || []) {
    for (const id of g.repoIds || []) if (!manifestIds.has(id)) errors.push(`discovery/sampleGroup ${g.id}: 引用不存在 ${id}`);
  }
  if (!Array.isArray(discovery.warnings) || discovery.warnings.length < 2)
    errors.push('discovery: warnings 至少 2 条');
}

/* ---------------- 字段完整率 ---------------- */
const nonNullRate = (obj, fields) => {
  const total = fields.length;
  const filled = fields.filter((f) => obj[f] !== null && obj[f] !== undefined && obj[f] !== '').length;
  return `${filled}/${total}`;
};
const repoStats = {
  homepage: repoList.filter((r) => r.homepage !== null).length,
  openIssues: repoList.filter((r) => r.openIssues !== null).length,
};

/* ---------------- 输出 ---------------- */
const catCount = {};
for (const r of repoList) catCount[r.category] = (catCount[r.category] || 0) + 1;
const tierCount = {};
for (const r of repoList) tierCount[r.windowsTier] = (tierCount[r.windowsTier] || 0) + 1;

console.log('=== validate-data.mjs ===');
console.log(`repos ${repoList.length} | details ${detailIds.length} | evidence ${evList.length} | scenarios ${discovery?.scenarios?.length ?? 0}`);
console.log(`分类: ${JSON.stringify(catCount)}`);
console.log(`Windows: ${JSON.stringify(tierCount)}`);
console.log(`homepage 非 null ${repoStats.homepage} | openIssues 非 null ${repoStats.openIssues} | 样例 ok ${sampleStats.ok} / skipped ${sampleStats.skipped} / failed ${sampleStats.failed}`);
console.log(`tokenRequired true: ${gatedIds.size} (${[...gatedIds].join(', ')})`);
console.log(`ERRORS ${errors.length} | WARNS ${warns.length}`);
errors.forEach((e) => console.log(`  [ERR] ${e}`));
warns.slice(0, 40).forEach((w) => console.log(`  [WARN] ${w}`));
if (warns.length > 40) console.log(`  ... ${warns.length - 40} 条 WARN 省略`);
process.exit(errors.length ? 1 : 0);
