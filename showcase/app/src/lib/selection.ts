export const MAX_COMPARE = 2;

export interface ToggleSelectionResult {
  ids: string[];
  rejected: boolean;
}

/** A/B 只保留两项：勾选已选项即取消；第三个会被拒绝并保留原选择。 */
export function toggleSelection(current: string[], id: string): ToggleSelectionResult {
  if (current.includes(id)) {
    return { ids: current.filter((item) => item !== id), rejected: false };
  }
  if (current.length >= MAX_COMPARE) {
    return { ids: current, rejected: true };
  }
  return { ids: [...current, id], rejected: false };
}

export function sanitizeSelection(ids: string[]): string[] {
  return [...new Set(ids.filter(Boolean))].slice(0, MAX_COMPARE);
}

export function canCompare(ids: string[]): boolean {
  return ids.length === MAX_COMPARE;
}
