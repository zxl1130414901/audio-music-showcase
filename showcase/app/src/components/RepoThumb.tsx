import { useMemo, useState } from 'react';
import type { Repo, SampleInfo } from '../types/repo';
import { resolveSampleUrl } from '../lib/sample';
import { formatDuration } from '../lib/format';

/** 确定性伪随机波形条：样例缺失时仍给出「有声音」的视觉占位，而不是白块。 */
function barHeights(seed: string, count = 26): number[] {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) % 1_000_003;
  return Array.from({ length: count }, (_, index) => {
    hash = (hash * 997 + index * 13) % 1_000_003;
    const base = 18 + (hash % 64);
    const envelope = Math.sin((index / (count - 1)) * Math.PI);
    return Math.round(base * (0.35 + envelope * 0.65));
  });
}

interface RepoThumbProps {
  repo: Pick<Repo, 'id' | 'owner' | 'repo'>;
  sample: SampleInfo;
  wide?: boolean;
  showDuration?: boolean;
}

export function RepoThumb({ repo, sample, wide = false, showDuration = true }: RepoThumbProps) {
  const imageUrl = sample.waveformPath ? resolveSampleUrl(sample.waveformPath) : null;
  const spectrogramUrl = !imageUrl && sample.spectrogramPath ? resolveSampleUrl(sample.spectrogramPath) : null;
  const [failed, setFailed] = useState(false);
  const heights = useMemo(() => barHeights(`${repo.owner}__${repo.repo}`), [repo.owner, repo.repo]);
  const url = failed ? null : imageUrl ?? spectrogramUrl;

  return (
    <div className={`thumb${wide ? ' thumb--wide' : ''}`} aria-hidden="true">
      {url ? (
        <img className="thumb__img" src={url} alt="" loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <div className="thumb__bars">
          {heights.map((height, index) => (
            <span
              key={index}
              className="thumb__bar"
              style={{ height: `${height}%`, opacity: 0.25 + height / 140 }}
            />
          ))}
        </div>
      )}
      {showDuration ? (
        <span className="thumb__badge">
          {sample.status === 'ok' ? formatDuration(sample.durationSec) : '无样例'}
        </span>
      ) : null}
    </div>
  );
}
