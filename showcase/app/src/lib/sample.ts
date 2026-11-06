/** 样例资源地址解析：dev / preview / 单文件 file:// 三种场景。 */

export function isFileProtocol(): boolean {
  return typeof window !== 'undefined' && window.location.protocol === 'file:';
}

function joinBase(base: string, path: string): string {
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  return `${cleanBase}${path.replace(/\\/g, '/').replace(/^\/+/, '')}`;
}

/** `_samples/<id>/sample.wav` -> 可播放 URL（离线时为相对 dist 的路径）。 */
export function resolveSampleUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const normalized = path.replace(/\\/g, '/');
  const relative = normalized.startsWith('_samples/')
    ? normalized.slice('_samples/'.length)
    : normalized.replace(/^samples\//, '');
  if (isFileProtocol()) {
    return joinBase(window.__SAMPLE_BASE__ ?? '../../../_samples/', relative);
  }
  return joinBase(window.__SAMPLE_BASE_HTTP__ ?? '/samples/', relative);
}

/** 音源格式：决定播放器是否提示「浏览器可能不支持」。 */
export function audioFormatOf(path: string | null | undefined): string {
  const match = path ? /\.([a-z0-9]+)(?:$|\?)/i.exec(path) : null;
  return (match?.[1] ?? '').toLowerCase();
}

export function fileUrlFromWindowsPath(path: string): string {
  return `file:///${encodeURI(path.replace(/\\/g, '/'))}`;
}

export function localRepoPath(owner: string, repo: string, localPath?: string): string {
  if (localPath) return localPath;
  return `F:\\coding音乐\\${owner}__${repo}`;
}
