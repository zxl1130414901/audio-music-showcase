import { useMemo, useState } from 'react';
import type { DiscoveryDoc } from '../../types/discovery';
import type { IntentDoc } from '../../types/intents';
import type { FilterState, Repo, RepoDetail } from '../../types/repo';
import {
  FALLBACK_QUERIES,
  applyConstraints,
  createLongTextSearch,
  detectConstraintQuery,
  normalizeLongText,
  quickPickRepos,
  searchRepos,
  type LongTextResult,
} from '../../lib/discovery';
import { computeOverallScore } from '../../lib/scores';
import { computeOverviewStats } from '../../lib/stats';
import { findSoundType, reposOfSoundType, soundTypeCounts } from '../../lib/soundType';
import { formatCompactNumber, formatDuration, formatNumber } from '../../lib/format';
import { AudioPlayer } from '../../components/AudioPlayer';
import { RepoCard } from '../../components/RepoCard';
import { Icon } from '../../components/Icon';

interface HomeViewProps {
  repos: Repo[];
  repoById: Map<string, Repo>;
  details: Record<string, RepoDetail>;
  discovery: DiscoveryDoc;
  intents: IntentDoc;
  selected: string[];
  isSample: boolean;
  onToggleCompare: (id: string) => void;
  onOpenRepo: (id: string) => void;
  onOpenScenario: (id: string) => void;
  onOpenMatrix: (filters?: Partial<FilterState>) => void;
  onCompare: (a: string, b: string) => void;
}

const LONG_QUERY_MIN = 10;

export function HomeView({
  repos,
  repoById,
  details,
  discovery,
  intents,
  selected,
  isSample,
  onToggleCompare,
  onOpenRepo,
  onOpenScenario,
  onOpenMatrix,
  onCompare,
}: HomeViewProps) {
  const [draft, setDraft] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [soundTypeId, setSoundTypeId] = useState<string | null>(null);
  const [constraintIds, setConstraintIds] = useState<string[]>([]);

  const stats = useMemo(() => computeOverviewStats(repos), [repos]);
  const longIndex = useMemo(
    () => createLongTextSearch(repos, details, discovery, intents),
    [repos, details, discovery, intents],
  );
  const soundCounts = useMemo(
    () => soundTypeCounts(repos, discovery.soundTypes),
    [repos, discovery.soundTypes],
  );
  const soundEntry = findSoundType(discovery.soundTypes, soundTypeId);
  const constraintResults = useMemo(
    () => applyConstraints(repos, discovery.constraints, constraintIds),
    [repos, discovery.constraints, constraintIds],
  );

  const longResult: LongTextResult | null = submitted.trim()
    ? longIndex.search(submitted)
    : null;
  const keywordHits = submitted.trim() && submitted.trim().length < LONG_QUERY_MIN
    ? searchRepos(repos, submitted, discovery.synonyms, details)
    : [];

  const activeFilters = constraintIds.length > 0 || Boolean(soundEntry);
  const constraintIdsSet = new Set(constraintResults.map((item) => item.repo.id));
  const soundIdsSet = soundEntry
    ? new Set(reposOfSoundType(repos, soundEntry).map((repo) => repo.id))
    : null;

  const searchResults: Repo[] = useMemo(() => {
    if (!submitted.trim()) return [];
    const ordered = longResult
      ? [...longResult.hits, ...longResult.nearest].map((hit) => hit.repo)
      : keywordHits.map((hit) => hit.repo);
    const deduped = new Map<string, Repo>();
    for (const repo of ordered) {
      if (!repo) continue;
      if (constraintIds.length > 0 && !constraintIdsSet.has(repo.id)) continue;
      if (soundIdsSet && !soundIdsSet.has(repo.id)) continue;
      if (!deduped.has(repo.id)) deduped.set(repo.id, repo);
    }
    return [...deduped.values()].slice(0, 6);
  }, [submitted, longResult, keywordHits, constraintIds.length, constraintIdsSet, soundIdsSet]);

  const browseResults: Repo[] = useMemo(() => {
    if (!activeFilters) return [];
    let list = repos;
    if (constraintIds.length > 0) list = list.filter((repo) => constraintIdsSet.has(repo.id));
    if (soundEntry) list = list.filter((repo) => soundIdsSet?.has(repo.id));
    return [...list].sort((a, b) => computeOverallScore(b.scores) - computeOverallScore(a.scores)).slice(0, 6);
  }, [activeFilters, repos, constraintIds.length, constraintIdsSet, soundEntry, soundIdsSet]);

  const queryConstraints = useMemo(() => {
    if (!submitted.trim()) return [];
    const detected = detectConstraintQuery(normalizeLongText(submitted), discovery.constraints);
    return detected.constraints;
  }, [submitted, discovery.constraints]);

  const quickPicks = quickPickRepos(discovery, repoById).slice(0, 6);
  const groups = discovery.sampleGroups
    .map((group) => ({
      group,
      items: group.repoIds
        .map((id) => repoById.get(id))
        .filter((repo): repo is Repo => Boolean(repo)),
    }))
    .filter((item) => item.items.length > 0);

  const hasSearch = submitted.trim().length > 0;

  function submitSearch(event: React.FormEvent): void {
    event.preventDefault();
    setSubmitted(draft.trim());
    setSoundTypeId(null);
    setConstraintIds([]);
  }

  function toggleConstraint(id: string): void {
    setConstraintIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  const soundDescriptions = soundEntry ? `${soundEntry.titleZh} · ${soundEntry.descZh}` : null;

  return (
    <>
      <section className="hero">
        <span className="hero__eyebrow">先听 24 秒，再决定装哪个</span>
        <h1 className="hero__title">
          选音频开源项目，<em>别只看 Star 数</em>。
        </h1>
        <p className="hero__lede">
          {formatNumber(repos.length)} 个音效 / 音乐仓库，每个都尽量配一段可试听样例：
          爆炸音效、BGM、MIDI 渲染、母带、可视化。句子怎么说都行，这里按「你要做什么声音」来找。
        </p>

        <form className="search-card" onSubmit={submitSearch} role="search">
          <div className="search-row">
            <label className="sr-only" htmlFor="home-search">
              用一句话描述你要的声音
            </label>
            <input
              id="home-search"
              className="search-input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="例：我想给游戏做个 8 秒的爆炸音效，最好不用显卡"
              autoComplete="off"
            />
            <button type="submit" className="button button--solid">
              <Icon name="search" size={16} />
              找项目
            </button>
          </div>
          <div className="search-hint">
            <span>试试：</span>
            {FALLBACK_QUERIES.map((query) => (
              <button
                key={query}
                type="button"
                className="text-button"
                onClick={() => {
                  setDraft(query);
                  setSubmitted(query);
                  setSoundTypeId(null);
                  setConstraintIds([]);
                }}
              >
                {query}
              </button>
            ))}
          </div>
        </form>

        {isSample ? (
          <div className="banner">
            <span className="banner__dot" />
            <span>
              当前接的是 <code>manifest.json</code> 占位数据（真实 <code>repos.json</code> 尚未落地）：
              分类、平台、分数为启发式推断，决策行优先取样例 meta，其次才用占位补写。
            </span>
          </div>
        ) : null}
      </section>

      <div className="stats-strip">
        <span>
          <strong>{stats.total}</strong>个项目
        </span>
        <span>
          <strong>{stats.sampled}</strong>份可试听样例
        </span>
        <span>
          <strong>{stats.failed + stats.missing}</strong>个待补 / 做不了
        </span>
        <span>
          <strong>{stats.soundTypes}</strong>类声音
        </span>
        <span>
          <strong>{stats.categories}</strong>个技术分类
        </span>
        <span>
          样例总时长 <strong>{formatDuration(stats.totalSampleSeconds)}</strong>
        </span>
      </div>

      <section className="section" aria-labelledby="sound-title">
        <div className="section-head">
          <div>
            <h2 className="section-title" id="sound-title">
              我想要的，是这种声音
            </h2>
            <p className="section-desc">
              不从技术栈进，从听感进：纯合成、采样乐器、神经网络生成、环境音、语音、可视化。
            </p>
          </div>
        </div>
        <div className="chip-row">
          {soundCounts.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`chip${soundTypeId === item.id ? ' is-active' : ''}`}
              onClick={() => {
                setSoundTypeId(soundTypeId === item.id ? null : item.id);
                setSubmitted('');
              }}
              aria-pressed={soundTypeId === item.id}
            >
              {item.entry.titleZh}
              <span className="chip__count">{item.count}</span>
            </button>
          ))}
        </div>
        {soundDescriptions ? <p className="section-desc">{soundDescriptions}</p> : null}
      </section>

      <section className="section" aria-labelledby="constraint-title">
        <div className="section-head">
          <div>
            <h2 className="section-title" id="constraint-title">
              我这边有什么条件
            </h2>
            <p className="section-desc">
              条件是多选且必须同时满足；没选就代表不设限。没有显卡、要 Windows 原生、要命令行、要能批量。
            </p>
          </div>
        </div>
        <div className="chip-row">
          {discovery.constraints.map((constraint) => (
            <button
              key={constraint.id}
              type="button"
              className={`chip${constraintIds.includes(constraint.id) ? ' is-active' : ''}`}
              onClick={() => {
                toggleConstraint(constraint.id);
                setSubmitted('');
              }}
              aria-pressed={constraintIds.includes(constraint.id)}
              title={constraint.descZh}
            >
              {constraint.titleZh}
            </button>
          ))}
        </div>
        {constraintIds.length > 0 ? (
          <p className="section-desc">
            同时满足 {constraintIds.length} 个条件的项目剩{' '}
            <b className="accent-text">{constraintResults.length}</b> 个。
          </p>
        ) : null}
      </section>

      {hasSearch ? (
        <section className="section" aria-labelledby="search-result-title">
          <div className="section-head">
            <div>
              <h2 className="section-title" id="search-result-title">
                按你的说法找到的项目
              </h2>
              <p className="section-desc">
                原句：{submitted}
                {longResult?.scenario
                  ? ` · 我理解为「${longResult.scenario.scenario.titleZh}」`
                  : ''}
                {longResult ? ` · 命中 ${longResult.hits.length} 个` : ''}
              </p>
            </div>
            {longResult?.scenario ? (
              <button
                type="button"
                className="button button--small button--ghost"
                onClick={() => onOpenScenario(longResult.scenario!.scenario.id)}
              >
                看这个场景的全部候选
              </button>
            ) : null}
          </div>

          {queryConstraints.length > 0 ? (
            <div className="chip-row">
              {queryConstraints.map((constraint) => (
                <span key={constraint.id} className="tone is-accent">
                  已识别条件：{constraint.titleZh}
                </span>
              ))}
            </div>
          ) : null}

          {searchResults.length > 0 ? (
            <div className="repo-grid">
              {searchResults.map((repo) => (
                <RepoCard
                  key={repo.id}
                  repo={repo}
                  detail={details[repo.id]}
                  repoById={repoById}
                  selected={selected.includes(repo.id)}
                  onToggleCompare={onToggleCompare}
                  onOpenRepo={onOpenRepo}
                />
              ))}
            </div>
          ) : (
            <div className="empty">
              <b>这句还没对上</b>
              <span>换个说法试试，或直接按「声音类型 / 条件」筛。</span>
              <div className="chip-row" style={{ justifyContent: 'center' }}>
                {FALLBACK_QUERIES.map((query) => (
                  <button
                    key={query}
                    type="button"
                    className="text-button"
                    onClick={() => {
                      setDraft(query);
                      setSubmitted(query);
                    }}
                  >
                    {query}
                  </button>
                ))}
              </div>
            </div>
          )}

          {longResult && longResult.hits.length === 0 && longResult.nearest.length > 0 ? (
            <p className="section-desc">没有直接命中，上面展示的是最接近的 {searchResults.length} 个。</p>
          ) : null}
        </section>
      ) : null}

      {!hasSearch && activeFilters ? (
        <section className="section" aria-labelledby="browse-result-title">
          <div className="section-head">
            <div>
              <h2 className="section-title" id="browse-result-title">
                {soundEntry ? `${soundEntry.titleZh}里的项目` : '符合这些条件的项目'}
              </h2>
              <p className="section-desc">
                共 {browseResults.length === 6 ? '6+' : browseResults.length} 个候选，按综合分排序。
              </p>
            </div>
            <button type="button" className="button button--small button--ghost" onClick={() => onOpenMatrix()}>
              去全量矩阵筛选
            </button>
          </div>
          <div className="repo-grid">
            {browseResults.map((repo) => (
              <RepoCard
                key={repo.id}
                repo={repo}
                detail={details[repo.id]}
                repoById={repoById}
                selected={selected.includes(repo.id)}
                onToggleCompare={onToggleCompare}
                onOpenRepo={onOpenRepo}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="section" aria-labelledby="scenario-title">
        <div className="section-head">
          <div>
            <h2 className="section-title" id="scenario-title">
              按需求选：你现在要干什么
            </h2>
            <p className="section-desc">
              每张卡给出一个首选和一个备选，点进去能看到完整候选与实测耗时。
            </p>
          </div>
        </div>
        <div className="scenario-grid">
          {discovery.scenarios.map((scenario) => {
            const first = scenario.recommended.find(
              (item) => item.verdict === 'first' && repoById.has(item.repoId),
            );
            const firstRepo = first ? repoById.get(first.repoId) : undefined;
            return (
              <button
                key={scenario.id}
                type="button"
                className="scenario-card"
                onClick={() => onOpenScenario(scenario.id)}
              >
                <span className="scenario-card__question">「{scenario.questionZh}」</span>
                <span className="scenario-card__title">{scenario.titleZh}</span>
                <span className="section-desc">{scenario.descZh}</span>
                {first && firstRepo ? (
                  <span className="scenario-card__pick">
                    <span>
                      首选 <span className="scenario-card__repo">{firstRepo.repo}</span>
                    </span>
                    <span>{first.whyZh}</span>
                    <span className="muted">实测 {first.timeZh}</span>
                  </span>
                ) : (
                  <span className="scenario-card__pick muted">该场景的首选样例暂未就绪</span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {groups.length > 0 ? (
        <section className="section" aria-labelledby="samples-title">
          <div className="section-head">
            <div>
              <h2 className="section-title" id="samples-title">
                同一需求的对比样例
              </h2>
              <p className="section-desc">
                同一段 MIDI、同一段素材，差别只在渲染链。左右各播一遍，差异自己会说话。
              </p>
            </div>
            <button
              type="button"
              className="button button--small button--ghost"
              onClick={() => onOpenMatrix({ sampleReady: 'yes' })}
            >
              只看有样例的
            </button>
          </div>
          <div style={{ display: 'grid', gap: 14 }}>
            {groups.slice(0, 3).map(({ group, items }) => (
              <article key={group.id} className="sample-group">
                <div className="section-head">
                  <div>
                    <h3 className="panel__title">{group.titleZh}</h3>
                    <p className="section-desc">{group.descZh}</p>
                  </div>
                  {items.length >= 2 ? (
                    <button
                      type="button"
                      className="button button--small"
                      onClick={() => onCompare(items[0]!.id, items[1]!.id)}
                    >
                      <Icon name="compare" size={14} />
                      A/B 并排试听
                    </button>
                  ) : null}
                </div>
                <div className="sample-group__pair">
                  {items.slice(0, 2).map((repo) => (
                    <div key={repo.id} className="sample-group__repo">
                      <div className="sample-group__name">
                        {repo.repo}
                        <span>
                          ★ {formatCompactNumber(repo.stars)} · {formatDuration(repo.sample.durationSec)}
                        </span>
                      </div>
                      <AudioPlayer repoName={repo.repo} sample={repo.sample} compact playerId={repo.id} />
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="section" aria-labelledby="quick-title">
        <div className="section-head">
          <div>
            <h2 className="section-title" id="quick-title">
              一句话，一个项目
            </h2>
            <p className="section-desc">常见需求的最短路径；括号里是实测耗时，不是官方宣传。</p>
          </div>
        </div>
        <div className="quick-picks">
          {quickPicks.map(({ pick, repo }) => (
            <button key={pick.repoId} type="button" className="quick-pick" onClick={() => onOpenRepo(repo.id)}>
              <span className="quick-pick__need">{pick.needZh}</span>
              <span className="quick-pick__repo">{repo.repo}</span>
              <span className="quick-pick__why">{pick.whyZh}</span>
              <span className="quick-pick__why">实测 {pick.timeZh}</span>
            </button>
          ))}
        </div>
      </section>

      {discovery.warnings.length > 0 ? (
        <section className="section" aria-labelledby="warning-title">
          <div className="section-head">
            <h2 className="section-title" id="warning-title" style={{ fontSize: 17 }}>
              先说清楚这些坑
            </h2>
          </div>
          <div className="chip-row">
            {discovery.warnings.slice(0, 3).map((warning) => (
              <span key={warning.scopeZh} className="tone is-warn" title={warning.riskZh}>
                {warning.scopeZh}：{warning.riskZh}
              </span>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
