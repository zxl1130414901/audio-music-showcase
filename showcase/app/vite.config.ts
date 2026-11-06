import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { IncomingMessage, ServerResponse } from 'node:http';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vitest/config';
import { viteSingleFile } from 'vite-plugin-singlefile';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const DIST_DIR = path.resolve(ROOT, 'dist');
const MUSIC_ROOT = 'F:\\coding音乐';
const SAMPLE_ROOT = path.resolve(MUSIC_ROOT, '_samples');
const DATA_DIR = path.resolve(ROOT, '../data');
const MIN_REPOS = 40;

const VIRTUAL_ID = 'virtual:showcase';
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

function fail(message: string): Error {
  return new Error(`\n[数据接入失败] ${message}\n`);
}

function readJson(file: string): unknown | null {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    console.warn(
      `[showcase-data] 跳过无法解析的文件：${file}（${error instanceof Error ? error.message : String(error)}）`,
    );
    return null;
  }
}

const AUDIO_CANDIDATES = ['sample.wav', 'sample.mp3', 'sample.m4a', 'sample.ogg', 'sample.flac'];

interface RawSampleScan {
  id: string;
  audioFile?: string;
  waveformFile?: string;
  spectrogramFile?: string;
  meta?: unknown;
  audioBytes?: number;
}

/** 只读扫描 _samples：目录存在什么就接什么，缺什么由 UI 降级，不在构建期补假文件。 */
function scanSamples(): Record<string, RawSampleScan> {
  const out: Record<string, RawSampleScan> = {};
  if (!fs.existsSync(SAMPLE_ROOT)) {
    console.warn(`[showcase-data] 样例目录不存在：${SAMPLE_ROOT}`);
    return out;
  }
  for (const entry of fs.readdirSync(SAMPLE_ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const id = entry.name;
    const dir = path.join(SAMPLE_ROOT, id);
    const item: RawSampleScan = { id };
    for (const candidate of AUDIO_CANDIDATES) {
      const file = path.join(dir, candidate);
      if (fs.existsSync(file)) {
        item.audioFile = candidate;
        item.audioBytes = fs.statSync(file).size;
        break;
      }
    }
    const waveform = path.join(dir, 'waveform.png');
    if (fs.existsSync(waveform)) item.waveformFile = 'waveform.png';
    const spectrogram = path.join(dir, 'spectrogram.png');
    if (fs.existsSync(spectrogram)) item.spectrogramFile = 'spectrogram.png';
    const metaFile = path.join(dir, 'meta.json');
    if (fs.existsSync(metaFile)) item.meta = readJson(metaFile);
    out[id] = item;
  }
  return out;
}

function collectDetails(): Record<string, unknown> {
  const detailsDir = path.join(DATA_DIR, 'details');
  const details: Record<string, unknown> = {};
  if (!fs.existsSync(detailsDir)) return details;
  for (const entry of fs.readdirSync(detailsDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
    const parsed = readJson(path.join(detailsDir, entry.name));
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const record = parsed as Record<string, unknown>;
      const id = typeof record.id === 'string' ? record.id : entry.name.replace(/\.json$/, '');
      details[id] = record;
    }
  }
  return details;
}

function optionalJson(relative: string): unknown | null {
  const file = path.join(DATA_DIR, relative);
  if (!fs.existsSync(file)) return null;
  return readJson(file);
}

function dataPlugin(): Plugin {
  let isBuild = false;
  return {
    name: 'showcase-data',
    configResolved(config) {
      isBuild = config.command === 'build';
    },
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null;
    },
    load(id) {
      if (id !== RESOLVED_ID) return null;

      const reposFile = path.join(DATA_DIR, 'repos.json');
      const manifestFile = path.resolve(MUSIC_ROOT, 'manifest.json');
      const hasRepos = fs.existsSync(reposFile);
      const file = hasRepos ? reposFile : manifestFile;
      if (!fs.existsSync(file)) {
        throw fail(`真实数据缺失，且 manifest.json 也不存在：${file}`);
      }

      const payload = readJson(file);
      if (payload === null) throw fail(`无法解析 ${file}`);
      const counts = Array.isArray(payload)
        ? payload.length
        : Array.isArray((payload as { repos?: unknown[] }).repos)
          ? ((payload as { repos: unknown[] }).repos ?? []).length
          : 0;
      if (counts === 0) throw fail(`数据文件 ${file} 没有可用的仓库记录。`);
      if (hasRepos && isBuild && counts < MIN_REPOS) {
        throw fail(`真实数据仅 ${counts} 条，低于验收下限 ${MIN_REPOS}：${reposFile}`);
      }

      const details = collectDetails();
      const samples = scanSamples();
      const sampleReady = Object.values(samples).filter((item) => item.audioFile).length;
      const discovery = optionalJson('discovery.json');
      const intents = optionalJson('intents.json');
      const evidence = optionalJson('evidence.json');
      const evidenceList = Array.isArray(evidence) ? evidence : [];

      console.warn(
        `[showcase-data] ${hasRepos ? '真实数据' : '占位数据（manifest）'}：${file} · ${counts} 个项目 · 档案 ${Object.keys(details).length} 份 · 可试听样例 ${sampleReady} 份 · 选型 ${discovery ? '已接入' : '内置回退'} · 语料 ${intents ? '已接入' : '内置回退'}`,
      );

      return `export const payloadKind = ${JSON.stringify(hasRepos ? 'repos' : 'manifest')};
export const reposPayload = ${JSON.stringify(payload)};
export const detailsPayload = ${JSON.stringify(details)};
export const evidencePayload = ${JSON.stringify(evidenceList)};
export const discoveryPayload = ${JSON.stringify(discovery)};
export const intentsPayload = ${JSON.stringify(intents)};
export const sampleIndexPayload = ${JSON.stringify(samples)};
export const dataSource = ${JSON.stringify({
        file: file.replace(/\\/g, '/'),
        detailsDir: path.join(DATA_DIR, 'details').replace(/\\/g, '/'),
        sampleRoot: SAMPLE_ROOT.replace(/\\/g, '/'),
        isSample: !hasRepos,
        loadedAt: new Date().toISOString(),
        detailCount: Object.keys(details).length,
        sampleCount: sampleReady,
        repoCount: counts,
      })};`;
    },
  };
}

const MIME: Record<string, string> = {
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.ogg': 'audio/ogg',
  '.flac': 'audio/flac',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.json': 'application/json',
};

function safeJoin(base: string, relative: string): string | null {
  const decoded = decodeURIComponent(relative.split('?')[0] ?? '');
  const resolved = path.resolve(base, `.${decoded.replace(/\\/g, '/')}`);
  const prefix = `${base}${path.sep}`;
  return resolved.startsWith(prefix) ? resolved : null;
}

/** 支持 Range 的静态服务：播放器拖动进度需要 206。 */
function serveFile(req: IncomingMessage, res: ServerResponse, filePath: string): void {
  let stat: fs.Stats;
  try {
    stat = fs.statSync(filePath);
  } catch {
    res.statusCode = 404;
    res.end('Not Found');
    return;
  }
  if (!stat.isFile()) {
    res.statusCode = 404;
    res.end('Not Found');
    return;
  }
  const mime = MIME[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Content-Type', mime);
  res.setHeader('Cache-Control', 'public, max-age=3600');

  const range = req.headers.range;
  if (range) {
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    const start = match?.[1] ? Number(match[1]) : 0;
    const end = match?.[2] ? Number(match[2]) : stat.size - 1;
    if (Number.isNaN(start) || Number.isNaN(end) || start >= stat.size) {
      res.statusCode = 416;
      res.setHeader('Content-Range', `bytes */${stat.size}`);
      res.end();
      return;
    }
    const safeEnd = Math.min(end, stat.size - 1);
    res.statusCode = 206;
    res.setHeader('Content-Range', `bytes ${start}-${safeEnd}/${stat.size}`);
    res.setHeader('Content-Length', String(safeEnd - start + 1));
    fs.createReadStream(filePath, { start, end: safeEnd }).pipe(res);
    return;
  }

  res.setHeader('Content-Length', String(stat.size));
  fs.createReadStream(filePath).pipe(res);
}

function sampleServePlugin(): Plugin {
  const handler = (req: IncomingMessage, res: ServerResponse, next: () => void): void => {
    const url = req.url ?? '';
    if (!url.startsWith('/samples/')) {
      next();
      return;
    }
    const file = safeJoin(SAMPLE_ROOT, url.slice('/samples'.length));
    if (!file) {
      res.statusCode = 403;
      res.end('Forbidden');
      return;
    }
    serveFile(req, res, file);
  };
  return {
    name: 'showcase-samples',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}

function runtimeConfigPlugin(): Plugin {
  const relativeSampleBase = `${path.relative(DIST_DIR, SAMPLE_ROOT).replace(/\\/g, '/')}/`;
  const inlineScript = [
    `window.__SAMPLE_BASE__=${JSON.stringify(relativeSampleBase)};`,
    `window.__SAMPLE_BASE_HTTP__="/samples/";`,
  ].join('');
  return {
    name: 'showcase-runtime-config',
    transformIndexHtml(html) {
      return {
        html,
        tags: [{ tag: 'script', children: inlineScript, injectTo: 'head-prepend' }],
      };
    },
  };
}

/** 单文件离线：把唯一的 module 脚本转成经典脚本，去掉 crossorigin。 */
function offlineClassicPlugin(): Plugin {
  return {
    name: 'showcase-offline-classic',
    closeBundle: {
      order: 'post',
      handler() {
        const file = path.join(DIST_DIR, 'index.html');
        if (!fs.existsSync(file)) return;
        const html = fs.readFileSync(file, 'utf8');
        const startTag = '<script type="module" crossorigin>';
        const start = html.indexOf(startTag);
        if (start < 0) {
          if (/<script[^>]*type="module"/.test(html)) {
            throw fail('离线构建失败：存在未识别的 module 脚本标记。');
          }
          return;
        }
        const close = html.indexOf('</script>', start);
        if (close < 0) throw fail('离线构建失败：module 脚本未闭合。');
        const code = html.slice(start + startTag.length, close).replace(/import\.meta\.url/g, '""');
        if (/\bimport\.meta\b/.test(code)) {
          throw fail('离线构建失败：脚本仍含 import.meta，无法转为经典脚本。');
        }
        const classic = `<script>(function(){"use strict";\n${code}\n})();</script>`;
        const stripped = html.slice(0, start) + html.slice(close + '</script>'.length);
        const withoutCrossOrigin = stripped.replace(
          /<(script|link|style)[^>]*crossorigin[^>]*>/g,
          (tag) => tag.replace(/ crossorigin(="[^"]*")?/, ''),
        );
        const out = withoutCrossOrigin.replace('</body>', () => `${classic}\n  </body>`);
        if (
          /<script[^>]*type="module"/.test(out) ||
          /<(?:script|link|style)[^>]*crossorigin/.test(out)
        ) {
          throw fail('离线构建失败：产物仍残留 module 或 crossorigin。');
        }
        fs.writeFileSync(file, out);
      },
    },
  };
}

export default defineConfig({
  base: './',
  publicDir: false,
  plugins: [
    react(),
    dataPlugin(),
    sampleServePlugin(),
    runtimeConfigPlugin(),
    viteSingleFile(),
    offlineClassicPlugin(),
  ],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: 1024 * 1024,
    cssCodeSplit: false,
    reportCompressedSize: false,
    target: 'es2020',
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
