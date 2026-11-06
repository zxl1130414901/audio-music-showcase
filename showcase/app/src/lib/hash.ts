import type { FilterState, RouteState, SortDirection, SortKey, ViewKey } from '../types/repo';
import { createEmptyFilters } from './filter';
import { sanitizeSelection } from './selection';

const VIEWS: readonly ViewKey[] = ['home', 'scenario', 'matrix', 'detail', 'ab'];
const SORTS: readonly SortKey[] = [
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

export const DEFAULT_SORT_KEY: SortKey = 'overall';
export const DEFAULT_SORT_DIR: SortDirection = 'desc';

export function createDefaultRoute(): RouteState {
  return {
    view: 'home',
    repoId: null,
    scenarioId: null,
    fromView: null,
    filters: createEmptyFilters(),
    sortKey: DEFAULT_SORT_KEY,
    sortDir: DEFAULT_SORT_DIR,
    selected: [],
    abIds: [null, null],
  };
}

function isView(value: string | null): value is ViewKey {
  return value !== null && (VIEWS as readonly string[]).includes(value);
}

function isSortKey(value: string | null): value is SortKey {
  return value !== null && (SORTS as readonly string[]).includes(value);
}

function splitParam(params: URLSearchParams, key: string): string[] {
  const raw = params.get(key);
  if (!raw) return [];
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseTri(value: string | null): 'all' | 'yes' | 'no' {
  return value === 'yes' || value === 'no' ? value : 'all';
}

function pathSegments(pathPart: string): string[] {
  return pathPart.split('/').filter(Boolean).map((item) => decodeURIComponent(item));
}

/** 解析 #/、#/all、#/scenario/<id>、#/repo/<id>、#/ab/<a>/<b>。 */
export function parseRouteHash(hash: string): RouteState {
  const state = createDefaultRoute();
  const raw = hash.replace(/^#/, '');
  const queryIndex = raw.indexOf('?');
  const pathPart = (queryIndex >= 0 ? raw.slice(0, queryIndex) : raw).replace(/^\/+/, '');
  const queryPart = queryIndex >= 0 ? raw.slice(queryIndex + 1) : '';
  const params = new URLSearchParams(queryPart);
  const segments = pathSegments(pathPart);

  if (segments[0] === 'scenario' && segments[1]) {
    state.scenarioId = segments[1];
    state.view = 'scenario';
  } else if (segments[0] === 'repo' && segments[1]) {
    state.repoId = segments[1];
    state.view = 'detail';
  } else if (segments[0] === 'ab') {
    const a = segments[1] ?? null;
    const b = segments[2] ?? null;
    state.abIds = [a, b];
    state.view = 'ab';
  } else if (segments[0] === 'all') {
    state.view = 'matrix';
  }

  const hasQueryFilters = Boolean(
    params.get('q') ||
      params.get('category') ||
      params.get('sound') ||
      params.get('language') ||
      params.get('license') ||
      params.get('platform') ||
      params.get('gpu') ||
      params.get('sample'),
  );

  if (segments.length === 0) {
    const viewParam = params.get('view');
    if (isView(viewParam)) state.view = viewParam;
    else if (hasQueryFilters) state.view = 'matrix';
  }

  const fromParam = params.get('from');
  if (isView(fromParam) && fromParam !== 'detail' && fromParam !== 'ab') {
    state.fromView = fromParam;
  }
  const scenarioParam = params.get('scenario');
  if (!state.scenarioId && scenarioParam) state.scenarioId = scenarioParam;

  const sortParam = params.get('sort');
  if (isSortKey(sortParam)) state.sortKey = sortParam;
  const dirParam = params.get('dir');
  if (dirParam === 'asc' || dirParam === 'desc') state.sortDir = dirParam;

  const filters: FilterState = {
    q: params.get('q') ?? '',
    categories: splitParam(params, 'category'),
    soundTypes: splitParam(params, 'sound'),
    languages: splitParam(params, 'language'),
    licenses: splitParam(params, 'license'),
    platforms: parseTri(params.get('platform')),
    gpu: parseTri(params.get('gpu')),
    sampleReady: parseTri(params.get('sample')),
  };
  state.filters = filters;
  state.selected = sanitizeSelection(splitParam(params, 'sel'));
  return state;
}

/** 生成稳定、可分享的 hash。 */
export function buildRouteHash(state: RouteState): string {
  let path = '/';
  if (state.repoId) path = `/repo/${encodeURIComponent(state.repoId)}`;
  else if (state.view === 'ab') {
    const ids = state.abIds.filter((id): id is string => Boolean(id));
    path = ids.length > 0 ? `/ab/${ids.map(encodeURIComponent).join('/')}` : '/ab';
  } else if (state.view === 'matrix') path = '/all';
  else if (state.view === 'scenario' && state.scenarioId) {
    path = `/scenario/${encodeURIComponent(state.scenarioId)}`;
  }

  const params = new URLSearchParams();
  const isHome = !state.repoId && state.view === 'home';
  const isCanonicalPath =
    state.view === 'matrix' ||
    state.view === 'ab' ||
    (state.view === 'scenario' && Boolean(state.scenarioId));
  if (!state.repoId && !isHome && !isCanonicalPath) params.set('view', state.view);
  if (state.fromView && state.fromView !== 'detail') params.set('from', state.fromView);
  if (state.scenarioId && state.repoId) params.set('scenario', state.scenarioId);
  if (state.sortKey !== DEFAULT_SORT_KEY) params.set('sort', state.sortKey);
  if (state.sortDir !== DEFAULT_SORT_DIR) params.set('dir', state.sortDir);
  if (state.filters.q.trim()) params.set('q', state.filters.q.trim());
  if (state.filters.categories.length > 0)
    params.set('category', state.filters.categories.join(','));
  if (state.filters.soundTypes.length > 0) params.set('sound', state.filters.soundTypes.join(','));
  if (state.filters.languages.length > 0) params.set('language', state.filters.languages.join(','));
  if (state.filters.licenses.length > 0) params.set('license', state.filters.licenses.join(','));
  if (state.filters.platforms !== 'all') params.set('platform', state.filters.platforms);
  if (state.filters.gpu !== 'all') params.set('gpu', state.filters.gpu);
  if (state.filters.sampleReady !== 'all') params.set('sample', state.filters.sampleReady);
  if (state.selected.length > 0) params.set('sel', state.selected.join(','));

  const query = params.toString();
  return `#${path}${query ? `?${query}` : ''}`;
}

export function syncLocationHash(state: RouteState): void {
  const next = buildRouteHash(state);
  if (window.location.hash === next) return;
  try {
    window.history.replaceState(null, '', next);
  } catch {
    try {
      window.location.hash = next;
    } catch {
      // file:// 极端限制下忽略写入，路由仍由内存状态驱动。
    }
  }
}
