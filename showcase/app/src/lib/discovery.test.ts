import { describe, expect, it } from 'vitest';
import type { DiscoveryDoc } from '../types/discovery';
import type { IntentDoc } from '../types/intents';
import type { Repo } from '../types/repo';
import {
  createLongTextSearch,
  detectConstraintQuery,
  normalizeLongText,
  segmentLongQuery,
} from './discovery';
import { makeRepo } from './fixtures';

const sfxRepo: Repo = makeRepo({
  id: 'demo__sfx',
  repo: 'sfx',
  category: '音效生成',
  soundTypes: ['神经网络生成'],
  descriptionZh: '文本到音效的扩散模型，可生成爆炸、脚步、环境声',
  tags: ['音效', '扩散', '爆炸'],
  bestFor: '给游戏或短视频快速生成短音效',
  sample: {
    ...makeRepo().sample,
    durationSec: 20,
    segments: [{ startSec: 0, endSec: 8, capZh: '短促爆炸' }],
  },
});

const podcastRepo: Repo = makeRepo({
  id: 'demo__podcast',
  repo: 'podcast-clean',
  category: '音频编辑',
  soundTypes: ['语音', '处理与转码'],
  descriptionZh: '访谈录音自动切段、降噪、去口癖，适合播客后期',
  tags: ['降噪', '切段', '播客', '访谈'],
  bestFor: '一堆访谈录音要自动切段降噪',
  sample: {
    ...makeRepo().sample,
    durationSec: 30,
    segments: [{ startSec: 0, endSec: 10, capZh: '原声与底噪' }],
  },
});

const repos = [sfxRepo, podcastRepo];

const discovery: DiscoveryDoc = {
  scenarios: [
    {
      id: 'game-sfx',
      titleZh: '游戏音效',
      descZh: '短音效生成',
      questionZh: '我想给游戏做个 8 秒的爆炸音效',
      recommended: [{ repoId: sfxRepo.id, verdict: 'first', whyZh: '文本出音效', timeZh: '10 分钟' }],
      filters: { categories: ['音效生成'], tags: ['音效'], soundTypes: ['神经网络生成'] },
    },
    {
      id: 'podcast',
      titleZh: '播客后期',
      descZh: '访谈录音切段降噪',
      questionZh: '我有一堆访谈录音要自动切段降噪',
      recommended: [{ repoId: podcastRepo.id, verdict: 'first', whyZh: '自动化切段', timeZh: '20 分钟' }],
      filters: { categories: ['音频编辑'], tags: ['降噪'], soundTypes: ['语音'] },
    },
  ],
  constraints: [
    {
      id: 'no-gpu',
      titleZh: '没有独显',
      descZh: '',
      apply: { type: 'field', field: 'needsGpu', op: 'eq', value: false },
    },
    {
      id: 'cli-batch',
      titleZh: '命令行批量',
      descZh: '',
      apply: { type: 'field', field: 'hasCli', op: 'eq', value: 'yes' },
    },
  ],
  quickPicks: [],
  soundTypes: [],
  sampleGroups: [],
  synonyms: { 爆炸: ['音效', 'sfx'], 降噪: ['播客', 'podcast'] },
  warnings: [],
};

const intents: IntentDoc = {
  repos: {
    [sfxRepo.id]: [
      { q: '我想给游戏做个八秒的爆炸音效，最好不用显卡', scenario: 'game-sfx' },
      { q: '有没有能按文字直接生成爆炸声的工具', scenario: 'game-sfx' },
    ],
    [podcastRepo.id]: [
      { q: '我有一堆访谈录音要自动切段降噪', scenario: 'podcast' },
      { q: '播客录音能批量降噪吗', scenario: 'podcast' },
    ],
  },
  scenarios: {
    'game-sfx': ['给游戏角色做一个爆炸音效', '八秒钟的爆炸声'],
    podcast: ['访谈录音自动切段', '播客降噪'],
  },
  global: ['生成一段背景音乐', '把 MIDI 渲染成 WAV'],
};

const search = createLongTextSearch(repos, {}, discovery, intents);

describe('口语长句检索', () => {
  it('中文数字与语气词被归一化', () => {
    expect(normalizeLongText('我想给游戏做个 8 秒的爆炸音效')).toBe('给游戏做个8秒的爆炸音效');
  });

  it('长句按标点与连接词分段', () => {
    const segments = segmentLongQuery('我有一堆访谈录音，要自动切段，还要降噪');
    expect(segments.length).toBeGreaterThanOrEqual(3);
    expect(segments.every((item) => item.length > 0)).toBe(true);
  });

  it('「8 秒爆炸音效」命中音效仓库并识别场景', () => {
    const result = search.search('我想给游戏做个 8 秒的爆炸音效，最好不用显卡');
    expect(result.hits.length).toBeGreaterThan(0);
    expect(result.hits[0]?.repo.id).toBe(sfxRepo.id);
    expect(result.scenario?.scenario.id).toBe('game-sfx');
    expect(result.constraintMode).toBe(true);
  });

  it('「访谈录音切段降噪」命中播客仓库', () => {
    const result = search.search('我有一堆访谈录音要自动切段降噪');
    expect(result.hits[0]?.repo.id).toBe(podcastRepo.id);
    expect(result.scenario?.scenario.id).toBe('podcast');
  });

  it('约束词映射到契约里真实存在的 id', () => {
    const detected = detectConstraintQuery(normalizeLongText('没有显卡，要命令行批量跑'), discovery.constraints);
    expect(detected.constraints.map((item) => item.id).sort()).toEqual(['cli-batch', 'no-gpu']);
  });

  it('无关长句不强行归场景', () => {
    const result = search.search('今天天气不错想出门散步');
    expect(result.scenario).toBeNull();
  });
});
