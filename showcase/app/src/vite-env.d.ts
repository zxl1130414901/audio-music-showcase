/// <reference types="vite/client" />

declare module 'virtual:showcase' {
  export const payloadKind: 'repos' | 'manifest';
  export const reposPayload: unknown;
  export const detailsPayload: Record<string, unknown>;
  export const evidencePayload: unknown[];
  export const discoveryPayload: unknown | null;
  export const intentsPayload: unknown | null;
  export const sampleIndexPayload: Record<string, unknown>;
  export const dataSource: {
    file: string;
    detailsDir: string;
    sampleRoot: string;
    isSample: boolean;
    loadedAt: string;
    detailCount: number;
    sampleCount: number;
    repoCount: number;
  };
}

interface Window {
  __SAMPLE_BASE__?: string;
  __SAMPLE_BASE_HTTP__?: string;
}
