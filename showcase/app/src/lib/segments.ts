import type { SampleSegment } from '../types/repo';

/** 当前播放时间落在哪一段；播放头在首段之前返回 -1，超过末段返回最后一段。 */
export function activeSegmentIndex(segments: SampleSegment[], time: number): number {
  if (segments.length === 0) return -1;
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    if (!segment) continue;
    if (time >= segment.startSec && time < segment.endSec) return index;
  }
  const last = segments[segments.length - 1];
  if (last && time >= last.endSec) return segments.length - 1;
  return -1;
}

/** 段内进度 0–1，用于高亮条的填充宽度。 */
export function segmentProgress(segment: SampleSegment, time: number): number {
  const span = segment.endSec - segment.startSec;
  if (span <= 0) return 0;
  return Math.min(1, Math.max(0, (time - segment.startSec) / span));
}

/** 分段是否有实际内容：过滤空段与错序段，避免数据缺字段时画出空条。 */
export function normalizeSegments(segments: SampleSegment[]): SampleSegment[] {
  return segments
    .filter(
      (segment) =>
        Number.isFinite(segment.startSec) &&
        Number.isFinite(segment.endSec) &&
        segment.endSec > segment.startSec &&
        segment.capZh.trim().length > 0,
    )
    .sort((left, right) => left.startSec - right.startSec);
}

/** 播放头在整段样例里的位置（0–1），用于进度线与频谱叠层。 */
export function timelineRatio(time: number, duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0) return 0;
  return Math.min(1, Math.max(0, time / duration));
}
