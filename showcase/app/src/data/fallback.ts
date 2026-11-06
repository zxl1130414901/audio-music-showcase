import type { DiscoveryDoc } from '../types/discovery';
import { emptyDiscovery } from '../types/discovery';
import type { IntentDoc } from '../types/intents';

/** 真 discovery.json 未落地时的音频选型契约（与真实文件同形状，可无缝替换）。 */
export const fallbackDiscovery: DiscoveryDoc = {
  ...emptyDiscovery(),
  updatedAt: '2026-11-06',
  scenarios: [
    {
      id: 'bgm',
      titleZh: '给视频 / 游戏配 BGM',
      descZh: '需要一段能直接用的背景音乐，最好有现成模型或音源。',
      questionZh: '我想给视频配一段背景音乐',
      recommended: [
        {
          repoId: 'facebookresearch__audiocraft',
          verdict: 'first',
          whyZh: 'MusicGen 是少见的「文本/旋律双条件」音乐生成，24 秒样例音色最像成品配乐。',
          timeZh: '有显卡约 30 分钟',
        },
        {
          repoId: 'Stability-AI__stable-audio-tools',
          verdict: 'alt',
          whyZh: 'Stable Audio 系更偏环境与氛围，出样稳定，但生态门槛更高。',
          timeZh: '约 1 小时',
        },
      ],
      filters: { categories: ['音乐生成'], tags: ['music generation'], soundTypes: ['神经网络生成'] },
    },
    {
      id: 'sfx',
      titleZh: '给游戏做音效',
      descZh: '爆炸、脚步、打击感，要短、要能批量拿。',
      questionZh: '我想做几个 8 秒的爆炸音效',
      recommended: [
        {
          repoId: 'haoheliu__AudioLDM',
          verdict: 'first',
          whyZh: '文本到音频，爆炸/环境类名词命中率高，样例就是短音效。',
          timeZh: '有显卡约 40 分钟',
        },
        {
          repoId: 'hkchengrex__MMAudio',
          verdict: 'alt',
          whyZh: '音频与画面联合生成，适合给现成视频补音效。',
          timeZh: '约 1 小时',
        },
      ],
      filters: { categories: ['音效生成'], tags: ['sound effect'], soundTypes: ['环境音'] },
    },
    {
      id: 'podcast',
      titleZh: '播客 / 访谈后期',
      descZh: '降噪、母带、分离人声，先把录音弄干净。',
      questionZh: '我有一堆访谈录音要切段降噪',
      recommended: [
        {
          repoId: 'sergree__matchering',
          verdict: 'first',
          whyZh: '母带匹配一步到位，24 秒样例能直接听出频响被拉齐。',
          timeZh: '10 分钟装完',
        },
        {
          repoId: 'Anjok07__ultimatevocalremovergui',
          verdict: 'alt',
          whyZh: '人声/伴奏分离有 GUI，适合先听懂素材再决定流程。',
          timeZh: '有显卡约 20 分钟',
        },
        {
          repoId: 'tyiannak__pyAudioAnalysis',
          verdict: 'heavy',
          whyZh: '切段与声学特征齐全，但要写 Python 脚本。',
          timeZh: '约 15 分钟',
        },
      ],
      filters: { categories: ['母带与修复'], tags: ['denoise', 'separation'], soundTypes: ['语音'] },
    },
    {
      id: 'visual',
      titleZh: '把音乐变成画面',
      descZh: '频谱、MIDI 可视化、音频驱动灯带，先看得到再谈好不好。',
      questionZh: '我想把 MIDI 或频谱做成可视化',
      recommended: [
        {
          repoId: 'kosua20__MIDIVisualizer',
          verdict: 'first',
          whyZh: '直接把 MIDI 铺成可视化，24 秒样例就是成品画面节奏。',
          timeZh: '双击即用',
        },
        {
          repoId: 'libAudioFlux__audioFlux',
          verdict: 'alt',
          whyZh: '音分析底座齐全，适合自己写可视化而不是用现成界面。',
          timeZh: '约 20 分钟',
        },
      ],
      filters: { categories: ['分析与可视化'], tags: ['visualizer'], soundTypes: ['可视化'] },
    },
    {
      id: 'ambient',
      titleZh: '生成环境音 / 氛围',
      descZh: '雨声、室内底噪、空间氛围，能直接铺满一条时间线。',
      questionZh: '我想要一段能循环的环境底噪',
      recommended: [
        {
          repoId: 'haoheliu__AudioLDM',
          verdict: 'first',
          whyZh: '环境音提示词覆盖广，样例输出的空间感最自然。',
          timeZh: '有显卡约 40 分钟',
        },
        {
          repoId: 'Stability-AI__stable-audio-tools',
          verdict: 'alt',
          whyZh: '长段音频生成更稳，适合做可循环的氛围底。',
          timeZh: '约 1 小时',
        },
      ],
      filters: { categories: ['音效生成'], tags: ['ambient'], soundTypes: ['环境音'] },
    },
    {
      id: 'convert',
      titleZh: '批量转码 / 整理音频',
      descZh: 'wav→mp3、批量改名、裁时长，命令行一把梭。',
      questionZh: '我有一批 wav 要批量转码',
      recommended: [
        {
          repoId: 'pkalogiros__AudioMass',
          verdict: 'first',
          whyZh: '浏览器里就能裁切、导出，零安装。',
          timeZh: '打开网页即用',
        },
        {
          repoId: 'JorenSix__TarsosDSP',
          verdict: 'alt',
          whyZh: '批处理与特征提取都在命令行，适合脚本化。',
          timeZh: '约 15 分钟',
        },
      ],
      filters: { categories: ['转码与批处理'], tags: ['batch'], soundTypes: ['处理与转码'] },
    },
    {
      id: 'synth',
      titleZh: '自己造声音 / 写合成器',
      descZh: '振荡器、滤波器、模块化，从零写一条发声链。',
      questionZh: '我想自己写一个合成器',
      recommended: [
        {
          repoId: 'grame-cncm__faust',
          verdict: 'first',
          whyZh: 'Faust 写 DSP 最省心，样例能听出滤波器与调制的手感。',
          timeZh: '约 20 分钟',
        },
        {
          repoId: 'SamiPerttu__fundsp',
          verdict: 'alt',
          whyZh: 'Rust 的 DSP 图写法，适合嵌进自己的程序。',
          timeZh: '需 Rust 工具链',
        },
      ],
      filters: { categories: ['合成器与音源'], tags: ['synth', 'dsp'], soundTypes: ['纯合成'] },
    },
    {
      id: 'midi',
      titleZh: '把 MIDI 渲染成音频',
      descZh: '有一份 MIDI，想要能直接播、能批量出的 WAV。',
      questionZh: '我有一份 MIDI 想渲染成 WAV',
      recommended: [
        {
          repoId: 'FluidSynth__fluidsynth',
          verdict: 'first',
          whyZh: 'SF2 规范完整，默认混响与合唱，样例听感最接近录音室。',
          timeZh: '5 分钟装完',
        },
        {
          repoId: 'schellingb__TinySoundFont',
          verdict: 'alt',
          whyZh: '单头文件零依赖，音色更干、更轻，适合嵌进程序。',
          timeZh: '编译 2 分钟',
        },
        {
          repoId: 'milkytracker__MilkyTracker',
          verdict: 'heavy',
          whyZh: 'Tracker 工作流完整，但需要手工编曲。',
          timeZh: '约 30 分钟',
        },
      ],
      filters: { categories: ['合成器与音源'], tags: ['soundfont', 'midi'], soundTypes: ['采样乐器'] },
    },
    {
      id: 'voice',
      titleZh: '处理语音 / 访谈',
      descZh: '切段、去噪、说话人分析，先把人声弄干净再谈生成。',
      questionZh: '我有一段长录音要切成小段',
      recommended: [
        {
          repoId: 'tyiannak__pyAudioAnalysis',
          verdict: 'first',
          whyZh: '语音/音乐分类与切段都是现成函数，样例能听到切点边界。',
          timeZh: '约 15 分钟',
        },
        {
          repoId: 'JorenSix__TarsosDSP',
          verdict: 'alt',
          whyZh: 'Java 侧的音高与端点检测，适合嵌进 Android/桌面程序。',
          timeZh: '约 15 分钟',
        },
      ],
      filters: { categories: ['语音处理'], tags: ['speech'], soundTypes: ['语音'] },
    },
    {
      id: 'engine',
      titleZh: '给 App 内嵌音频引擎',
      descZh: '要稳定、要跨平台、要能被自己的 UI 调用。',
      questionZh: '我想在自己的应用里加音频播放和 DSP',
      recommended: [
        {
          repoId: 'naudio__NAudio',
          verdict: 'first',
          whyZh: '.NET 生态里最成熟的音频栈，Windows 上直接可用。',
          timeZh: '10 分钟',
        },
        {
          repoId: 'Signalsmith-Audio__dsp',
          verdict: 'alt',
          whyZh: 'C++ DSP 组件小巧，能按需取用而不是整套框架。',
          timeZh: '编译约 10 分钟',
        },
        {
          repoId: 'AudioKit__AudioKit',
          verdict: 'heavy',
          whyZh: 'Apple 平台体验最好，但 Windows 上完全跑不了。',
          timeZh: '仅 macOS/iOS',
        },
      ],
      filters: { categories: ['音频引擎与库'], tags: ['audio engine', 'dsp'], soundTypes: ['处理与转码'] },
    },
  ],
  constraints: [
    {
      id: 'no-gpu',
      titleZh: '没有独立显卡',
      descZh: '只用 CPU 也能跑起来。',
      apply: { type: 'field', field: 'needsGpu', op: 'eq', value: 'none' },
    },
    {
      id: 'win-workable',
      titleZh: 'Windows 原生可用',
      descZh: '不用 WSL、不用虚拟机，本机双击/命令行即可。',
      apply: { type: 'field', field: 'windowsTier', op: 'in', value: ['works'] },
    },
    {
      id: 'has-cli',
      titleZh: '命令行可跑',
      descZh: '能写进脚本、定时任务。',
      apply: { type: 'field', field: 'hasCli', op: 'eq', value: 'yes' },
    },
    {
      id: 'install-5min',
      titleZh: '5 分钟装完',
      descZh: '依赖少、有预编译包，不折腾环境。',
      apply: { type: 'field', field: 'installComplexity', op: 'lte', value: 2 },
    },
    {
      id: 'batchable',
      titleZh: '可批量',
      descZh: '一次跑几十上百条，不用手工点。',
      apply: { type: 'field', field: 'batchable', op: 'eq', value: 'yes' },
    },
    {
      id: 'official-pipeline',
      titleZh: '官方能出样',
      descZh: '仓库自带可运行的出样入口，不用自己拼链路。',
      apply: { type: 'field', field: 'pipeline', op: 'in', value: ['official', 'hybrid'] },
    },
  ],
  quickPicks: [
    {
      needZh: '给 MIDI 批量渲染 WAV',
      repoId: 'FluidSynth__fluidsynth',
      whyZh: '命令行一条 `fluidsynth -F`，默认混响与合唱。',
      timeZh: '5 分钟',
    },
    {
      needZh: '零依赖把 SF2 塞进游戏',
      repoId: 'schellingb__TinySoundFont',
      whyZh: '单头文件，编译进引擎即可发声。',
      timeZh: '2 分钟',
    },
    {
      needZh: '一句话生成 8 秒音效',
      repoId: 'haoheliu__AudioLDM',
      whyZh: '文本到音频，爆炸/雨声类提示词命中率高。',
      timeZh: '40 分钟',
    },
    {
      needZh: '把录音母带拉到目标曲线',
      repoId: 'sergree__matchering',
      whyZh: '参考曲目一键匹配，适合播客收尾。',
      timeZh: '10 分钟',
    },
    {
      needZh: '浏览器里裁一段音频',
      repoId: 'pkalogiros__AudioMass',
      whyZh: '不用装软件，打开就能剪。',
      timeZh: '即开即用',
    },
    {
      needZh: '做频谱可视化',
      repoId: 'djfun__audio-visualizer-python',
      whyZh: 'Python 侧频谱绘制，样例就是成品效果。',
      timeZh: '15 分钟',
    },
  ],
  soundTypes: [
    {
      id: 'synth',
      titleZh: '纯合成',
      descZh: '振荡器 / 滤波器实时算出来的声音，不是采样也不是模型。',
      keywords: ['纯合成', '合成器', 'DSP', 'synth', 'oscillator'],
    },
    {
      id: 'sampled',
      titleZh: '采样乐器',
      descZh: 'SoundFont / 采样库，音色来自录音素材。',
      keywords: ['采样乐器', 'SoundFont', 'soundfont', 'sampler'],
    },
    {
      id: 'neural',
      titleZh: '神经网络生成',
      descZh: '文本/旋律条件进模型，输出音乐、音效或语音。',
      keywords: ['神经网络生成', 'generation', 'diffusion', 'model'],
    },
    {
      id: 'ambient',
      titleZh: '环境音',
      descZh: '雨声、房间底噪、空间氛围，适合铺时间线。',
      keywords: ['环境音', 'ambient', 'soundscape'],
    },
    {
      id: 'voice',
      titleZh: '语音',
      descZh: '说话、唱歌、克隆与语音增强。',
      keywords: ['语音', 'speech', 'voice', 'vocal'],
    },
    {
      id: 'visual',
      titleZh: '可视化',
      descZh: '频谱、波形、MIDI 与灯带，把声音变成画面。',
      keywords: ['可视化', 'visualizer', 'spectrogram', 'spectrum'],
    },
  ],
  sampleGroups: [
    {
      id: 'midi-24s',
      titleZh: '同一段 24 秒 MIDI：FluidSynth vs TinySoundFont',
      descZh: '同一份 MIDI、同一个音源规格，差别只在渲染链——一个带混响合唱，一个是干声。',
      repoIds: ['FluidSynth__fluidsynth', 'schellingb__TinySoundFont'],
    },
    {
      id: 'mastering-24s',
      titleZh: '母带与分离：24 秒同一素材的两种处理',
      descZh: '一条走参考曲线匹配，一条走人声/伴奏分离，听处理痕迹而不是听风格。',
      repoIds: ['sergree__matchering', 'Anjok07__ultimatevocalremovergui'],
    },
  ],
  synonyms: {
    爆炸音效: ['AudioLDM', '音效生成', '环境音', '音频生成'],
    音效: ['AudioLDM', '音效生成', 'MMAudio'],
    背景音乐: ['音乐生成', 'MusicGen', 'audiocraft'],
    bgm: ['音乐生成', 'audiocraft'],
    配乐: ['音乐生成', 'audiocraft', 'stable-audio'],
    midi: ['FluidSynth', 'SoundFont', 'TinySoundFont', '采样乐器'],
    音源: ['SoundFont', 'FluidSynth', 'TinySoundFont'],
    合成器: ['Faust', 'fundsp', '合成器与音源'],
    降噪: ['matchering', '母带与修复', '人声分离'],
    母带: ['matchering', '母带与修复'],
    分离: ['ultimatevocalremovergui', 'Music-Source-Separation', '母带与修复'],
    切段: ['pyAudioAnalysis', 'aubio', '语音'],
    语音: ['pyAudioAnalysis', 'TarsosDSP', '语音处理'],
    可视化: ['MIDIVisualizer', 'audio-visualizer-python', 'audioFlux'],
    频谱: ['spectrogram', 'audioFlux', 'nnAudio'],
    转码: ['AudioMass', '批量', 'ffmpeg'],
    批量: ['batch', '命令行', '批处理'],
    实时: ['DSP', 'supercollider', 'glicol'],
    游戏: ['音频引擎', 'AudioKit', 'NAudio'],
    嵌入式: ['Signalsmith DSP', 'TinySoundFont', 'fundsp'],
    生成音乐: ['音乐生成', 'audiocraft', 'stable-audio'],
  },
  warnings: [
    {
      scopeZh: '神经网络生成类项目',
      riskZh: '需要下载数 GB 权重，首次运行时间远高于样例生成时间。',
    },
    {
      scopeZh: 'GUI 插件类项目',
      riskZh: '多数没有命令行导出入口，批量处理要自己补脚本。',
    },
  ],
};

/** 音频场景的内置口语语料：真 intents.json 缺失时使用。 */
export const fallbackIntents: IntentDoc = {
  updatedAt: '2026-11-06',
  global: [
    '我想先听听它到底能出什么声音，再决定要不要装',
    '有没有不用显卡也能跑起来的音频工具',
    '我想在 Windows 上直接用，不想折腾 WSL',
    '我需要能写进脚本里批量跑的东西',
    '给我一个能实时出声、不是离线渲染的方案',
    '我想把一段录音处理干净再发出去',
    '有没有开箱即用、不用编译的音频项目',
    '我想给自己的游戏加点声音但不会乐理',
  ],
  scenarios: {
    bgm: ['我想给一段 vlog 配个不违和的背景音乐', '有没有能按文字生成配乐的模型', '我需要一段能商用的小段背景音乐'],
    sfx: ['我想做几个八秒左右的爆炸音效', '游戏里的脚步和打击感能不能自动生成', '我有一段视频想自动补上环境音效'],
    podcast: ['我有一堆访谈录音要自动切段降噪', '播客录完想把音量和频响拉齐', '我想把一首歌里的人声和伴奏分开'],
    visual: ['我想把 MIDI 变成能看的画面', '有没有能把频谱画成动画的工具', '我想让灯带跟着音乐节奏亮'],
    ambient: ['我想要一段能循环的雨声底噪', '生成一段室内环境氛围音', '我需要能铺满时间线的空间底噪'],
    convert: ['我有一批 wav 要批量转成 mp3', '想在浏览器里直接剪一段音频', '能不能批量裁时长和改采样率'],
    synth: ['我想从零写一个能发声的合成器', '有没有用代码搭 DSP 链的框架', '我想用 Faust 写个滤波器试试'],
    midi: ['我有一份 MIDI 想渲染成立体声 WAV', '想找个不依赖声卡的 MIDI 渲染器', '同一份 MIDI 想换几套音源对比'],
    voice: ['我有一段长录音要切成小段', '想分析这段语音里的说话人变化', '有没有能提取音高和端点的语音库'],
    engine: ['我想在自己的应用里内嵌音频引擎', '需要一个 C++ 的小型 DSP 组件', '我想在 Windows 桌面程序里播放和录音'],
  },
  repos: {
    FluidSynth__fluidsynth: [
      { q: '我有一份 MIDI 想直接渲染成立体声 WAV', scenario: 'midi' },
      { q: '我想要带混响和合唱的 SoundFont 渲染', scenario: 'midi' },
      { q: '需要在命令行批量把 MIDI 出成音频', scenario: 'midi' },
    ],
    schellingb__TinySoundFont: [
      { q: '我想把 SoundFont 零依赖塞进游戏引擎', scenario: 'midi' },
      { q: '有没有单头文件就能发声的 MIDI 渲染库', scenario: 'midi' },
    ],
    milkytracker__MilkyTracker: [
      { q: '我想用 Tracker 手工编一段芯片音乐', scenario: 'midi' },
      { q: '有没有能在 Windows 上直接跑的 tracker', scenario: 'midi' },
    ],
    haoheliu__AudioLDM: [
      { q: '我想给游戏做个八秒的爆炸音效', scenario: 'sfx' },
      { q: '有没有能按文字生成环境底噪的模型', scenario: 'ambient' },
      { q: '我想要一段雨声和雷声的氛围音', scenario: 'ambient' },
    ],
    hkchengrex__MMAudio: [
      { q: '我有一段视频想自动补上音效', scenario: 'sfx' },
      { q: '想让画面和声音一起生成', scenario: 'sfx' },
    ],
    facebookresearch__audiocraft: [
      { q: '我想给视频配一段像成品的背景音乐', scenario: 'bgm' },
      { q: '有没有能按旋律条件生成音乐的模型', scenario: 'bgm' },
      { q: '我想用文字描述生成一小段配乐', scenario: 'bgm' },
    ],
    'Stability-AI__stable-audio-tools': [
      { q: '我想要能循环播放的氛围底噪', scenario: 'ambient' },
      { q: '需要长一点的生成音频而不是几秒片段', scenario: 'ambient' },
    ],
    sergree__matchering: [
      { q: '我想把播客的频响拉到参考曲目', scenario: 'podcast' },
      { q: '有没有一键母带匹配的工具', scenario: 'podcast' },
    ],
    Anjok07__ultimatevocalremovergui: [
      { q: '我想把一首歌里的人声和伴奏分开', scenario: 'podcast' },
      { q: '有没有带界面的降噪分离工具', scenario: 'podcast' },
    ],
    tyiannak__pyAudioAnalysis: [
      { q: '我有一段长录音要切成小段', scenario: 'voice' },
      { q: '想给语音和音乐做分类标注', scenario: 'voice' },
    ],
    JorenSix__TarsosDSP: [
      { q: '我想在 Java 程序里做音高检测', scenario: 'voice' },
      { q: '有没有能检测语音端点的库', scenario: 'voice' },
    ],
    aubio__aubio: [
      { q: '我想从音频里提取音高和节拍', scenario: 'voice' },
      { q: '有没有能做 onset 检测的工具', scenario: 'voice' },
    ],
    pkalogiros__AudioMass: [
      { q: '我想在浏览器里直接裁一段音频', scenario: 'convert' },
      { q: '有没有免安装的音频剪辑网页工具', scenario: 'convert' },
    ],
    'ZFTurbo__Music-Source-Separation-Training': [
      { q: '我想把人声和伴奏批量分离出来', scenario: 'podcast' },
      { q: '需要一个能训练分离模型的项目', scenario: 'podcast' },
    ],
    'grame-cncm__faust': [
      { q: '我想用 Faust 写个滤波器试试', scenario: 'synth' },
      { q: '有没有把 DSP 代码编译成多种语言的框架', scenario: 'synth' },
    ],
    supercollider__supercollider: [
      { q: '我想用代码实时造声音', scenario: 'synth' },
      { q: '有没有能做互动音乐演出的环境', scenario: 'synth' },
    ],
    chaosprint__glicol: [
      { q: '我想在浏览器里实时合成声音', scenario: 'synth' },
      { q: '有没有能边写边听的音频 DSL', scenario: 'synth' },
    ],
    SamiPerttu__fundsp: [
      { q: '我想在 Rust 程序里搭 DSP 图', scenario: 'synth' },
      { q: '有没有嵌入式的小型合成库', scenario: 'engine' },
    ],
    Orastron__brickworks: [
      { q: '我想做模块化的合成器实验', scenario: 'synth' },
      { q: '有没有纯合成的 DSP 构件库', scenario: 'synth' },
    ],
    'naudio__NAudio': [
      { q: '我想在 Windows 桌面程序里播放和录音', scenario: 'engine' },
      { q: '有没有 .NET 里成熟的音频库', scenario: 'engine' },
    ],
    AudioKit__AudioKit: [
      { q: '我想在 iOS 应用里加音频处理', scenario: 'engine' },
      { q: '有没有 Apple 平台的音频框架', scenario: 'engine' },
    ],
    'Signalsmith-Audio__dsp': [
      { q: '我需要一个 C++ 的小型 DSP 组件', scenario: 'engine' },
      { q: '想要能按需取用的音频处理积木', scenario: 'engine' },
    ],
    libAudioFlux__audioFlux: [
      { q: '我想把频谱画成动画', scenario: 'visual' },
      { q: '需要一套音频特征提取的底层库', scenario: 'visual' },
    ],
    kosua20__MIDIVisualizer: [
      { q: '我想把 MIDI 变成能看的画面', scenario: 'visual' },
      { q: '有没有直接双击就能跑的 MIDI 可视化', scenario: 'visual' },
    ],
    'djfun__audio-visualizer-python': [
      { q: '我想用 Python 把频谱画出来', scenario: 'visual' },
      { q: '有没有能生成频谱动画的工具', scenario: 'visual' },
    ],
    KinWaiCheuk__nnAudio: [
      { q: '我想在训练里实时算频谱', scenario: 'visual' },
      { q: '需要 GPU 上的音频特征提取', scenario: 'visual' },
    ],
    'torchsynth__torchsynth': [
      { q: '我想让合成器的参数可微分', scenario: 'synth' },
      { q: '有没有能训练合成器参数的库', scenario: 'synth' },
    ],
    'teticio__audio-diffusion': [
      { q: '我想用扩散模型生成音乐', scenario: 'bgm' },
      { q: '有没有能做音频扩散的工具链', scenario: 'bgm' },
    ],
    thxxx__VTS: [
      { q: '我想做音频到画面的实时可视化', scenario: 'visual' },
      { q: '有没有把声音变成视觉场景的项目', scenario: 'visual' },
    ],
    DBraun__DawDreamer: [
      { q: '我想用 Python 控制一个音频引擎', scenario: 'synth' },
      { q: '需要能脚本化的 DAW 流程', scenario: 'synth' },
    ],
    cycfi__q: [
      { q: '我想在 C++ 里做低延迟音频处理', scenario: 'engine' },
      { q: '有没有轻量的 C++ 音频处理库', scenario: 'engine' },
    ],
    'haidog-yaqub__EzAudio': [
      { q: '我想要一个 iOS 上简单的录音可视化', scenario: 'engine' },
      { q: '有没有能实时画波形的音频库', scenario: 'visual' },
    ],
    'pytorch__audio': [
      { q: '我想用 PyTorch 做音频特征提取', scenario: 'voice' },
      { q: '需要能批量加载音频的数据集工具', scenario: 'voice' },
    ],
  },
};
