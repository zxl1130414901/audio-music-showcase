# 音乐 / 音效开源项目横评 · 定版

一个离线可双击打开的选型站：**先听 20–30 秒真实样例，再决定装哪个**。覆盖 56 个音频 / 音乐开源仓库，30 个有本机实测音频，26 个如实记录「为什么做不了」。

## 获取与打开（GitHub）

```bash
git lfs install
git clone https://github.com/zxl1130414901/audio-music-showcase.git
cd audio-music-showcase
git lfs pull
```

克隆后双击 `showcase/app/dist/index.html` 即可离线浏览（Chrome 直接打开 `file://`，无需服务器、无需联网）。

> **音频走 Git LFS**：30 条 `sample.wav` 共约 103 MB。若没装 LFS 或没执行 `git lfs pull`，页面能打开，但试听会全部 404。

> **分发必须整目录拷贝**：`dist` 依赖同级 `..\_samples`，不能只拷 `index.html`。详见 [离线分发](#离线分发)。
>
> **未开启 GitHub Pages**：`__SAMPLE_BASE__` 指向 `../../../_samples/`，在 Pages 下会 404，原因见 [为什么没开 GitHub Pages](#为什么没开-github-pages)。

## 定版数字（2026-11-07）

| 指标 | 数值 |
| --- | --- |
| 仓库 / 档案 | 56 / 56（id 完全对齐） |
| 样例 | **30 ok / 24 skipped / 2 failed** |
| 可试听音频 | 30 条 44.1 kHz WAV，20–28.5 秒，合计 11:18 |
| 分段 | 106 段中文高亮 |
| 选型 | 11 个场景、8 个声音类型、12 个分类 |
| 站点 | 单文件 1.09 MB，无 `type="module"` / `crossorigin` / `import.meta` / CDN |
| 验收 | Playwright 33/33 通过（真实播放、A/B、26 个非 ok 页面、四档宽度、0 error） |

## 目录

```text
audio-music-showcase\
├─ showcase\               站点工程与离线产物
│  ├─ app\                React + Vite 源码；dist\index.html = 单文件产物（1.09 MB）
│  ├─ data\               repos.json（56 条，含已回填 sample）/ details\（56 份）/ discovery.json / evidence.json
│  ├─ scripts\            validate-data.mjs
│  └─ README.md
├─ _samples\<id>\          样例层（只读）：30 个 ok 含 sample.wav + 波形 + 频谱 + meta.json + cmd.txt；26 个非 ok 只有 meta.json
├─ _reports\               final_report.md / acceptance_playwright.md
├─ manifest.json / manifest.md
└─ README.md
```

未发布：56 个上游源码克隆 `<owner>__<repo>\`、`_env\`、`_models\`、`_tmp\`、`node_modules\`、构建缓存、其余批次日志。

## 数据真实性

- `_samples\<id>\meta.json` 是唯一权威：`status` 只允许 `ok` / `skipped` / `failed`，`repos.json` 与 `details\<id>.json` 均按它回填。
- 30 个 ok 的时长、采样率、声道、字节数来自实际音频文件；26 个非 ok 的 `blockerZh` / `whatItWouldNeedZh` 来自本机真实尝试或真实缺口，不编造、不占位。
- 所有播放结论来自 Playwright 实测 `<audio>` 的 `currentTime` / `readyState`，记录在 `_reports\acceptance_playwright.md`。

## 离线分发

保持下面结构整体拷贝，相对路径才成立：

```text
<分发根目录>\
├─ _samples\<id>\...
└─ showcase\app\dist\index.html    ← __SAMPLE_BASE__ = "../../../_samples/"
```

只拷 `index.html` 会出现「页面正常、试听全 404」。若必须改结构，只能改 `dist\index.html` 里的 `__SAMPLE_BASE__` 常量。

## 为什么没开 GitHub Pages

`dist\index.html` 里的 `__SAMPLE_BASE__` 是相对路径 `../../../_samples/`。Pages 只托管仓库根（`main` 分支），站点地址是 `https://zxl1130414901.github.io/audio-music-showcase/showcase/app/dist/index.html`，向上三级落到 `https://zxl1130414901.github.io/`，`_samples` 必然 404，试听全挂。要上 Pages 得改常量、把样例并进发布目录、音频改外链，本次不做，所以请按上面的方式克隆后本地双击浏览。

## 本机硬边界（26 个非 ok 的根因）

- **GPU**：RTX 4060 Laptop，**8 GB 显存**；10–22 GB 权重的模型直接排除。
- **工具链**：**无 MSVC / CMake / Qt / .NET SDK / Swift**，C++、C#、Qt、Apple 平台项目无法现场构建。
- **网络**：**HuggingFace 直连不通**，只能走镜像且速度会掉到 ≈1 MB/s；大权重（>10 GB）在单仓库时限内拉不完。
- **平台**：Windows 本机，Linux/KDE、macOS/iOS 专属产物无法运行。
- **产物形态**：纯 GUI、DAW 插件、灯光硬件、视频/图像项目，没有可脚本化的耳机可验收音频输出。

## 文档

- 站点说明：[showcase/app/README.md](showcase/app/README.md)
- 数据 / 样例层：[showcase/README.md](showcase/README.md)
- 设计取舍：[showcase/app/docs/DESIGN.md](showcase/app/docs/DESIGN.md)
- 验收：`_reports\acceptance_playwright.md`
- 定版报告：`_reports\final_report.md`
