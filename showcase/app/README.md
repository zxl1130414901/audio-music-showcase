# Audio ⇄ Matrix · 音频开源项目横评

一个离线可双击打开的「音频 / 音乐开源项目」选型站。核心不是比 Star，而是**先听 15–30 秒样例，再决定装哪个**。

- **定版数字（2026-11-07）**：56 个仓库、56 份档案、11 个真实需求场景；样例 **30 ok / 24 skipped / 2 failed**，共 678 秒（11:18）。
- 每个可试听仓库：`sample.wav` 真播（44.1 kHz，20–28.5 秒）+ `spectrogram.png` 频谱进度线 + 106 段中文分段高亮。
- 无样例不空白：`failed` / `skipped` 展示「为什么做不了」与「需要什么条件」；`missing` 仅为目录缺失时的保留态，本批不存在。
- 看过站点就能判断「我该用哪个」：决策行、声音类型入口、A/B 并排试听与六行对比结论。

## 快速开始

```bash
npm install        # 离线环境可直接复用已有 node_modules
npm run dev        # 开发预览（/samples 由 Vite 中间件提供，支持 Range）
npm test           # Vitest：22 个用例
npm run typecheck  # tsc --noEmit
npm run lint       # ESLint
npm run build      # 产出单文件 dist/index.html
npm run preview    # 预览构建产物（同样支持样例 Range 请求）
```

## 数据与样例

应用只读以下路径，**不要修改**：

```text
F:\coding音乐\showcase\data\
├─ repos.json            仓库主数据（56 条；真实数据到位后自动替代 manifest 回退）
├─ details\<id>.json     单仓库档案
├─ discovery.json        场景 / 约束 / 声音类型 / 同需求样例组 / 同义词
└─ intents.json          口语语料（缺失时使用内置回退）

F:\coding音乐\_samples\<id>\
├─ sample.wav            可试听音频（构建期扫描，存在即 status=ok）
├─ waveform.png          卡片缩略图
├─ spectrogram.png       频谱 + 播放头
├─ meta.json             segments / signatureZh / chooseWhenZh / blockerZh …
└─ cmd.txt               样例生成命令
```

构建日志会打印本次真实读取到的项目数、档案数、可试听样例数与语料来源：

```text
[showcase-data] 真实数据：...repos.json · 56 个项目 · 档案 56 份 · 可试听样例 30 份 · 选型 已接入 · 语料 内置回退
```

样例状态只允许 `ok` / `skipped` / `failed`，与 `_samples\<id>\meta.json` 逐条一致（`repos.json` 的 `sample` 字段与 `details\<id>.json` 的 `blockerZh` 已按 `_samples` 回填）：

- `ok`（30）：目录内 `sample.wav` + `waveform.png` + `spectrogram.png` + `meta.json` 齐全。
- `skipped`（24）/ `failed`（2）：目录内只有 `meta.json`，带真实 `blockerZh` 与 `whatItWouldNeed`；页面展示「为什么做不了」与「需要什么条件」，不破图、不报错。
- `missing` 仅为降级保留：只有样例目录整体缺失时才出现，本批为 0。

## 单文件离线构建

`npm run build` 生成 `dist/index.html`，JS/CSS 全部内联，无 `type="module"`、无 `crossorigin`、无 `import.meta`、无 CDN。

音频与图片按**相对路径**引用。构建时根据 `dist` 与 `_samples` 的实际位置写入：

```js
window.__SAMPLE_BASE__ = "../../../_samples/";
window.__SAMPLE_BASE_HTTP__ = "/samples/";
```

因此：

- 原地双击 `F:\coding音乐\showcase\app\dist\index.html` 即可试听（相对定位到 `F:\coding音乐\_samples`）。
- **离线分发必须整目录拷贝**：`dist` 不能单独拷走，必须保留下面这层相对位置，`_samples` 与 `dist` 一起搬：

```text
<分发根目录>\
├─ _samples\<id>\sample.wav        ← 30 个 ok 目录的音频/图片
├─ _samples\<id>\meta.json         ← 56 个目录都有
└─ showcase\app\dist\index.html    ← 单文件站点（__SAMPLE_BASE__ = "../../../_samples/"）
```

- 若不想保持 `dist` 与 `_samples` 相隔三级的结构，只能改 `dist/index.html` 里的 `__SAMPLE_BASE__`（例如同级部署改成 `"./_samples/"`）；除此之外没有运行时配置入口。

## 工程约定

- Vite 6 + React 18 + TypeScript 5.7（strict + `noUncheckedIndexedAccess`）。
- Hash 路由：`#/`、`#/all`、`#/scenario/<id>`、`#/repo/<id>`、`#/ab/<a>/<b>`。
- 单文件、无联网依赖；`prefers-reduced-motion` 下关闭动画。
- 375 宽度单列无横向溢出；播放器有 `aria-label`，分段与进度均可键盘操作。
- 定版验收：33 项 Playwright 检查全部通过（真实播放 / 分段 / A/B / 四档宽度 / 控制台），明细见 `F:\coding音乐\_reports\acceptance_playwright.md`。

设计取舍与数据契约见 [docs/DESIGN.md](docs/DESIGN.md)，当前进度见 [PROGRESS.md](PROGRESS.md)。
