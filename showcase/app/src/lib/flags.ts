/** GPU / CLI / Windows 的展示与排序口径（数据层已归一化成枚举）。 */

import type { CliSupport, GpuRequirement, WindowsSupport } from '../types/repo';

export type GpuLevel = GpuRequirement;
export type CliLevel = CliSupport;
export type WindowsLevel = WindowsSupport;

export const GPU_LABELS: Record<GpuLevel, string> = {
  required: '必需',
  optional: '可选',
  none: '无',
  unknown: '未知',
};

export const CLI_LABELS: Record<CliLevel, string> = {
  yes: '支持',
  partial: '部分',
  no: '不支持',
  unknown: '未知',
};

export const WINDOWS_LABELS: Record<WindowsLevel, string> = {
  works: '可用',
  workaround: '需绕路',
  broken: '不可用',
  unknown: '未验证',
};

export function gpuLevel(value: GpuRequirement | boolean | string): GpuLevel {
  if (typeof value === 'boolean') return value ? 'required' : 'none';
  if (value === 'required' || value === 'optional' || value === 'none' || value === 'unknown') {
    return value;
  }
  const raw = String(value).toLowerCase();
  if (/required|yes|must/.test(raw)) return 'required';
  if (/optional|partial|maybe/.test(raw)) return 'optional';
  if (/none|no|false/.test(raw)) return 'none';
  return 'unknown';
}

export function cliLevel(value: CliSupport | boolean | string): CliLevel {
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  if (value === 'yes' || value === 'partial' || value === 'no' || value === 'unknown') return value;
  const raw = String(value).toLowerCase();
  if (/yes|true|cli/.test(raw)) return 'yes';
  if (/partial/.test(raw)) return 'partial';
  if (/no|false|library/.test(raw)) return 'no';
  return 'unknown';
}

export function windowsLevel(value: WindowsSupport | boolean | string): WindowsLevel {
  if (typeof value === 'boolean') return value ? 'works' : 'broken';
  if (value === 'works' || value === 'workaround' || value === 'broken' || value === 'unknown') {
    return value;
  }
  const raw = String(value).toLowerCase();
  if (/works|yes|true|native/.test(raw)) return 'works';
  if (/workaround|partial|wsl/.test(raw)) return 'workaround';
  if (/broken|no|false|mac/.test(raw)) return 'broken';
  return 'unknown';
}

/** 筛选口径：Windows「可用」包含官方可用与需绕路。 */
export function windowsFilterValue(value: WindowsSupport | boolean | string): boolean {
  const level = windowsLevel(value);
  return level === 'works' || level === 'workaround';
}

/** 筛选口径：GPU「需要」把必需与可选都算上。 */
export function gpuFilterValue(value: GpuRequirement | boolean | string): boolean {
  const level = gpuLevel(value);
  return level === 'required' || level === 'optional';
}

export function gpuRank(value: GpuRequirement): number {
  return { unknown: 0, none: 1, optional: 2, required: 3 }[gpuLevel(value)];
}

export function cliRank(value: CliSupport): number {
  return { unknown: 0, no: 1, partial: 2, yes: 3 }[cliLevel(value)];
}

export function windowsRank(value: WindowsSupport): number {
  return { unknown: 0, broken: 1, workaround: 2, works: 3 }[windowsLevel(value)];
}

export function gpuTone(value: GpuRequirement): string {
  const level = gpuLevel(value);
  if (level === 'required') return 'is-accent';
  if (level === 'optional') return 'is-yes';
  return 'is-no';
}

export function cliTone(value: CliSupport): string {
  const level = cliLevel(value);
  if (level === 'yes') return 'is-yes';
  if (level === 'partial') return 'is-warn';
  return 'is-no';
}

export function windowsTone(value: WindowsSupport): string {
  const level = windowsLevel(value);
  if (level === 'works') return 'is-yes';
  if (level === 'workaround') return 'is-warn';
  return 'is-no';
}
