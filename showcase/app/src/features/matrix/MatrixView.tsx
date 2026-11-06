import { useEffect, useMemo, useState } from 'react';
import type { FilterState, Repo, RepoDetail, SortDirection, SortKey, TriState } from '../../types/repo';
import { collectFilterOptions, countActiveFilters, filterRepos, toggleFilterValue } from '../../lib/filter';
import { SORT_LABELS, sortRepos } from '../../lib/sort';
import { computeOverallScore, scorePercent } from '../../lib/scores';
import { CLI_LABELS, GPU_LABELS, WINDOWS_LABELS } from '../../lib/flags';
import { formatAge, formatCompactNumber, formatDuration, formatIsoDate } from '../../lib/format';
import { RepoCard } from '../../components/RepoCard';
import { Icon } from '../../components/Icon';

interface MatrixViewProps {
  repos: Repo[];
  repoById: Map<string, Repo>;
  details: Record<string, RepoDetail>;
  filters: FilterState;
  sortKey: SortKey;
  sortDir: SortDirection;
  selected: string[];
  onFilterChange: (filters: FilterState) => void;
  onSortChange: (key: SortKey) => void;
  onToggleCompare: (id: string) => void;
  onOpenRepo: (id: string) => void;
}

const PAGE_SIZE = 12;
const COLUMNS: SortKey[] = [
  'name',
  'stars',
  'updated',
  'category',
  'language',
  'platform',
  'gpu',
  'cli',
  'install',
  'duration',
  'sample',
  'overall',
];

function sampleLabel(repo: Repo): string {
  if (repo.sample.status === 'ok') {
    return `✓ ${repo.sample.durationSec ? `${Math.round(repo.sample.durationSec)}s` : '可试听'}`;
  }
  if (repo.sample.status === 'failed') return '做不了';
  if (repo.sample.status === 'skipped') return '未出样';
  return '生成中';
}

export function MatrixView({
  repos,
  repoById,
  details,
  filters,
  sortKey,
  sortDir,
  selected,
  onFilterChange,
  onSortChange,
  onToggleCompare,
  onOpenRepo,
}: MatrixViewProps) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const options = useMemo(() => collectFilterOptions(repos), [repos]);
  const filtered = useMemo(() => filterRepos(repos, filters), [repos, filters]);
  const sorted = useMemo(() => sortRepos(filtered, sortKey, sortDir), [filtered, sortKey, sortDir]);
  const page = sorted.slice(0, visible);

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [filters, sortKey, sortDir]);

  const activeCount = countActiveFilters(filters);

  function patchFilter(patch: Partial<FilterState>): void {
    onFilterChange({ ...filters, ...patch });
  }

  const triControl = (
    label: string,
    key: 'platforms' | 'gpu' | 'sampleReady',
    values: [TriState, string][],
  ) => (
    <div className="filter-group" key={key}>
      <span className="filter-title">{label}</span>
      <div className="segmented" role="group" aria-label={label}>
        {values.map(([value, text]) => (
          <button
            key={value}
            type="button"
            className={filters[key] === value ? 'is-active' : ''}
            aria-pressed={filters[key] === value}
            onClick={() => patchFilter({ [key]: value } as Partial<FilterState>)}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="matrix-layout">
      <aside className="filters" aria-label="筛选条件">
        <div className="filter-group">
          <span className="filter-title">
            <span>关键词</span>
            {activeCount > 0 ? <span>{activeCount} 项生效</span> : null}
          </span>
          <label className="sr-only" htmlFor="matrix-search">
            关键词筛选
          </label>
          <input
            id="matrix-search"
            className="search-input"
            style={{ padding: '8px 10px' }}
            value={filters.q}
            onChange={(event) => patchFilter({ q: event.target.value })}
            placeholder="仓库名 / 分类 / 标签"
          />
        </div>

        <div className="filter-group">
          <span className="filter-title">分类</span>
          <div className="filter-list">
            {options.categories.map((category) => (
              <button
                key={category}
                type="button"
                className={`filter-chip${filters.categories.includes(category) ? ' is-active' : ''}`}
                aria-pressed={filters.categories.includes(category)}
                onClick={() =>
                  patchFilter({ categories: toggleFilterValue(filters.categories, category) })
                }
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <span className="filter-title">声音类型</span>
          <div className="filter-list">
            {options.soundTypes.map((type) => (
              <button
                key={type}
                type="button"
                className={`filter-chip${filters.soundTypes.includes(type) ? ' is-active' : ''}`}
                aria-pressed={filters.soundTypes.includes(type)}
                onClick={() => patchFilter({ soundTypes: toggleFilterValue(filters.soundTypes, type) })}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {triControl('Windows', 'platforms', [
          ['all', '全部'],
          ['yes', '可用'],
          ['no', '不行'],
        ])}
        {triControl('GPU', 'gpu', [
          ['all', '全部'],
          ['yes', '需要'],
          ['no', '不需要'],
        ])}
        {triControl('样例', 'sampleReady', [
          ['all', '全部'],
          ['yes', '可试听'],
          ['no', '待补'],
        ])}

        <div className="filter-group">
          <span className="filter-title">语言</span>
          <div className="filter-list">
            {options.languages.map((language) => (
              <button
                key={language}
                type="button"
                className={`filter-chip${filters.languages.includes(language) ? ' is-active' : ''}`}
                onClick={() => patchFilter({ languages: toggleFilterValue(filters.languages, language) })}
              >
                {language}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <span className="filter-title">协议</span>
          <div className="filter-list">
            {options.licenses.map((license) => (
              <button
                key={license}
                type="button"
                className={`filter-chip${filters.licenses.includes(license) ? ' is-active' : ''}`}
                onClick={() => patchFilter({ licenses: toggleFilterValue(filters.licenses, license) })}
              >
                {license}
              </button>
            ))}
          </div>
        </div>

        {activeCount > 0 ? (
          <button
            type="button"
            className="button button--small button--ghost"
            onClick={() =>
              onFilterChange({
                q: '',
                categories: [],
                soundTypes: [],
                languages: [],
                licenses: [],
                platforms: 'all',
                gpu: 'all',
                sampleReady: 'all',
              })
            }
          >
            <Icon name="reset" size={14} />
            清空筛选
          </button>
        ) : null}
      </aside>

      <main className="matrix-main">
        <div className="matrix-toolbar">
          <p className="matrix-count">
            共 <b>{filtered.length}</b> / {repos.length} 个项目
            {activeCount > 0 ? ` · ${activeCount} 个筛选条件` : ''}
          </p>
          <p className="matrix-count">
            排序：{SORT_LABELS[sortKey]} {sortDir === 'asc' ? '↑' : '↓'}
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="empty">
            <b>没有同时满足这些条件的项目</b>
            <span>试着放宽 Windows / GPU 或取消一个声音类型。</span>
            <button
              type="button"
              className="button button--small"
              onClick={() =>
                onFilterChange({
                  q: '',
                  categories: [],
                  soundTypes: [],
                  languages: [],
                  licenses: [],
                  platforms: 'all',
                  gpu: 'all',
                  sampleReady: 'all',
                })
              }
            >
              清空筛选
            </button>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>
                      <span className="sr-only">A/B 选择</span>
                    </th>
                    {COLUMNS.map((column) => (
                      <th
                        key={column}
                        className={sortKey === column ? 'is-sorted' : ''}
                        aria-sort={
                          sortKey === column
                            ? sortDir === 'asc'
                              ? 'ascending'
                              : 'descending'
                            : 'none'
                        }
                      >
                        <button type="button" onClick={() => onSortChange(column)}>
                          {SORT_LABELS[column]}
                          {sortKey === column ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                        </button>
                      </th>
                    ))}
                    <th>
                      <span className="sr-only">操作</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {page.map((repo) => (
                    <tr key={repo.id}>
                      <td>
                        <input
                          className="table__check"
                          type="checkbox"
                          checked={selected.includes(repo.id)}
                          onChange={() => onToggleCompare(repo.id)}
                          aria-label={`把 ${repo.repo} 加入 A/B`}
                        />
                      </td>
                      <td>
                        <button type="button" className="table__name" onClick={() => onOpenRepo(repo.id)}>
                          {repo.repo}
                        </button>
                        <div className="muted" style={{ fontSize: 11 }}>
                          {repo.owner}
                        </div>
                      </td>
                      <td className="mono">{formatCompactNumber(repo.stars)}</td>
                      <td className="mono" title={formatIsoDate(repo.pushedAt)}>
                        {formatAge(repo.pushedAt)}
                      </td>
                      <td>{repo.category}</td>
                      <td>{repo.language ?? '—'}</td>
                      <td>{WINDOWS_LABELS[repo.windowsSupport]}</td>
                      <td>{GPU_LABELS[repo.gpuAcceleration]}</td>
                      <td>{CLI_LABELS[repo.cliHeadless]}</td>
                      <td className="mono">{repo.installComplexity}/5</td>
                      <td className="mono">
                        {repo.sample.status === 'ok' ? formatDuration(repo.sample.durationSec) : '—'}
                      </td>
                      <td className={repo.sample.status === 'ok' ? 'accent-text' : 'muted'}>
                        {sampleLabel(repo)}
                      </td>
                      <td>
                        <span className="mono">{computeOverallScore(repo.scores).toFixed(1)}</span>
                        <span
                          className="score-bar"
                          style={{ display: 'inline-block', width: 44, marginLeft: 6, verticalAlign: 'middle' }}
                        >
                          <span style={{ width: `${scorePercent(computeOverallScore(repo.scores))}%` }} />
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => onOpenRepo(repo.id)}
                          aria-label={`查看 ${repo.repo} 详情`}
                        >
                          详情
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="matrix-cards">
              {page.map((repo) => (
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

            {visible < sorted.length ? (
              <div className="pager">
                <button
                  type="button"
                  className="button button--small button--ghost"
                  onClick={() => setVisible((count) => count + PAGE_SIZE)}
                >
                  再显示 {Math.min(PAGE_SIZE, sorted.length - visible)} 个（还剩 {sorted.length - visible}）
                </button>
              </div>
            ) : (
              <p className="pager">已显示全部 {sorted.length} 个</p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
