# 定版报告 · 音乐 / 音效开源项目横评站

日期：2026-11-07 ｜ 项目根：`F:\coding音乐` ｜ 产物：`showcase\app\dist\index.html`

## 1. 结论

数据、构建、验收三步全部完成，站点可作为定版分发。

- 56 个仓库与 56 个样例目录**一一对齐**，无缺失、无多余。
- 样例状态实扫为 **30 ok / 24 skipped / 2 failed**，`repos.json`、`details\<id>.json` 与 `_samples\<id>\meta.json` 已逐条一致。
- 单文件离线构建通过：1.09 MB（1,143,321 字节），无 `type="module"`、`crossorigin`、`import.meta`、CDN；默认 Chrome 裸开 `file://` 可渲染、可播放。
- Playwright 33 项检查 **33/33 通过**，证据见 `_reports\acceptance_playwright.md`。

## 2. 最终统计

| 指标 | 数值 |
| --- | --- |
| 仓库 / 档案 | 56 / 56 |
| ok | **30** |
| skipped | **24** |
| failed | **2**（`surge-synthesizer__surge`、`MTG__essentia`，均为实际尝试后失败） |
| 可试听音频 | 30 条，全部 44.1 kHz PCM WAV；18 立体声带 codec 标注、6 立体声、6 单声道 |
| 时长 | 单条 18.95–28.5 秒，合计 **678.14 秒（11:18）** |
| 分段 | 106 段，平均 3.5 段/条 |
| 选型 | 11 个场景、8 个声音类型、12 个分类 |
| 站点 | 1.09 MB 单文件；`__SAMPLE_BASE__ = "../../../_samples/"` |
| 测试 | Typecheck 通过、Vitest 22/22、Playwright 33/33 |

## 3. 30 个 ok 清单

| # | 仓库 | 时长 | 采样率 | 一句话特点 |
| --- | --- | --- | --- | --- |
| 1 | Anjok07/ultimatevocalremovergui | 24.00 s | 44.1 kHz | 人声/伴奏分离，接缝 0.25 秒交叉淡化 |
| 2 | facebookresearch/audiocraft | 20.00 s | 44.1 kHz | 一句文本生成带段落起伏的完整混音 |
| 3 | supercollider/supercollider | 18.95 s | 44.1 kHz | 室内电子乐+拨弦，三段推进、收尾干净 |
| 4 | tyiannak/pyAudioAnalysis | 20.70 s | 44.1 kHz | 按「谁在说」把长录音剪成对话集锦 |
| 5 | aubio/aubio | 23.90 s | 44.1 kHz | 起音/BPM/基频测量后驱动打点与切片 |
| 6 | libAudioFlux/audioFlux | 24.00 s | 44.1 kHz | 纯 C STFT，24 秒双声道往返约 0.7 秒 |
| 7 | grame-cncm/faust | 22.50 s | 44.1 kHz | 加法管风琴，泛音分层 + 教堂混响 |
| 8 | pkalogiros/AudioMass | 25.00 s | 44.1 kHz | 浏览器里裁歌：淡入 + 压 1.5 dB 保留瞬态 |
| 9 | chaosprint/glicol | 28.00 s | 44.1 kHz | 代码即乐谱的极简等距琶音 |
| 10 | pytorch/audio | 20.00 s | 44.1 kHz | 同一段旋律依次滤波、移调、加回声 |
| 11 | haoheliu/AudioLDM | 20.18 s | 44.1 kHz | 16 kHz 文生雨声，「糊而贴题」 |
| 12 | sergree/matchering | 22.00 s | 44.1 kHz | 向参考曲对齐亮度与响度，尾段不泵浦 |
| 13 | FluidSynth/fluidsynth | 24.00 s | 44.1 kHz | SF2 完整渲染链，默认 chorus + reverb |
| 14 | hkchengrex/MMAudio | 23.77 s | 44.1 kHz | 篝火画面生成：噼啪→低频轰鸣→余烬 |
| 15 | JorenSix/TarsosDSP | 22.52 s | 44.1 kHz | YIN 跟踪音高重建为「电子长笛」 |
| 16 | milkytracker/MilkyTracker | 28.50 s | 44.1 kHz | 8-bit 硬边采样 + 方整步进颗粒感 |
| 17 | ZFTurbo/Music-Source-Separation-Training | 23.32 s | 44.1 kHz | 迪斯科全混音 → 干净人声 / 纯伴奏 |
| 18 | cycfi/q | 20.10 s | 44.1 kHz | DX7 电钢琴的六算子玻璃味泛音 |
| 19 | DBraun/DawDreamer | 19.82 s | 44.1 kHz | 四段式合成小品，段落间换和弦加声部 |
| 20 | SamiPerttu/fundsp | 20.00 s | 44.1 kHz | 模块化机架感的节奏电子小品 |
| 21 | KinWaiCheuk/nnAudio | 24.00 s | 44.1 kHz | GPU 可微 STFT/iSTFT，梳状掩码与相位重建 |
| 22 | Natooz/MidiTok | 28.00 s | 44.1 kHz | MIDI→18394 token→4308 音符原样往返 |
| 23 | schellingb/TinySoundFont | 24.00 s | 44.1 kHz | 单文件 SoundFont 裸采样，干声无混响 |
| 24 | teticio/audio-diffusion | 22.48 s | 44.1 kHz | mel 扩散生成的嘻哈 loop，高频偏软 |
| 25 | torchsynth/torchsynth | 20.00 s | 44.1 kHz | 干净合成器音色，包络切出音符边界 |
| 26 | haidog-yaqub/EzAudio | 24.40 s | 44.1 kHz | 扩散「画」出的雨与雷，缺真实微观细节 |
| 27 | Signalsmith-Audio/dsp | 20.00 s | 44.1 kHz | 低通缓慢张开的小调琶音 + 圆润回声 |
| 28 | djfun/audio-visualizer-python | 22.00 s | 44.1 kHz | 音频不动，画面逐帧咬住节拍 |
| 29 | thxxx/VTS | 22.00 s | 44.1 kHz | 噪声草图 + 文本生成雨夜街景声 |
| 30 | Orastron/brickworks | 20.00 s | 44.1 kHz | 高 Q 滤波酸味扫频，两条失谐声部撑立体声 |

## 4. 26 个非 ok 的分类归因

按**主要缺失类型**归并，每类只列成员与一句根因（完整阻断文本在各 `_samples\<id>\meta.json` 与详情页）。

### A. 平台 / 编译工具链缺失（10）

本机 Windows、无 MSVC/CMake/Qt/.NET SDK/Swift，或项目本身锁定 Linux / Apple 平台。

- `AudioKit/AudioKit`、`syedhali/EZAudio` — Swift / Objective-C，只能 macOS/iOS。
- `naudio/NAudio`、`squiggythings/WaveTracker` — 需 .NET SDK 才有产物，且只有 GUI Demo。
- `surge-synthesizer/surge`（failed）、`MTG/essentia`（failed） — 子模块为空 / 无 cp313 wheel，需 MSVC + CMake 现场编译。
- `stargatedaw/stargate` — Makefile + C++ 与三个空子模块，无预编译包。
- `BambooTracker/BambooTracker` — Qt6 + CMake + 三个子模块，官方只发 GUI。
- `Ameobea/web-synth` — 需 Rust wasm32、wasm-bindgen、binaryen 与 MSVC 链接器。
- `alibaba/unified-audio` — environment.yml 仅 linux-64，Python 3.13 无轮子。

### B. 权重体积 / 带宽 / 显存超限（5）

8 GB 显存与单仓库时限内拉不完 10–22 GB 权重。

- `Text-to-Audio/AudioLCM` — 11.3 GB 权重，镜像后段掉到 ≈1.1 MB/s。
- `ivcylc/OpenMusic` — 数 GB QA-MDT 权重，HF 直连与镜像均不可用。
- `BazedFrog/SongGeneration-Studio` — 官方标注 base 需 10 GB、large 需 22 GB 显存。
- `TencentARC/AudioStory` — 约 10 GB 权重，长音频建议 ≥16 GB 显存。
- `SAIL-PRLab/Foley-Omni` — 单文件 22.2 GB + T5 11.4 GB，5B 视频分支需 ≥24 GB。

### C. gated 授权未申请（2）

- `Stability-AI/stable-audio-tools` — HF gated=auto，需 Token 接受许可。
- `lks-ai/ComfyUI-StableAudioSampler` — 同上，且依赖完整 ComfyUI 宿主。

### D. 无预训练权重、必须自训（2）

- `lucidrains/audiolm-pytorch`、`lucidrains/soundstorm-pytorch` — 仓库只有模型定义，SoundStream 编码器与 Transformer 均需大规模语料自训。

### E. 产物不是可交付音频（3）

- `kosua20/MIDIVisualizer` — README 明示不发声，只输出图像/视频。
- `scottlawsonbc/audio-reactive-led-strip` — 驱动 LED 灯带，需硬件且不产出音频。
- `luisbocanegra/plasma-audio-visualizer` — KDE Plasma 6 桌面频谱插件，仅 Linux。

### F. 纯 GUI / 无 headless 导出（4）

- `DISTRHO/Cardinal` — 90+ 子模块的 JUCE 机架，无 headless 入口。
- `steffest/BassoonTracker` — 浅克隆缺 `live/` 构建产物，WebAudio 入口加载失败。
- `kvoltmer/Audionaut` — JUCE 桌面 App，MCP 仍需先开 GUI，安装写 C 盘。
- `mlm-games/yadaw` — Rust egui GUI DAW，无导出 CLI。

## 5. 本机硬边界

| 边界 | 具体限制 | 影响 |
| --- | --- | --- |
| GPU | RTX 4060 Laptop，**8 GB 显存** | 10 GB+ 权重模型与 5B 视频分支无法推理 |
| 编译工具链 | **无 MSVC / CMake / Qt / .NET SDK / Swift** | C++、C#、Qt、Apple 项目不能现场构建 |
| 网络 | **HuggingFace 直连不通**，镜像后段 ≈1 MB/s | 大权重在单仓库时限内拉不完，gated 模型不绕过 |
| 平台 | Windows 本机 | Linux/KDE、macOS/iOS 专属产物不可运行 |
| 时间 / 额度 | 单仓库 ≤30 分钟、权重总额度 15 GB | 编译型与多 GB 权重项目优先归档 skipped |

## 6. 本版改动与验收记录

**数据回填**

- `repos.json` 56 条 `sample` 按 `_samples` 重写：状态、音频/波形/频谱路径、`spec`、`segments`、`signatureZh`、`blockerZh`、`whatItWouldNeedZh`。
- `details\<id>.json` 同步 `blockerZh` / `whatItWouldNeed`；`surge` 与 `alibaba__unified-audio` 的 meta 未写 blocker，沿用 details 原文并两处统一。

**构建与 UI 修正**

- 矩阵表头有「时长」列但行内缺格 → 补 `formatDuration` 单元格，消除整列错位。
- 长文案 `nowrap` 与播放器自动列宽在窄屏撑破页面 → 播放器改 `grid-template-columns: minmax(0, 1fr)`，`.chip-row .tone` 允许换行。
- 重建产物：1.09 MB，30 条样例路径全部内嵌。

**验收结果（Playwright，默认 Chrome）**

- 首页 56/30/26、8 个声音类型计数、11 张场景卡首选全部就绪。
- 矩阵 56 行，30 ✓ / 24 未出样 / 2 做不了；筛选「可试听」30、「待补」26；声音类型计数逐项等于数据。
- 5 个不同仓库真播：`currentTime` 1.16–1.70 s、`readyState=4`、分段高亮随跳段切换。
- A/B 两路同时播放（`readyState=4`），对比结论 184 字 / 6 行。
- 30 个 ok 详情均为可播放器；26 个非 ok 全部显示「为什么做不了」；0 破图。
- 375 / 768 / 1024 / 1440 无横向溢出；控制台 0 error、0 JS 异常。

## 7. 分发说明

**必须整目录拷贝**，`dist` 与 `_samples` 的相对位置不可拆：

```text
<分发根目录>\
├─ _samples\<id>\...
└─ showcase\app\dist\index.html    ← __SAMPLE_BASE__ = "../../../_samples/"
```

只拷 `index.html` 会导致页面正常但试听全 404；如需改结构，只能改该常量。站点无联网依赖，默认 Chrome 双击即可。
