import { useEffect, useMemo, useRef, useState } from 'react';
import type { SampleInfo } from '../types/repo';
import { formatClock, formatDuration } from '../lib/format';
import { resolveSampleUrl } from '../lib/sample';
import { activeSegmentIndex } from '../lib/segments';
import { Icon } from './Icon';

interface AudioPlayerProps {
  repoName: string;
  sample: SampleInfo;
  compact?: boolean;
  /** A/B 同步来源标识；同组内不同 id 才会被同步。 */
  playerId?: string;
  syncTime?: { time: number; source: string } | null;
  onTimeUpdate?: (seconds: number, source: string) => void;
  onPlayingChange?: (playing: boolean, source: string) => void;
}

const EMPTY_LABEL: Record<SampleInfo['status'], string> = {
  ok: '样例已就绪',
  failed: '样例生成失败',
  skipped: '样例未出',
  missing: '样例生成中',
  unknown: '暂无样例',
};

export function AudioPlayer({
  repoName,
  sample,
  compact = false,
  playerId = 'solo',
  syncTime = null,
  onTimeUpdate,
  onPlayingChange,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(sample.durationSec ?? 0);
  const [error, setError] = useState('');
  const [imageFailed, setImageFailed] = useState(false);

  const url = useMemo(() => resolveSampleUrl(sample.audioPath), [sample.audioPath]);
  const segments = sample.segments;
  const activeIndex = activeSegmentIndex(segments, current);
  const active = activeIndex >= 0 ? segments[activeIndex] ?? null : null;
  const hasAudio = sample.status === 'ok' && url !== null;
  const lastReported = useRef(-1);

  useEffect(() => {
    setImageFailed(false);
    setError('');
    setCurrent(0);
    setPlaying(false);
    setDuration(sample.durationSec ?? 0);
  }, [sample.audioPath, sample.durationSec]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !syncTime || syncTime.source === playerId) return;
    if (Math.abs(audio.currentTime - syncTime.time) < 0.35) return;
    try {
      audio.currentTime = syncTime.time;
      setCurrent(syncTime.time);
    } catch {
      // 元数据尚未加载时忽略同步，下一次 timeupdate 会自然对齐。
    }
  }, [syncTime, playerId]);

  function announcePlaying(next: boolean): void {
    setPlaying(next);
    onPlayingChange?.(next, playerId);
  }

  const toggle = (): void => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      announcePlaying(false);
      return;
    }
    const promise = audio.play();
    if (promise) {
      promise.then(() => announcePlaying(true)).catch(() => {
        setError('浏览器无法播放这个音频格式，请换成 WAV/MP3。');
        announcePlaying(false);
      });
    }
  };

  const seekTo = (seconds: number): void => {
    const audio = audioRef.current;
    if (!audio) return;
    const target = Math.max(0, Math.min(seconds, duration || sample.durationSec || 0));
    audio.currentTime = target;
    setCurrent(target);
    onTimeUpdate?.(target, playerId);
  };

  const percent = duration > 0 ? Math.min(100, (current / duration) * 100) : 0;
  const spectrogram = sample.spectrogramPath
    ? resolveSampleUrl(sample.spectrogramPath)
    : null;

  if (!hasAudio) {
    const isBlocked = sample.status === 'failed' || sample.status === 'skipped';
    return (
      <div className="player player--empty" role="group" aria-label={`${repoName} 的样例状态`}>
        <div className="player__top">
          <span className="tone is-warn">{EMPTY_LABEL[sample.status]}</span>
          <span className="player__clock">{formatDuration(sample.durationSec)}</span>
        </div>
        <div className="player__blocker">
          <span>{sample.noteZh}</span>
          {isBlocked && (sample.blockerZh || sample.limitsZh) ? (
            <span>
              <b>为什么做不了：</b>
              {sample.blockerZh ?? sample.limitsZh}
            </span>
          ) : null}
          {isBlocked && sample.whatItWouldNeedZh ? (
            <span className="muted">补齐条件：{sample.whatItWouldNeedZh}</span>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={`player${compact ? ' player--compact' : ''}`} role="group" aria-label={`${repoName} 的音频试听`}>
      <audio
        ref={audioRef}
        src={url ?? undefined}
        preload={compact ? 'none' : 'metadata'}
        onLoadedMetadata={(event) => {
          const value = event.currentTarget.duration;
          if (Number.isFinite(value) && value > 0) setDuration(value);
        }}
        onTimeUpdate={(event) => {
          const seconds = event.currentTarget.currentTime;
          setCurrent(seconds);
          if (lastReported.current < 0 || Math.abs(seconds - lastReported.current) > 0.2) {
            lastReported.current = seconds;
            onTimeUpdate?.(seconds, playerId);
          }
        }}
        onEnded={() => announcePlaying(false)}
        onPause={() => setPlaying(false)}
        onPlay={() => announcePlaying(true)}
        onError={() => {
          setError('音频加载失败：文件可能尚未生成或被移动。');
          announcePlaying(false);
        }}
      />

      <div className="player__top">
        <button
          type="button"
          className="player__play"
          onClick={toggle}
          aria-label={playing ? `暂停 ${repoName} 的样例` : `播放 ${repoName} 的样例`}
        >
          <Icon name={playing ? 'pause' : 'play'} size={18} />
        </button>
        <span className="player__clock">
          {formatClock(current)} <span>/</span> {formatClock(duration)}
        </span>
        {compact ? (
          <span className="player__now" title={active?.capZh ?? '整段样例'}>
            {active ? `▶ ${active.capZh}` : sample.segments.length > 0 ? '整段试听' : '整段试听'}
          </span>
        ) : (
          <span className="player__now">
            {sample.segments.length} 段 · {sample.spec?.sampleRate ? `${sample.spec.sampleRate / 1000} kHz` : '采样率未知'}
          </span>
        )}
      </div>

      <div
        className={`player__spectro${spectrogram && !imageFailed ? '' : ' is-empty'}`}
        onClick={(event) => {
          if (!spectrogram || !duration) return;
          const rect = event.currentTarget.getBoundingClientRect();
          const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
          seekTo(ratio * duration);
        }}
        aria-hidden="true"
      >
        {spectrogram && !imageFailed ? (
          <img
            src={spectrogram}
            alt=""
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span>频谱图生成中 · 进度条仍可拖动</span>
        )}
        <span className="player__playhead" style={{ left: `${percent}%` }} />
      </div>

      <input
        className="player__range"
        type="range"
        min={0}
        max={Math.max(1, duration)}
        step={0.1}
        value={Math.min(current, Math.max(1, duration))}
        onChange={(event) => seekTo(Number(event.target.value))}
        aria-label={`${repoName} 的播放进度`}
      />

      {error ? <p className="player__error">{error}</p> : null}

      {compact ? (
        <div className="player__segment-note">
          {active ? (
            <>
              <b>
                {formatClock(active.startSec)}–{formatClock(active.endSec)}
              </b>
              <span>{active.capZh}</span>
            </>
          ) : (
            <span className="muted">
              {sample.segments.length > 0 ? '播放后高亮当前片段' : formatDuration(duration)}
            </span>
          )}
        </div>
      ) : (
        <>
          <p className="sr-only" aria-live="polite">
            {active ? `当前片段：${active.capZh}` : '整段试听'}
          </p>
          {segments.length > 0 ? (
            <div className="segments" aria-label="样例能力分段">
              {segments.map((segment, index) => {
                const isActive = active === segment;
                return (
                  <button
                    key={`${segment.startSec}-${index}`}
                    type="button"
                    className={`segment${isActive ? ' is-active' : ''}`}
                    onClick={() => seekTo(segment.startSec)}
                    aria-current={isActive ? 'true' : undefined}
                    aria-label={`跳到 ${formatClock(segment.startSec)}：${segment.capZh}`}
                  >
                    <span className="segment__time">
                      {formatClock(segment.startSec)}–{formatClock(segment.endSec)}
                    </span>
                    <span>{segment.capZh}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="muted" style={{ fontSize: 12 }}>
              这份样例没有分段说明，可先整段试听。
            </p>
          )}
          {sample.capabilitiesZh.length > 0 ? (
            <div className="chip-row">
              {sample.capabilitiesZh.map((capability) => (
                <span key={capability} className="tone is-accent">
                  {capability}
                </span>
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
