# Playwright 定版验收

- 页面：`file:///F:/coding音乐/showcase/app/dist/index.html`
- 浏览器：本机 Chrome（`channel=chrome`，headless 默认参数）
- 结论：**33 / 33 通过**

| 检查项 | 结果 | 细节 |
|---|---|---|
| 首页 56 个项目 | PASS | ['56', '30', '26', '8', '12', '11:18'] |
| 首页 30 份可试听 | PASS | 30 |
| 首页 26 待补/做不了 | PASS | 26 |
| 首页声音类型数 | PASS | 8 vs 期望 8 |
| 首页分类数 | PASS | 12 vs 期望 12 |
| 首页副标题 56/30 | PASS | 56 个音效 / 音乐开源项目 · 30 份样例 |
| 场景卡 11 张 | PASS | 11 |
| 场景卡首选均已就绪 | PASS | 未就绪 0 |
| 首页声音类型计数 | PASS | 神经网络生成=16(期望16)；采样乐器=4(期望4)；纯合成=18(期望18)；环境音=7(期望7)；语音=7(期望7)；可视化=4(期望4)；处理与转码=14(期望14)；分析=7(期望7) |
| 首页裸开可播放 | PASS | {'t': 0.902343, 'rs': 4, 'paused': False, 'dur': 20, 'err': None, 'src': 'file:///F:/coding%E9%9F%B3%E4%B9%90/_samples/facebookresearch__audiocraft/sample.wav'} |
| 矩阵 56 行 | PASS | 56 |
| 矩阵 30 可试听 | PASS | 30 |
| 矩阵 24 未出样 | PASS | 24 |
| 矩阵 2 做不了 | PASS | 2 |
| 筛选可试听=30 | PASS | 共 30 / 56 个项目 · 1 个筛选条件 |
| 筛选待补=26 | PASS | 共 26 / 56 个项目 · 1 个筛选条件 |
| 矩阵声音类型筛选计数 | PASS | 采样乐器=3(期望3)；处理与转码=14(期望14)；纯合成=15(期望15)；分析=7(期望7)；环境音=7(期望7)；可视化=4(期望4)；神经网络生成=16(期望16)；语音=7(期望7) |
| 30 个 ok 详情均为可播放器 | PASS | [] |
| 26 个非 ok 详情均为「做不了」样式 | PASS | [] |
| 26 个非 ok 详情均有「为什么做不了」 | PASS | [] |
| 全部详情页无破图 | PASS | [] |
| 播放 FluidSynth__fluidsynth | PASS | {'t': 1.163965, 'rs': 4, 'paused': False, 'dur': 24, 'err': None, 'src': 'file:///F:/coding%E9%9F%B3%E4%B9%90/_samples/FluidSynth__fluidsynth/sample.wav'} |
| 播放 milkytracker__MilkyTracker | PASS | {'t': 1.678359, 'rs': 4, 'paused': False, 'dur': 28.5, 'err': None, 'src': 'file:///F:/coding%E9%9F%B3%E4%B9%90/_samples/milkytracker__MilkyTracker/sample.wav'} |
| 播放 pkalogiros__AudioMass | PASS | {'t': 1.684809, 'rs': 4, 'paused': False, 'dur': 25, 'err': None, 'src': 'file:///F:/coding%E9%9F%B3%E4%B9%90/_samples/pkalogiros__AudioMass/sample.wav'} |
| 播放 SamiPerttu__fundsp | PASS | {'t': 1.683783, 'rs': 4, 'paused': False, 'dur': 20, 'err': None, 'src': 'file:///F:/coding%E9%9F%B3%E4%B9%90/_samples/SamiPerttu__fundsp/sample.wav'} |
| 播放 hkchengrex__MMAudio | PASS | {'t': 1.697751, 'rs': 4, 'paused': False, 'dur': 23.773333, 'err': None, 'src': 'file:///F:/coding%E9%9F%B3%E4%B9%90/_samples/hkchengrex__MMAudio/sample.wav'} |
| 5 个仓库分段高亮随时间轴切换 | PASS | [] |
| A/B A 路可播放 | PASS | {'t': 2.118233, 'rs': 4, 'paused': False, 'dur': 24, 'err': None, 'src': 'file:///F:/coding%E9%9F%B3%E4%B9%90/_samples/FluidSynth__fluidsynth/sample.wav'} |
| A/B B 路可播放 | PASS | {'t': 2.040333, 'rs': 4, 'paused': False, 'dur': 24, 'err': None, 'src': 'file:///F:/coding%E9%9F%B3%E4%B9%90/_samples/schellingb__TinySoundFont/sample.wav'} |
| A/B 对比结论有内容 | PASS | 184 字 / 6 行 / fluidsynth 是「采样乐器」，TinySoundFont 是「采样乐器」。两条样例都是 24 |
| 375/768/1024/1440 无横向溢出 | PASS | [] |
| 控制台 0 error | PASS | [] |
| 无 JS 异常 | PASS | [] |
