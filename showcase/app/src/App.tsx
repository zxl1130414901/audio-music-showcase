import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FilterState, Repo, RouteState, SortKey } from './types/repo';
import { loadDataset, assertDataset, type LoadedDataset } from './data';
import { parseRouteHash, syncLocationHash } from './lib/hash';
import { toggleSelection, MAX_COMPARE } from './lib/selection';
import { nextSortDirection } from './lib/sort';
import { HomeView } from './features/home/HomeView';
import { ScenarioView } from './features/scenario/ScenarioView';
import { MatrixView } from './features/matrix/MatrixView';
import { RepoDetailPage } from './features/detail/RepoDetailPage';
import { ABView } from './features/ab/ABView';
import { CompareBar } from './components/CompareBar';
import { Toast } from './components/Toast';
import { Icon } from './components/Icon';

const BACK_LABELS: Record<string, string> = {
  home: '回首页',
  scenario: '回场景',
  matrix: '回全量矩阵',
  detail: '回详情',
  ab: '回 A/B',
};

export function App() {
  const [data, setData] = useState<LoadedDataset | null>(null);
  const [error, setError] = useState('');
  const [route, setRoute] = useState<RouteState>(() =>
    parseRouteHash(typeof window === 'undefined' ? '' : window.location.hash),
  );
  const [toast, setToast] = useState('');

  useEffect(() => {
    let alive = true;
    loadDataset()
      .then((loaded) => {
        if (!alive) return;
        assertDataset(loaded.dataset, loaded.source.isSample);
        setData(loaded);
        console.warn(
          `[showcase] 数据就绪：${loaded.dataset.repos.length} 个项目，${loaded.source.sampleCount} 份样例，${Object.keys(loaded.details).length} 份档案`,
        );
      })
      .catch((reason: unknown) => {
        if (!alive) return;
        setError(reason instanceof Error ? reason.message : String(reason));
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    syncLocationHash(route);
  }, [route]);

  useEffect(() => {
    const onHashChange = (): void => {
      setRoute(parseRouteHash(window.location.hash));
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const repoById = useMemo(() => {
    const map = new Map<string, Repo>();
    for (const repo of data?.dataset.repos ?? []) map.set(repo.id, repo);
    return map;
  }, [data]);

  const notify = useCallback((message: string) => {
    setToast('');
    window.setTimeout(() => setToast(message), 0);
  }, []);

  const toggleCompare = useCallback(
    (id: string) => {
      setRoute((prev) => {
        const result = toggleSelection(prev.selected, id);
        if (result.rejected) notify(`A/B 最多同时选 ${MAX_COMPARE} 个；先移出一个再选。`);
        return { ...prev, selected: result.ids };
      });
    },
    [notify],
  );

  const openRepo = useCallback((id: string) => {
    setRoute((prev) => ({
      ...prev,
      view: 'detail',
      repoId: id,
      fromView: prev.view === 'detail' ? prev.fromView : prev.view === 'ab' ? 'matrix' : prev.view,
    }));
  }, []);

  const openScenario = useCallback((id: string) => {
    setRoute((prev) => ({ ...prev, view: 'scenario', scenarioId: id, repoId: null }));
  }, []);

  const openMatrix = useCallback((filters?: Partial<FilterState>) => {
    setRoute((prev) => ({
      ...prev,
      view: 'matrix',
      repoId: null,
      scenarioId: null,
      filters: filters ? { ...prev.filters, ...filters } : prev.filters,
    }));
  }, []);

  const openCompare = useCallback((a: string, b: string) => {
    setRoute((prev) => ({ ...prev, view: 'ab', repoId: null, abIds: [a, b] }));
  }, []);

  const goHome = useCallback(() => {
    setRoute((prev) => ({ ...prev, view: 'home', repoId: null, scenarioId: null, fromView: null }));
  }, []);

  const back = useCallback(() => {
    setRoute((prev) => {
      const target = prev.fromView ?? 'matrix';
      if (target === 'home') {
        return { ...prev, view: 'home', repoId: null, scenarioId: null };
      }
      if (target === 'scenario' && prev.scenarioId) {
        return { ...prev, view: 'scenario', repoId: null };
      }
      return { ...prev, view: 'matrix', repoId: null };
    });
  }, []);

  const changeFilters = useCallback((filters: FilterState) => {
    setRoute((prev) => ({ ...prev, filters }));
  }, []);

  const changeSort = useCallback((key: SortKey) => {
    setRoute((prev) => ({
      ...prev,
      sortKey: key,
      sortDir: nextSortDirection(key, prev.sortKey, prev.sortDir),
    }));
  }, []);

  if (error) {
    return (
      <div className="page">
        <div className="error-panel" style={{ marginTop: 32 }}>
          <b>数据接入失败</b>
          <p>{error}</p>
          <p className="muted">修复数据文件后刷新即可；页面不会因为缺数据而渲染空白骨架。</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page">
        <div className="loading">
          <span>正在装载仓库、样例与选型语料…</span>
          <div className="loading__bar">
            <span />
          </div>
        </div>
      </div>
    );
  }

  const repos = data.dataset.repos;
  const detailRepo = route.repoId ? repoById.get(route.repoId) ?? null : null;
  const abA = route.abIds[0] ? repoById.get(route.abIds[0]) ?? null : null;
  const abB = route.abIds[1] ? repoById.get(route.abIds[1]) ?? null : null;

  return (
    <div>
      <header className="site-topbar">
        <button
          type="button"
          className="brand"
          onClick={goHome}
          aria-label="回首页"
          style={{ background: 'transparent', border: 0, color: 'inherit' }}
        >
          <span className="brand__mark">
            <Icon name="wave" size={18} />
          </span>
          <span>
            AUDIO<span className="accent-text">⊘</span>MATRIX
          </span>
          <span className="brand__sub">
            {data.dataset.repos.length} 个音效 / 音乐开源项目 · {data.source.sampleCount} 份样例
          </span>
        </button>
        <nav className="topbar__nav" aria-label="主导航">
          <button
            type="button"
            className={`nav-link${route.view === 'home' ? ' is-active' : ''}`}
            onClick={goHome}
            style={{ background: 'transparent' }}
          >
            首页
          </button>
          <button
            type="button"
            className={`nav-link${route.view === 'matrix' ? ' is-active' : ''}`}
            onClick={() => openMatrix()}
            style={{ background: 'transparent' }}
          >
            全量矩阵
          </button>
          <button
            type="button"
            className={`nav-link${route.view === 'ab' ? ' is-active' : ''}`}
            onClick={() => {
              if (route.selected.length === 2) openCompare(route.selected[0]!, route.selected[1]!);
              else openMatrix();
            }}
            style={{ background: 'transparent' }}
          >
            A/B 试听
          </button>
          <span className="topbar__stat">{data.source.isSample ? '占位数据' : '真实数据'}</span>
        </nav>
      </header>

      <main className="page">
        {route.view === 'home' ? (
          <HomeView
            repos={repos}
            repoById={repoById}
            details={data.details}
            discovery={data.discovery}
            intents={data.intents}
            selected={route.selected}
            isSample={data.source.isSample}
            onToggleCompare={toggleCompare}
            onOpenRepo={openRepo}
            onOpenScenario={openScenario}
            onOpenMatrix={openMatrix}
            onCompare={openCompare}
          />
        ) : null}

        {route.view === 'scenario' ? (
          <ScenarioView
            scenarioId={route.scenarioId}
            discovery={data.discovery}
            repos={repos}
            repoById={repoById}
            details={data.details}
            selected={route.selected}
            onToggleCompare={toggleCompare}
            onOpenRepo={openRepo}
            onBackHome={goHome}
          />
        ) : null}

        {route.view === 'matrix' ? (
          <MatrixView
            repos={repos}
            repoById={repoById}
            details={data.details}
            filters={route.filters}
            sortKey={route.sortKey}
            sortDir={route.sortDir}
            selected={route.selected}
            onFilterChange={changeFilters}
            onSortChange={changeSort}
            onToggleCompare={toggleCompare}
            onOpenRepo={openRepo}
          />
        ) : null}

        {route.view === 'detail' ? (
          detailRepo ? (
            <RepoDetailPage
              repo={detailRepo}
              detailRaw={data.details[detailRepo.id]}
              evidence={data.evidence[detailRepo.id] ?? []}
              repoById={repoById}
              warnings={data.discovery.warnings}
              selected={route.selected}
              backLabel={BACK_LABELS[route.fromView ?? 'matrix'] ?? '返回'}
              onBack={back}
              onToggleCompare={toggleCompare}
              onOpenRepo={openRepo}
              onCompare={openCompare}
              onOpenMatrix={() => openMatrix()}
            />
          ) : (
            <div className="empty">
              <b>没有这个仓库</b>
              <span>链接里的 id 可能还在数据流水线里。</span>
              <button type="button" className="button button--small" onClick={() => openMatrix()}>
                去全量矩阵
              </button>
            </div>
          )
        ) : null}

        {route.view === 'ab' ? (
          <ABView
            a={abA}
            b={abB}
            details={data.details}
            repoById={repoById}
            selected={route.selected}
            onToggleCompare={toggleCompare}
            onOpenRepo={openRepo}
            onOpenMatrix={() => openMatrix()}
            onSwap={() => setRoute((prev) => ({ ...prev, abIds: [prev.abIds[1], prev.abIds[0]] }))}
          />
        ) : null}

        <footer className="site-footer">
          <span>
            数据源：<code>{data.source.file}</code> · 样例目录：<code>{data.source.sampleRoot}</code>
          </span>
          <span>
            单文件离线构建 · 无 CDN · 无联网字体 · 样例音频按相对路径引用 · 数据只读
          </span>
        </footer>
      </main>

      <CompareBar
        selected={route.selected}
        repoById={repoById}
        onRemove={(id) => setRoute((prev) => ({ ...prev, selected: prev.selected.filter((item) => item !== id) }))}
        onClear={() => setRoute((prev) => ({ ...prev, selected: [] }))}
        onCompare={() => {
          const [a, b] = route.selected;
          if (a && b) openCompare(a, b);
        }}
      />
      <Toast message={toast} />
    </div>
  );
}
