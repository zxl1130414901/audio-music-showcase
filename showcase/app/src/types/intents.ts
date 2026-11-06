/** 构建期口语语料（运行时不请求网络）；数据缺失时使用内置音频语料。 */

export interface IntentEntry {
  /** 用户口吻的说法，12–30 字，第一人称，可带条件从句。 */
  q: string;
  /** discovery.json 的场景 id；空字符串表示只有通用需求。 */
  scenario: string;
}

export interface IntentDoc {
  updatedAt?: string;
  repos: Record<string, IntentEntry[]>;
  scenarios: Record<string, string[]>;
  global: string[];
}

export function emptyIntents(): IntentDoc {
  return { repos: {}, scenarios: {}, global: [] };
}
