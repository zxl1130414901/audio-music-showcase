import type { DiscoveryDoc } from '../../types/discovery';
import type { Repo, RepoDetail } from '../../types/repo';
import { reposForScenario, warningsForRepo } from '../../lib/discovery';
import { RepoCard } from '../../components/RepoCard';

interface ScenarioViewProps {
  scenarioId: string | null;
  discovery: DiscoveryDoc;
  repos: Repo[];
  repoById: Map<string, Repo>;
  details: Record<string, RepoDetail>;
  selected: string[];
  onToggleCompare: (id: string) => void;
  onOpenRepo: (id: string) => void;
  onBackHome: () => void;
}

export function ScenarioView({
  scenarioId,
  discovery,
  repos,
  repoById,
  details,
  selected,
  onToggleCompare,
  onOpenRepo,
  onBackHome,
}: ScenarioViewProps) {
  const scenario = discovery.scenarios.find((item) => item.id === scenarioId) ?? null;

  if (!scenario) {
    return (
      <div className="empty">
        <b>没有这个场景</b>
        <span>它可能还在数据流水线里，先回首页按声音类型找。</span>
        <button type="button" className="button button--small" onClick={onBackHome}>
          回首页
        </button>
      </div>
    );
  }

  const recommended = scenario.recommended.flatMap((item) => {
    const repo = repoById.get(item.repoId);
    return repo ? [{ item, repo }] : [];
  });
  const recommendedIds = new Set(recommended.map((entry) => entry.repo.id));
  const others = reposForScenario(repos, scenario).filter(
    (match) => !recommendedIds.has(match.repo.id),
  );

  return (
    <div className="detail">
      <nav className="breadcrumb" aria-label="面包屑">
        <a href="#/" onClick={(event) => (event.preventDefault(), onBackHome())}>
          首页
        </a>
        <span>/</span>
        <span>场景</span>
        <span>/</span>
        <span>{scenario.titleZh}</span>
      </nav>

      <header className="hero" style={{ paddingTop: 0 }}>
        <span className="hero__eyebrow">场景选型</span>
        <h1 className="hero__title" style={{ fontSize: 'clamp(26px, 4vw, 38px)' }}>
          {scenario.titleZh}
        </h1>
        <p className="hero__lede">{scenario.descZh}</p>
        <div className="banner banner--info">
          <span className="banner__dot" />
          <span>有人这样问：「{scenario.questionZh}」</span>
        </div>
      </header>

      <section className="section" aria-labelledby="scenario-picks">
        <div className="section-head">
          <div>
            <h2 className="section-title" id="scenario-picks">
              先看这几个
            </h2>
            <p className="section-desc">按「首选 / 备选 / 重量级」给出理由和实测耗时；点开可听全部分段。</p>
          </div>
        </div>
        {recommended.length > 0 ? (
          <div className="repo-grid">
            {recommended.map(({ item, repo }) => (
              <div key={repo.id} style={{ display: 'grid', gap: 10, minWidth: 0 }}>
                <RepoCard
                  repo={repo}
                  detail={details[repo.id]}
                  repoById={repoById}
                  selected={selected.includes(repo.id)}
                  onToggleCompare={onToggleCompare}
                  onOpenRepo={onOpenRepo}
                  recommendation={item}
                />
                <div className="decision" style={{ borderLeftColor: 'var(--border-strong)' }}>
                  <p className="decision__sig">为什么是它：{item.whyZh}</p>
                  <p className="decision__sig muted">实测耗时：{item.timeZh}</p>
                  {warningsForRepo(discovery.warnings, repo).map((warning) => (
                    <p key={warning.scopeZh} className="decision__sig" style={{ color: 'var(--warning)' }}>
                      ⚠ {warning.riskZh}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">
            <b>首选样例还在补</b>
            <span>这个场景的推荐仓库暂时没有可用档案，下面按分类/标签列出的候选仍然可以看。</span>
          </div>
        )}
      </section>

      <section className="section" aria-labelledby="scenario-others">
        <div className="section-head">
          <div>
            <h2 className="section-title" id="scenario-others">
              同场景的其他候选
            </h2>
            <p className="section-desc">
              按分类与声音类型匹配，共 {others.length} 个；每张卡都标注了命中原因。
            </p>
          </div>
        </div>
        {others.length > 0 ? (
          <div className="repo-grid">
            {others.map((match) => (
              <RepoCard
                key={match.repo.id}
                repo={match.repo}
                detail={details[match.repo.id]}
                repoById={repoById}
                selected={selected.includes(match.repo.id)}
                onToggleCompare={onToggleCompare}
                onOpenRepo={onOpenRepo}
                matchReasons={match.reasons}
              />
            ))}
          </div>
        ) : (
          <div className="empty">
            <b>没有更多匹配</b>
            <span>可以回首页用「声音类型 + 条件」组合筛选。</span>
          </div>
        )}
      </section>
    </div>
  );
}
