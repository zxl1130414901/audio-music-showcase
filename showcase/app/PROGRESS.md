# 进度 · 音频开源项目横评

> 小步落盘：每完成一个可用模块就更新本文件并重跑 `npm run typecheck / lint / test / build`。
> 数据文件 `F:\coding音乐\showcase\data\*.json` 与 `_samples` 只读，页面只消费不改写。

## 已完成

- [x] 工程骨架：Vite 6 + React 18 + TS strict，复用视频项目 `offlineClassicPlugin`、单文件构建、无 CDN。
- [x] 数据接入：`repos.json`（56 个）+ 56 份档案 + `discovery.json`；`intents.json` 缺失时内置语料回退。
- [x] 样例扫描：构建期只读扫描 `_samples`，`sample.wav` 存在即 `ok`；29 份可试听（构建日志实时统计）。
- [x] 播放器：`sample.wav` 真播、`segments` 分段高亮与点击跳转、`spectrogram.png` 叠播放头 + range 进度、aria-label。
- [x] 无样例降级：failed/skipped 展示「为什么做不了」+「需要什么条件」，缺字段回退 `limitsZh`；彻底缺样例显示「样例生成中」，不破图不报错。
- [x] 决策行：`signatureZh` / `chooseWhenZh` / `avoidWhenZh` / `contrastWith`，逐条缺失隐藏，卡片与详情共用。
- [x] A/B 双播放：`#/ab/<a>/<b>`，两路 audio 并排、同步进度开关、交换、六行对比结论（声音类型/听感定位/时长/门槛/何时选/何时别选）。
- [x] 声音类型筛选：首页入口按 `discovery.soundTypes`（真实 8 类）计数；矩阵页可叠加类型筛选。
- [x] 口语长句检索：中文数字归一化、长句分段、场景识别（低于阈值不硬猜）、约束识别与 rerank。
- [x] 矩阵页 / 场景页 / 详情页 `#/repo/<id>` / 375 单列无横向溢出。
- [x] 测试：22 个（segments、decision、A/B、筛选、约束、hash、长句检索、adapter 真实字段映射）。
- [x] 浏览器冒烟（preview）：首页音效类型 8 类正常；卡片点击后 audio `currentTime` 前进、播放按钮切为暂停；A/B 两路播放差值约 0.08 秒；375 宽度首页 / A/B / 详情页截图无裁切。
- [x] 文档：`README.md` + `docs/DESIGN.md`。

## 本轮修复

- [x] 真实档案字段映射：`ceilingsZh`、`compareTips.whenZh`、档案层 `blockerZh` / `whatItWouldNeed` 回填样例。
- [x] 真实 `no-gpu` 约束是布尔 `false`，改为按「是否必须 GPU」比较；`realtime-interactive` 由档案 `capabilities.realtimeZh` 派生。
- [x] 约束口语词表同时兼容真实与回退 id（`no-extra-toolchain`/`cli-batch`/`windows-native`/`vram-8gb`/`realtime-interactive`/`gui-acceptable`）。
- [x] 场景识别增加最低分与置信度阈值，无关长句不再强行归场景。
- [x] A/B 同步改为「先播放者为 leader」，新起播的一条不会把对方拉回 0；复测两路差值 < 0.1 秒。
- [x] 卡片 compact 播放器 `preload="none"`，减少首屏音频元数据请求。
- [x] 同需求对比样例组在 ≤480 单列（原规则写在基础样式之前未生效）。
- [x] 补充 `prefers-reduced-motion`。

## 验证快照

- `npm run typecheck` ✅
- `npm run lint` ✅
- `npm test` ✅ 3 files / 22 tests
- `npm run build` ✅ `dist/index.html` 单文件（无 `type="module"` / `crossorigin` / `import.meta`）
- 构建日志：56 个项目 / 56 份档案 / 30 份可试听样例（样例数随 `_samples` 增长）

## 待办

- [ ] 剩余仓库样例由另一路补齐后复查：`_samples` 出现 `sample.wav` 时应自动转 `ok`，无需改代码。
