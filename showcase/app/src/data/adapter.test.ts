import { describe, expect, it } from 'vitest';
import { adaptDataset, type RawSampleEntry } from './adapter';

const reposPayload = {
  repos: [
    {
      id: 'ok__repo',
      owner: 'ok',
      repo: 'repo',
      category: '合成器',
      soundTypes: ['纯合成'],
      stars: 10,
      descriptionZh: '离线渲染 MIDI',
      sample: { status: 'pending', audioPath: null },
    },
    {
      id: 'blocked__repo',
      owner: 'blocked',
      repo: 'repo',
      category: '模型工具链',
      soundTypes: ['神经网络生成'],
      stars: 10,
      descriptionZh: '文本生成音乐',
      gpuAcceleration: 'required',
      sample: { status: 'pending', audioPath: null },
    },
    {
      id: 'rt__repo',
      owner: 'rt',
      repo: 'repo',
      category: '合成器',
      soundTypes: ['纯合成'],
      stars: 10,
      descriptionZh: '实时模块化合成',
      sample: { status: 'pending', audioPath: null },
    },
  ],
};

const samples: Record<string, RawSampleEntry> = {
  'ok__repo': {
    id: 'ok__repo',
    audioFile: 'sample.wav',
    waveformFile: 'waveform.png',
    spectrogramFile: 'spectrogram.png',
    audioBytes: 4_233_678,
    meta: {
      status: 'ok',
      segments: [
        { startSec: 0, endSec: 8, capZh: '序章' },
        { startSec: 8, endSec: 16, capZh: '主题复现' },
        { startSec: 16, endSec: 24, capZh: '主段全奏' },
      ],
      spec: { durationSec: 24, sampleRate: 44100, channels: 2, codec: 'pcm_s16le' },
      signatureZh: '带 chorus/reverb 的 SF2 渲染',
      chooseWhenZh: '要批量渲染标准 MIDI 时选它',
      contrastWith: ['rt__repo'],
    },
  },
};

const details = {
  'ok__repo': {
    ceilingsZh: '复音 256、采样率 8000–96000',
    compareTips: [{ vs: 'rt__repo', whenZh: '要实时交互选后者' }],
  },
  'blocked__repo': {
    blockerZh: '需要 10GB 显存，本机只有 8GB',
    whatItWouldNeed: '一张 10GB 以上显存的显卡',
  },
  'rt__repo': {
    capabilities: { realtimeZh: '可实时（依赖声卡或宿主）' },
  },
};

describe('adapter', () => {
  const adapted = adaptDataset(reposPayload, 'repos', samples, details);

  it('扫描到 sample.wav 时状态为 ok，并带上分段与频谱路径', () => {
    const repo = adapted.dataset.repos.find((item) => item.id === 'ok__repo')!;
    expect(repo.sample.status).toBe('ok');
    expect(repo.sample.audioPath).toBe('_samples/ok__repo/sample.wav');
    expect(repo.sample.spectrogramPath).toBe('_samples/ok__repo/spectrogram.png');
    expect(repo.sample.durationSec).toBe(24);
    expect(repo.sample.spec?.sampleRate).toBe(44100);
    expect(repo.sample.segments).toHaveLength(3);
    expect(repo.sample.signatureZh).toContain('SF2');
  });

  it('真实档案的成功项与对比建议被映射', () => {
    const detail = adapted.details['ok__repo']!;
    expect(detail.ceilingZh).toContain('复音 256');
    expect(detail.compareTips[0]?.adviceZh).toBe('要实时交互选后者');
  });

  it('无样例但档案写明阻断时，降级为「做不了」并展示原因', () => {
    const repo = adapted.dataset.repos.find((item) => item.id === 'blocked__repo')!;
    expect(repo.sample.status).toBe('failed');
    expect(repo.sample.blockerZh).toContain('10GB');
    expect(repo.sample.whatItWouldNeedZh).toContain('显卡');
    expect(repo.sample.noteZh).toContain('做不出来');
  });

  it('档案里的实时能力派生到仓库，供实时约束筛选', () => {
    const repo = adapted.dataset.repos.find((item) => item.id === 'rt__repo')!;
    expect(repo.realtime).toBe(true);
  });

  it('缺字段时仍给出可解释的决策行', () => {
    const repo = adapted.dataset.repos.find((item) => item.id === 'blocked__repo')!;
    expect(repo.signatureZh).toBeTruthy();
    expect(repo.sample.status).not.toBe('ok');
  });
});
