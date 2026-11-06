/** 展示层格式化：数值、时间、体积、播放时钟。全部为纯函数。 */

const zhNumber = new Intl.NumberFormat('zh-CN');

export function formatNumber(value: number): string {
  return zhNumber.format(value);
}

/** 紧凑数字：23831 -> 23.8k。 */
export function formatCompactNumber(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return formatNumber(value);
}

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 100 || unit === 0 ? 0 : 1)} ${units[unit] ?? 'B'}`;
}

export function formatIsoDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

export function daysSince(iso: string, now: Date = new Date()): number {
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return Number.POSITIVE_INFINITY;
  return Math.max(0, (now.getTime() - time) / 86_400_000);
}

export function formatAge(iso: string, now: Date = new Date()): string {
  const days = daysSince(iso, now);
  if (!Number.isFinite(days)) return '—';
  if (days < 1) return '今天';
  if (days < 7) return `${Math.floor(days)} 天前`;
  if (days < 30) return `${Math.floor(days / 7)} 周前`;
  if (days < 365) return `${Math.floor(days / 30)} 个月前`;
  return `${Math.floor(days / 365)} 年前`;
}

/** 秒 -> 0:24 / 1:05.3（播放器时间轴统一格式）。 */
export function formatClock(seconds: number | null | undefined, withTenths = false): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = withTenths ? Math.round(seconds * 10) / 10 : Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total - minutes * 60;
  const tail = withTenths ? rest.toFixed(1).padStart(4, '0') : String(Math.floor(rest)).padStart(2, '0');
  return `${minutes}:${tail}`;
}

/** 时长一句话：24 秒样例 / 未标注时长。 */
export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return '时长未知';
  if (seconds < 60) return `${Math.round(seconds)} 秒`;
  return formatClock(seconds);
}

export function formatSampleRate(spec: { sampleRate?: number; channels?: number } | null): string {
  if (!spec?.sampleRate) return '—';
  const khz = spec.sampleRate / 1000;
  const channels = spec.channels === 1 ? '单声道' : spec.channels === 2 ? '立体声' : '';
  return `${khz % 1 === 0 ? khz.toFixed(0) : khz.toFixed(1)} kHz${channels ? ` · ${channels}` : ''}`;
}
