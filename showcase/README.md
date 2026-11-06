# Showcase · 数据层 / 样例层 / 站点

`showcase` 是「音频开源项目横评」的数据与展示根目录：上层 `data` 存仓库与选型数据，`app` 是离线单文件站点，样例音频与图片放在同级 `..\_samples`。

## 定版数字（2026-11-07）

| 指标 | 数值 |
| --- | --- |
| 仓库 / 档案 | 56 / 56（id 一一对齐，缺 0、多 0） |
| 样例状态 | **30 ok · 24 skipped · 2 failed** |
| 可试听音频 | 30 条，全部 44.1 kHz PCM WAV，20–28.5 秒，合计 678 秒（11:18） |
| 分段 | 106 段（平均 3.5 段/条） |
| 选型 | 11 个场景、8 个声音类型、12 个分类、约束与同义词 |
| 构建产物 | `app\dist\index.html` 单文件 1.09 MB（1,143,321 字节） |

状态与 `_samples\<id>\meta.json` 逐条一致，只允许 `ok` / `skipped` / `failed`。

## 目录结构

```text
F:\coding音乐\
├─ <id>\                          56 个仓库源码克隆（id = owner__repo）
├─ _samples\<id>\                 56 个目录（样例层，只读）
│  ├─ sample.wav / waveform.png / spectrogram.png / meta.json / cmd.txt   ← 30 个 ok
│  └─ meta.json                                                            ← 24 skipped + 2 failed
├─ showcase\
│  ├─ data\
│  │  ├─ repos.json               56 条仓库主数据 + 已回填的 sample 字段
│  │  ├─ details\<id>.json        56 份档案（blockerZh 与 _samples 一致）
│  │  ├─ discovery.json           场景 / 约束 / 声音类型 / 同需求样例组
│  │  └─ intents.json             口语语料
│  ├─ app\                        前端源码 + dist 单文件产物
│  └─ scripts\validate-data.mjs   数据一致性校验脚本
└─ _reports\                      样例批次记录、环境探测、验收与定版报告
```

## 数据契约

`repos.json` 的每个 `sample` 字段由 `_samples` 实扫回填：

```json
{
  "status": "ok | skipped | failed",
  "audioPath": "_samples/<id>/sample.wav",
  "waveformPath": "_samples/<id>/waveform.png",
  "spectrogramPath": "_samples/<id>/spectrogram.png",
  "durationSec": 24.0,
  "spec": { "durationSec": 24.0, "sampleRate": 44100, "channels": 2, "codec": "pcm_s16le", "bytes": 2116800 },
  "segments": [{ "startSec": 0, "endSec": 8, "capZh": "序章…" }],
  "noteZh": "已出样：…",
  "blockerZh": null,
  "whatItWouldNeedZh": null,
  "pipeline": "official"
}
```

- `ok`：`audioPath` 与三张图路径齐全，`spec` / `segments` 来自目录实扫与 `meta.json`。
- 非 `ok`：`audioPath` / `spec` 为 `null`，`blockerZh` 与 `whatItWouldNeedZh` 必有内容，页面据此回答「为什么做不了」。
- `details\<id>.json` 的 `blockerZh` / `whatItWouldNeed` 与 `repos.json` 同一份文本；以 `_samples` 为准。

## 离线分发

**必须整目录拷贝**，`dist\index.html` 不能单独分发：

```text
<分发根目录>\
├─ _samples\<id>\...
└─ showcase\app\dist\index.html    ← __SAMPLE_BASE__ = "../../../_samples/"
```

保持这层相对关系即可双击打开并试听；若必须改结构，只能改 `dist\index.html` 里的 `__SAMPLE_BASE__`。

## 重建与校验

```powershell
cd F:\coding音乐\showcase\app
npm run build      # 单文件离线产物
npm run typecheck
npm test           # Vitest 22 例
cd F:\coding音乐
node showcase\scripts\validate-data.mjs
```

验收明细见 `..\_reports\acceptance_playwright.md`，定版报告见 `..\_reports\final_report.md`。
