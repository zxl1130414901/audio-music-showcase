# 设计说明（DESIGN）

> 本项目沿用 `F:\coding视频\showcase\app` 已验收的信息架构与视觉规范，替换为音频语境的取舍。
> 数据来自 `F:\coding音乐\showcase\data\*.json` 与 `F:\coding音乐\_samples\<id>\`，均为只读。

## 1. 信息架构

```text
应用
├─ 顶部栏：品牌 / 首页 · 全量矩阵 · A/B 试听 / 数据源与样例数
├─ 选型首页（#/，默认）
│  ├─ 口语搜索框（长句、场景、约束）
│  ├─ 6 项统计（项目 / 可试听 / 待补或做不了 / 声音类型 / 分类 / 样例总时长）
│  ├─ 「我想要的，是这种声音」声音类型入口（按 discovery.soundTypes 计数）
│  ├─ 「先按条件筛」约束 chip（多选 AND）
│  ├─ 搜索结果：场景判断 + 识别到的约束 + 仓库卡片
│  ├─ 场景卡（11 个真实需求问题）
│  ├─ 同需求对比样例组（并排 compact 播放器 + 一键 A/B）
│  └─ quickPicks / 风险提示
├─ 场景页（#/scenario/<id>）：首选卡（理由 / 上手时间 / 播放器 / 决策行）→ 其他候选
├─ 全量矩阵（#/all）：筛选面板 → 可排序表格 → 移动端卡片列表
├─ A/B 并排试听（#/ab/<a>/<b>）
│  ├─ 同步进度开关（先播放者为 leader）
│  ├─ 对比结论（六行：声音类型 / 听感定位 / 时长 / 运行门槛 / 何时选 / 何时别选）
│  └─ 两列完整播放器 + 决策行 + 元信息
└─ 详情页（#/repo/<id>）：试听与分段 → 决策行 → 能力 / 场景 / 流程 / 评分 / 对比 / 证据
```

## 2. 音频特有的四个决策支柱

### 2.1 先听再选

- 卡片、场景页、详情页、A/B 页都直接挂载 `<audio>`；卡片用 `compact` 紧凑播放器，详情页用完整播放器。
- 音源统一取 `_samples/<id>/sample.wav`（`mp3` / `m4a` / `ogg` / `flac` 也在扫描候选中）。
- 频谱图用构建期预生成的 `spectrogram.png`，播放头按 `currentTime / duration` 定位；`input[type=range]` 提供键盘可操作的进度条。
- 音频地址三分支：`file://` 单文件用 `../../../_samples/`，dev / preview 用 `/samples/`（中间件支持 HTTP Range 206，拖动不整包下载）。

### 2.2 分段高亮

- `meta.json` 的 `segments`（`startSec` / `endSec` / `capZh`）驱动时间轴列表；播放时按 `activeSegmentIndex` 高亮当前段，点分段可 seek。
- 段前显示「序章」状态；超过末段保持最后一段高亮；`aria-current` 与 `aria-live` 让键盘与读屏用户也能得到当前段说明。

### 2.3 A/B 并排试听

- `MAX_COMPARE = 2`；第三个选择被拒绝并给非阻塞提示。
- A/B 页两路 `<audio>` 独立播放；`syncTime` 只从「先开始播放的一条」流向另一条，避免新起播的一条把对方拉回 0；差值小于 0.35 秒时不重复 seek。
- 对比结论由 `buildABConclusion` 生成，只使用数据层能支撑的字段：声音类型、`signatureZh`、样例时长、GPU / CLI / Windows 门槛、`chooseWhenZh` / `avoidWhenZh`。缺失字段标「字段未就绪」，不编造结论。

### 2.4 决策行

`DecisionRow` 是卡片与详情的固定模块：一句声音辨识点 + 「什么时候选它」+ 「什么时候别选」+ 「常与它们对比」。

- 取值顺序：仓库字段优先，档案 `RepoDetail` 兜底，最后才用可解释的默认句。
- 任一条缺失就隐藏该行；三条全缺返回 `null`，不占位、不破版。

## 3. 口语搜索与筛选

1. `normalizeLongText`：全角转半角、中文数字转阿拉伯数字、去语气词、压缩空白；「我想给游戏做个 8 秒的爆炸音效」→「给游戏做个8秒的爆炸音效」。
2. `segmentLongQuery`：按标点与「要 / 还要 / 最好 / 但」等连接词切段，短句也保留整体。
3. 构建期意图语料：`data/intents.json` 缺失时使用内置 `fallbackIntents`；每段查询与仓库口语语料、场景 `questionZh` 计算加权相似度。
4. 场景识别有最低分（`SCENARIO_MIN_SCORE`）与置信度门槛，弱相关长句不会硬猜场景，只给候选词。
5. 约束识别把「没有显卡 / 命令行批量 / Windows / 8GB 显存 / 实时 / 图形界面 / 免安装」映射到 `discovery.constraints` 的真实 id，并在结果上标注。
6. Rerank：`needsGpu` 布尔口径、实时能力、CLI、安装复杂度、批量能力分别加减分；命中约束的仓库排在前面。
7. 声音类型入口：首页按 `soundTypes` 计数点击即筛；矩阵页可与其他筛选叠加（组内 OR、跨组 AND）。

## 4. 数据契约与降级

| 数据 | 位置 | 缺失时的行为 |
| --- | --- | --- |
| 仓库列表 | `data/repos.json` | 不存在则回落 `manifest.json` 并标注 mock |
| 档案 | `data/details/<id>.json` | `mergeDetail` 用基础字段合成，页面不空白 |
| 样例 | `_samples/<id>/` | 定版 30 `ok` / 24 `skipped` / 2 `failed`；非 ok 显示「为什么做不了」+「需要什么条件」；`missing` 仅在目录整体缺失时出现（本批 0） |
| 分段 | `meta.json → segments` | 无分段则只显示进度条与频谱，不渲染空时间轴 |
| 频谱 | `spectrogram.png` | 加载失败回退「频谱图生成中」，不破图 |
| 选型 | `data/discovery.json` | 内置 11 个音频场景、约束、声音类型、同需求样例组 |
| 语料 | `data/intents.json` | 内置回退语料 |

样例状态优先级：扫描到音频文件 → `ok`；否则读 `meta.status`（只允许 `skipped` / `failed`）；再否则读档案层 `blockerZh`（有阻断即 `failed`）；全无 → `missing`。定版 `repos.json` 的 `sample.status` 已按 `_samples` 逐条回填，30/24/2 与目录实扫一致。

`adapter` 统一做字段容错：真实档案的 `ceilingsZh`、`compareTips.whenZh`、detail 层 `blockerZh` / `whatItWouldNeed`、`capabilities.realtimeZh` 都会归一化；UI 不直接读原始 JSON。

## 5. 工程与离线

- `vite-plugin-singlefile` + `offlineClassicPlugin`：构建后唯一脚本转 IIFE 经典脚本，移除 `type="module"` / `crossorigin` / `import.meta`，双击 `dist/index.html` 即可打开。定版产物 1.09 MB（1,143,321 字节），内嵌 56 个项目与 30 条 `sample.wav` 路径。
- **离线分发必须整目录拷贝**：`dist` 与 `_samples` 的相对位置不能拆（`dist/index.html` 默认 `__SAMPLE_BASE__ = "../../../_samples/"`）。只拷 `index.html` 会页面正常但试听全 404；移动后要么保持三级相对路径，要么改这一处常量。
- 无 CDN、无联网字体、无外部图片；图标为内联 SVG。
- 构建期 `dataPlugin` 校验真实数据至少 40 条，样例数、档案数打在终端日志里，数据没就绪时不会静默出空站。
- `showcase\data\*.json` 与 `_samples` 只读；应用只消费，不写回。

## 6. 响应式与可访问性

- 断点：1024 / 768 / 480。≤768 隐藏矩阵表格、显示卡片列表；`repo-grid` / `scenario-grid` / `quick-picks` / `ab-grid` 单列；≤480 同需求对比样例组也改单列。
- 页面宽度 `calc(100% - 28px)`，所有网格用 `minmax(0, 1fr)`，长仓库名 `overflow-wrap: anywhere`，375 宽度无横向滚动。播放器本身也固定 `grid-template-columns: minmax(0, 1fr)`，长段落在窄屏下走省略号/换行，不再把页面撑宽。
- 播放器：`role="group"` + `aria-label="<仓库> 的音频试听"`；播放 / 暂停按钮写明动作；进度条 `aria-label`；分段按钮 `aria-current`；状态变化 `aria-live="polite"`。
- 所有交互控件可 Tab 聚焦，`:focus-visible` 有可见描边。

## 7. 测试

`src/**/*.test.ts`（Vitest，node 环境，22 个用例）：

- `segments`：段前 / 段中 / 末段后、段内进度、空段过滤。
- `decision`：仓库字段优先于档案，对比 id 去重去自身。
- `ab`：六行结论、差异标记、缺样例 caveat。
- `filter` / `soundType` / `constraints`：声音类型包含匹配、组内 OR 跨组 AND、布尔 `needsGpu`、实时派生。
- `hash`：A/B 与筛选往返、详情页来源参数。
- `discovery`：中文数字归一化、长句分段、两个真实口语句命中正确仓库、约束词映射、无关长句不猜场景。
- `adapter`：真实字段映射、样例扫描覆盖 `ok|skipped|failed`（非 ok 回填 `blockerZh` / `whatItWouldNeedZh`）、实时能力派生。
