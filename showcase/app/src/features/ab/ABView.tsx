import { useMemo, useState } from 'react';
import type { Repo, RepoDetail } from '../../types/repo';
import { buildABConclusion } from '../../lib/ab';
import { computeOverallScore } from '../../lib/scores';
import { formatCompactNumber, formatIsoDate } from '../../lib/format';
import { AudioPlayer } from '../../components/AudioPlayer';
import { DecisionRow } from '../../components/DecisionRow';
import { Icon } from '../../components/Icon';

interface ABViewProps {
  a: Repo | null;
  b: Repo | null;
  details: Record<string, RepoDetail>;
  repoById: Map<string, Repo>;
  selected: string[];
  onToggleCompare: (id: string) => void;
  onOpenRepo: (id: string) => void;
  onOpenMatrix: () => void;
  onSwap: () => void;
}

function ColumnHeader({ repo, slot }: { repo: Repo; slot: 'A' | 'B' }) {
  return (
    <div className="ab-col__head">
      <span className="tone is-accent">{slot}</span>
      <span className="repo-card__name" style={{ fontSize: 15 }}>
        {repo.repo}
      </span>
      <span className="repo-card__owner">{repo.owner}</span>
    </div>
  );
}

export function ABView({
  a,
  b,
  details,
  repoById,
  selected,
  onToggleCompare,
  onOpenRepo,
  onOpenMatrix,
  onSwap,
}: ABViewProps) {
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [syncTime, setSyncTime] = useState<{ time: number; source: string } | null>(null);
  // leader 是「先开始播放的那一条」；同步只从 leader 流向另一条，避免新起播的一条把对方拉回 0。
  const [playState, setPlayState] = useState<{
    a: boolean;
    b: boolean;
    leader: 'a' | 'b' | null;
  }>({ a: false, b: false, leader: null });

  const conclusion = useMemo(
    () => (a && b ? buildABConclusion(a, b, details[a.id], details[b.id]) : null),
    [a, b, details],
  );

  if (!a || !b) {
    return (
      <div className="detail">
        <div className="empty">
          <b>还差一条才能并排试听</b>
          <span>在矩阵或卡片上选两个仓库，组成 A / B。</span>
          <button type="button" className="button button--small" onClick={onOpenMatrix}>
            去全量矩阵挑两个
          </button>
        </div>
      </div>
    );
  }

  const handleTime = (seconds: number, source: string): void => {
    if (!syncEnabled || playState.leader !== source) return;
    setSyncTime({ time: seconds, source });
  };

  const handlePlayingChange = (value: boolean, source: string): void => {
    setPlayState((prev) => {
      const slot = source === 'a' ? 'a' : 'b';
      const other = slot === 'a' ? 'b' : 'a';
      const next = { ...prev, [slot]: value };
      if (!value) {
        next.leader = prev.leader === slot ? (next[other] ? other : null) : prev.leader;
      } else if (!prev.leader || !prev[other]) {
        next.leader = slot;
      }
      return next;
    });
  };

  return (
    <div className="detail">
      <nav className="breadcrumb" aria-label="面包屑">
        <button type="button" className="text-button" onClick={onOpenMatrix}>
          ← 回矩阵
        </button>
        <span>/</span>
        <span>A/B 并排试听</span>
      </nav>

      <header className="section-head">
        <div>
          <h1 className="hero__title" style={{ fontSize: 'clamp(24px, 3.4vw, 34px)' }}>
            {a.repo} <span className="muted">vs</span> {b.repo}
          </h1>
          <p className="section-desc">
            两条样例并排，先各自整段听，再切「同步进度」逐段对听。对比结论只写数据层能支撑的部分。
          </p>
        </div>
        <div className="repo-card__actions">
          <label className="sync-toggle">
            <input
              type="checkbox"
              checked={syncEnabled}
              onChange={(event) => setSyncEnabled(event.target.checked)}
            />
            同步进度（以先播放的一条为准）
          </label>
          <button type="button" className="button button--small button--ghost" onClick={onSwap}>
            <Icon name="reset" size={14} />
            交换 A/B
          </button>
        </div>
      </header>

      {conclusion ? (
        <section className="conclusion" aria-labelledby="conclusion-title">
          <h2 className="conclusion__title" id="conclusion-title">
            <Icon name="compare" size={18} />
            对比结论
          </h2>
          <p className="section-desc">{conclusion.summaryZh}</p>
          {conclusion.caveatZh ? (
            <div className="banner">
              <span className="banner__dot" />
              <span>{conclusion.caveatZh}</span>
            </div>
          ) : null}
          <div className="conclusion__rows">
            {conclusion.rows.map((row) => (
              <div key={row.label} className="conclusion__row">
                <span className="conclusion__key">{row.label}</span>
                <div style={{ display: 'grid', gap: 3, minWidth: 0 }}>
                  <span>
                    <b className="accent-text">A</b> {row.aZh}
                  </span>
                  <span>
                    <b style={{ color: 'var(--warning)', fontWeight: 500 }}>B</b> {row.bZh}
                  </span>
                  {row.diff !== 'same' ? (
                    <span className={`tone ${row.diff === 'missing' ? 'is-warn' : 'is-accent'}`}>
                      {row.diff === 'missing' ? '字段未就绪' : '有差异'}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="ab-grid">
        {[a, b].map((repo, index) => {
          const slot = index === 0 ? 'a' : 'b';
          const detail = details[repo.id];
          return (
            <section key={repo.id} className="ab-col" aria-labelledby={`ab-${slot}`}>
              <div id={`ab-${slot}`}>
                <ColumnHeader repo={repo} slot={index === 0 ? 'A' : 'B'} />
              </div>
              <AudioPlayer
                repoName={`${index === 0 ? 'A' : 'B'} · ${repo.repo}`}
                sample={repo.sample}
                playerId={slot}
                syncTime={syncTime}
                onTimeUpdate={handleTime}
                onPlayingChange={handlePlayingChange}
              />
              <DecisionRow
                repo={repo}
                detail={detail}
                repoById={repoById}
                onOpenRepo={onOpenRepo}
              />
              <div className="repo-card__meta">
                <span>
                  ★ <strong>{formatCompactNumber(repo.stars)}</strong>
                </span>
                <span>
                  更新 <strong>{formatIsoDate(repo.pushedAt)}</strong>
                </span>
                <span>{repo.license ?? '未声明协议'}</span>
                <span>
                  综合 <strong>{computeOverallScore(repo.scores).toFixed(1)}</strong>
                </span>
              </div>
              <div className="repo-card__actions">
                <button
                  type="button"
                  className={`button button--small${selected.includes(repo.id) ? '' : ' button--ghost'}`}
                  onClick={() => onToggleCompare(repo.id)}
                  aria-pressed={selected.includes(repo.id)}
                >
                  {selected.includes(repo.id) ? '移出 A/B' : '加入 A/B'}
                </button>
                <a
                  className="button button--small button--ghost"
                  href={`#/repo/${encodeURIComponent(repo.id)}`}
                  onClick={(event) => {
                    event.preventDefault();
                    onOpenRepo(repo.id);
                  }}
                >
                  看完整档案
                </a>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
