import type { Repo, RepoDetail } from '../types/repo';
import type { ScenarioRecommendation } from '../types/discovery';
import { formatAge, formatCompactNumber, formatIsoDate } from '../lib/format';
import { CLI_LABELS, GPU_LABELS, WINDOWS_LABELS, cliTone, gpuTone, windowsTone } from '../lib/flags';
import { computeOverallScore } from '../lib/scores';
import { AudioPlayer } from './AudioPlayer';
import { DecisionRow } from './DecisionRow';
import { RepoThumb } from './RepoThumb';
import { Icon } from './Icon';

interface RepoCardProps {
  repo: Repo;
  detail?: RepoDetail;
  repoById: Map<string, Repo>;
  selected: boolean;
  onToggleCompare: (id: string) => void;
  onOpenRepo: (id: string) => void;
  matchReasons?: string[];
  recommendation?: ScenarioRecommendation;
  showPlayer?: boolean;
  showDecision?: boolean;
}

export function RepoCard({
  repo,
  detail,
  repoById,
  selected,
  onToggleCompare,
  onOpenRepo,
  matchReasons = [],
  recommendation,
  showPlayer = true,
  showDecision = true,
}: RepoCardProps) {
  const open = (event: React.MouseEvent): void => {
    event.preventDefault();
    onOpenRepo(repo.id);
  };

  return (
    <article className={`repo-card${selected ? ' is-selected' : ''}`}>
      <div className="repo-card__head">
        <RepoThumb repo={repo} sample={repo.sample} />
        <div style={{ display: 'grid', gap: 6, minWidth: 0, flex: 1 }}>
          <div className="repo-card__title">
            <a
              className="repo-card__name"
              href={`#/repo/${encodeURIComponent(repo.id)}`}
              onClick={open}
            >
              {repo.repo}
            </a>
            <span className="repo-card__owner">{repo.owner}</span>
            {recommendation ? (
              <span className={`tone ${recommendation.verdict === 'first' ? 'is-accent' : 'is-warn'}`}>
                {recommendation.verdict === 'first' ? '场景首选' : recommendation.verdict === 'alt' ? '备选' : '重量级'}
              </span>
            ) : null}
          </div>
          <p className="repo-card__desc">{detail?.taglineZh || repo.descriptionZh}</p>
          <div className="repo-card__tags">
            <span className="tone is-accent">{repo.category}</span>
            {repo.soundTypes.slice(0, 2).map((type) => (
              <span key={type} className="tone">
                {type}
              </span>
            ))}
            <span className={`tone ${computeOverallScore(repo.scores) >= 4 ? 'is-yes' : ''}`}>
              综合 {computeOverallScore(repo.scores).toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {matchReasons.length > 0 ? (
        <div className="repo-card__reasons">
          {matchReasons.slice(0, 3).map((reason) => (
            <span key={reason} className="tone">
              {reason}
            </span>
          ))}
        </div>
      ) : null}

      {showPlayer ? <AudioPlayer repoName={repo.repo} sample={repo.sample} compact /> : null}

      {showDecision ? (
        <DecisionRow repo={repo} detail={detail} repoById={repoById} compact onOpenRepo={onOpenRepo} />
      ) : null}

      <div className="repo-card__meta">
        <span>
          ★ <strong>{formatCompactNumber(repo.stars)}</strong>
        </span>
        <span>更新 <strong>{formatIsoDate(repo.pushedAt)}</strong>（{formatAge(repo.pushedAt)}）</span>
        <span>{repo.language ?? '未标注语言'}</span>
        <span>{repo.license ?? '未声明协议'}</span>
      </div>

      <div className="repo-card__meta">
        <span className={`tone ${windowsTone(repo.windowsSupport)}`}>Win {WINDOWS_LABELS[repo.windowsSupport]}</span>
        <span className={`tone ${gpuTone(repo.gpuAcceleration)}`}>GPU {GPU_LABELS[repo.gpuAcceleration]}</span>
        <span className={`tone ${cliTone(repo.cliHeadless)}`}>CLI {CLI_LABELS[repo.cliHeadless]}</span>
        <span className="tone">安装难度 {repo.installComplexity}/5</span>
      </div>

      <div className="repo-card__actions">
        <button
          type="button"
          className={`button button--small${selected ? '' : ' button--ghost'}`}
          onClick={() => onToggleCompare(repo.id)}
          aria-pressed={selected}
        >
          <Icon name="compare" size={14} />
          {selected ? '已加入 A/B' : '加入 A/B'}
        </button>
        <a
          className="button button--small button--ghost"
          href={`#/repo/${encodeURIComponent(repo.id)}`}
          onClick={open}
        >
          看档案与分段
        </a>
        <div className="repo-card__links">
          <a href={repo.url} target="_blank" rel="noreferrer">
            GitHub ↗
          </a>
          {repo.homepage ? (
            <a href={repo.homepage} target="_blank" rel="noreferrer">
              主页 ↗
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
