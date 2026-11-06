import { describe, expect, it } from 'vitest';
import type { DiscoveryConstraint, SoundTypeEntry } from '../types/discovery';
import { activeSegmentIndex, normalizeSegments, segmentProgress } from './segments';
import { resolveDecision } from './decision';
import { buildABConclusion } from './ab';
import { createEmptyFilters, filterRepos } from './filter';
import { matchesSoundType } from './soundType';
import { buildRouteHash, createDefaultRoute, parseRouteHash } from './hash';
import { applyConstraints } from './discovery';
import { makeRepo } from './fixtures';

describe('segments', () => {
  const segments = [
    { startSec: 0, endSec: 8, capZh: 'a' },
    { startSec: 8, endSec: 16, capZh: 'b' },
    { startSec: 16, endSec: 24, capZh: 'c' },
  ];

  it('按时间命中当前分段，末段之后保持最后一段', () => {
    expect(activeSegmentIndex(segments, 0)).toBe(0);
    expect(activeSegmentIndex(segments, 7.9)).toBe(0);
    expect(activeSegmentIndex(segments, 8)).toBe(1);
    expect(activeSegmentIndex(segments, 24)).toBe(2);
    expect(activeSegmentIndex([], 3)).toBe(-1);
  });

  it('段内进度夹在 0–1', () => {
    expect(segmentProgress(segments[1]!, 8)).toBe(0);
    expect(segmentProgress(segments[1]!, 12)).toBe(0.5);
    expect(segmentProgress(segments[1]!, 30)).toBe(1);
  });

  it('过滤空段并按起点排序', () => {
    const cleaned = normalizeSegments([
      { startSec: 16, endSec: 20, capZh: '后段' },
      { startSec: 0, endSec: 0, capZh: '空段' },
      { startSec: 0, endSec: 6, capZh: '  ' },
    ]);
    expect(cleaned).toEqual([{ startSec: 16, endSec: 20, capZh: '后段' }]);
  });
});

describe('decision', () => {
  it('仓库字段优先，缺失时才用档案', () => {
    const repo = makeRepo({ signatureZh: '仓库签名', contrastWith: ['demo__repo'] });
    const decision = resolveDecision(repo, {
      id: repo.id,
      taglineZh: '',
      summaryZh: '',
      whatItMakes: [],
      useCases: [],
      capabilities: {
        maxDurationZh: '',
        formatsZh: [],
        sampleRateZh: '',
        realtimeZh: '',
        batchZh: '',
        platformZh: '',
      },
      ceilingZh: '',
      workflow: [],
      differentiators: [],
      limits: [],
      compareTips: [],
      evidence: [],
      signatureZh: '档案签名',
      chooseWhenZh: '档案建议',
    });
    expect(decision.signatureZh).toBe('仓库签名');
    expect(decision.chooseWhenZh).toBe('档案建议');
    expect(decision.contrastWith).toEqual([]);
  });
});

describe('A/B 结论', () => {
  it('给出六行对比并标注差异', () => {
    const a = makeRepo({ id: 'a__one', repo: 'one', signatureZh: '采样合成' });
    const b = makeRepo({
      id: 'b__two',
      repo: 'two',
      signatureZh: '算法合成',
      windowsSupport: 'broken',
      gpuAcceleration: 'required',
    });
    const conclusion = buildABConclusion(a, b);
    expect(conclusion.rows).toHaveLength(6);
    expect(conclusion.rows[0]?.diff).toBe('same');
    expect(conclusion.rows[1]?.diff).toBe('different');
    expect(conclusion.caveatZh).toBeNull();
    expect(conclusion.summaryZh).toContain('样例');
  });

  it('一侧缺样例时给出 caveat', () => {
    const a = makeRepo();
    const b = makeRepo({ id: 'b__two', sample: { ...makeRepo().sample, status: 'missing', audioPath: null } });
    expect(buildABConclusion(a, b).caveatZh).toContain('样例');
  });
});

describe('筛选', () => {
  it('声音类型按包含匹配到分类与标签', () => {
    const repo = makeRepo({ category: '语音分离', soundTypes: ['语音'], tags: ['人声分离'] });
    const voice: SoundTypeEntry = {
      id: 'voice',
      titleZh: '语音',
      descZh: '人声',
      keywords: ['语音', 'vocal'],
    };
    expect(matchesSoundType(repo, voice)).toBe(true);
    expect(
      filterRepos([repo], { ...createEmptyFilters(), soundTypes: ['语音'] }),
    ).toHaveLength(1);
    expect(
      filterRepos([repo], { ...createEmptyFilters(), soundTypes: ['可视化'] }),
    ).toHaveLength(0);
  });
});

describe('约束筛选', () => {
  const constraints: DiscoveryConstraint[] = [
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
    {
      id: 'realtime-interactive',
      titleZh: '实时交互',
      descZh: '',
      apply: { type: 'field', field: 'pipeline', op: 'eq', value: 'realtime' },
    },
  ];

  it('实时能力由档案派生后可被筛选命中', () => {
    const realtime = makeRepo({ realtime: true });
    expect(applyConstraints([realtime], constraints, ['realtime-interactive'])).toHaveLength(1);
    expect(applyConstraints([makeRepo()], constraints, ['realtime-interactive'])).toHaveLength(0);
  });

  it('多选为 AND 叠加', () => {
    const good = makeRepo();
    const slow = makeRepo({ id: 'slow__repo', cliHeadless: 'no' });
    const result = applyConstraints([good, slow], constraints, ['no-gpu', 'cli-batch']);
    expect(result.map((item) => item.repo.id)).toEqual(['demo__repo']);
  });
});

describe('hash 路由', () => {
  it('A/B 与筛选可往返', () => {
    const route = createDefaultRoute();
    route.view = 'ab';
    route.abIds = ['demo__repo', 'other__repo'];
    route.selected = ['demo__repo', 'other__repo'];
    route.filters.soundTypes = ['纯合成', '语音'];
    const parsed = parseRouteHash(buildRouteHash(route));
    expect(parsed.view).toBe('ab');
    expect(parsed.abIds).toEqual(['demo__repo', 'other__repo']);
    expect(parsed.filters.soundTypes).toEqual(['纯合成', '语音']);
  });

  it('详情页带返回来源', () => {
    const parsed = parseRouteHash('#/repo/demo__repo?from=scenario&scenario=game-sfx');
    expect(parsed.view).toBe('detail');
    expect(parsed.repoId).toBe('demo__repo');
    expect(parsed.fromView).toBe('scenario');
    expect(parsed.scenarioId).toBe('game-sfx');
  });
});
