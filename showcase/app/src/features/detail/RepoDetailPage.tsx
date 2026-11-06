import type { Repo, RepoDetail } from '../../types/repo';
import type { DiscoveryWarning } from '../../types/discovery';
import { SCORE_DIMENSIONS, computeOverallScore, scorePercent } from '../../lib/scores';
import { CLI_LABELS, GPU_LABELS, WINDOWS_LABELS, cliTone, gpuTone, windowsTone } from '../../lib/flags';
import { formatAge, formatBytes, formatCompactNumber, formatDuration, formatIsoDate, formatSampleRate } from '../../lib/format';
import { mergeDetail } from '../../lib/detail';
import { warningsForRepo } from '../../lib/discovery';
import { localRepoPath } from '../../lib/sample';
import { AudioPlayer } from '../../components/AudioPlayer';
import { DecisionRow } from '../../components/DecisionRow';
import { Icon } from '../../components/Icon';

interface RepoDetailPageProps {
  repo: Repo;
  detailRaw?: RepoDetail;
  evidence: Parameters<typeof mergeDetail>[2];
  repoById: Map<string, Repo>;
  warnings: DiscoveryWarning[];
  selected: string[];
  backLabel: string;
  onBack: () => void;
  onToggleCompare: (id: string) => void;
  onOpenRepo: (id: string) => void;
  onCompare: (a: string, b: string) => void;
  onOpenMatrix: () => void;
}

export function RepoDetailPage({
  repo,
  detailRaw,
  evidence,
  repoById,
  warnings,
  selected,
  backLabel,
  onBack,
  onToggleCompare,
  onOpenRepo,
  onCompare,
  onOpenMatrix,
}: RepoDetailPageProps) {
  const { detail, isFallback } = mergeDetail(repo, detailRaw, evidence);
  const sample = repo.sample;
  const isSelected = selected.includes(repo.id);
  const contrast = repo.contrastWith
    .map((id) => repoById.get(id))
    .filter((item): item is Repo => Boolean(item))
    .slice(0, 3);
  const overall = computeOverallScore(repo.scores);
  const repoWarnings = warningsForRepo(warnings, repo);
  const localPath = localRepoPath(repo.owner, repo.repo, repo.localPath);
  const canCompareNow = contrast.length > 0 && (isSelected || selected.length < 2);

  return (
    <div className="detail">
      <nav className="breadcrumb" aria-label="面包屑">
        <a
          href="#/"
          onClick={(event) => {
            event.preventDefault();
            onBack();
          }}
        >
          ← {backLabel}
        </a>
        <span>/</span>
        <span>{repo.category}</span>
        <span>/</span>
        <span>{repo.repo}</span>
        <button type="button" className="text-button" style={{ marginLeft: 'auto' }} onClick={onOpenMatrix}>
          全量矩阵
        </button>
      </nav>

      <header className="detail-hero">
        <div className="detail-hero__main">
          <div className="repo-card__tags">
            <span className="tone is-accent">{repo.category}</span>
            {repo.soundTypes.map((type) => (
              <span key={type} className="tone">
                {type}
              </span>
            ))}
            <span className="tone is-yes">综合 {overall.toFixed(1)}</span>
            {isFallback ? <span className="tone is-warn">档案为合成版本</span> : null}
          </div>
          <h1 className="detail-title">{repo.repo}</h1>
          <p className="detail-tagline">{detail.taglineZh || detail.summaryZh}</p>
          <div className="detail-meta">
            <span>
              ★ <strong>{formatCompactNumber(repo.stars)}</strong>
            </span>
            <span>
              更新 <strong>{formatIsoDate(repo.pushedAt)}</strong>（{formatAge(repo.pushedAt)}）
            </span>
            <span>{repo.language ?? '未标注语言'}</span>
            <span>{repo.license ?? '未声明协议'}</span>
            <span>
              安装难度 <strong>{repo.installComplexity}/5</strong>
            </span>
          </div>
          <div className="detail-meta">
            <span className={`tone ${windowsTone(repo.windowsSupport)}`}>Win {WINDOWS_LABELS[repo.windowsSupport]}</span>
            <span className={`tone ${gpuTone(repo.gpuAcceleration)}`}>GPU {GPU_LABELS[repo.gpuAcceleration]}</span>
            <span className={`tone ${cliTone(repo.cliHeadless)}`}>CLI {CLI_LABELS[repo.cliHeadless]}</span>
          </div>

          <DecisionRow repo={repo} detail={detail} repoById={repoById} onOpenRepo={onOpenRepo} />

          {repoWarnings.length > 0 ? (
            <div className="notice">
              {repoWarnings.map((warning) => (
                <span key={warning.scopeZh}>
                  <b>注意：</b>
                  {warning.riskZh}
                </span>
              ))}
            </div>
          ) : null}

          {sample.status !== 'ok' && (sample.blockerZh || sample.whatItWouldNeedZh) ? (
            <div className="notice">
              <span>
                <b>为什么这条没有可听样例：</b>
                {sample.blockerZh ?? sample.noteZh}
              </span>
              {sample.whatItWouldNeedZh ? (
                <span className="notice__need">补齐条件：{sample.whatItWouldNeedZh}</span>
              ) : null}
            </div>
          ) : null}

          <div className="repo-card__actions">
            <button
              type="button"
              className={`button button--small${isSelected ? '' : ' button--ghost'}`}
              onClick={() => onToggleCompare(repo.id)}
              aria-pressed={isSelected}
            >
              <Icon name="compare" size={14} />
              {isSelected ? '已在 A/B 列表' : '加入 A/B 试听'}
            </button>
            {canCompareNow ? (
              <button
                type="button"
                className="button button--small button--ghost"
                onClick={() => {
                  const rival = contrast[0];
                  if (!rival) return;
                  if (isSelected && selected.length === 2) {
                    const other = selected.find((id) => id !== repo.id);
                    if (other) {
                      onCompare(repo.id, other);
                      return;
                    }
                  }
                  onCompare(repo.id, rival.id);
                }}
              >
                与 {contrast[0]?.repo} 并排听
              </button>
            ) : null}
            <a className="button button--small button--ghost" href={repo.url} target="_blank" rel="noreferrer">
              GitHub ↗
            </a>
            {repo.homepage ? (
              <a className="button button--small button--ghost" href={repo.homepage} target="_blank" rel="noreferrer">
                主页 ↗
              </a>
            ) : null}
          </div>
        </div>

        <div className="detail-hero__player">
          <AudioPlayer repoName={repo.repo} sample={sample} playerId={repo.id} />
          <div className="sample-spec">
            <span>
              时长 <b>{formatDuration(sample.durationSec)}</b>
            </span>
            <span>
              采样率 <b>{formatSampleRate(sample.spec)}</b>
            </span>
            <span>
              体积 <b>{formatBytes(sample.spec?.bytes)}</b>
            </span>
            <span>
              分段 <b>{sample.segments.length || '—'}</b>
            </span>
            <span>
              状态 <b>{sample.status === 'ok' ? '已出样' : sample.status}</b>
            </span>
          </div>
          {sample.evidenceZh ? (
            <p className="panel__note">
              <span className="accent-text">实测：</span>
              {sample.evidenceZh}
            </p>
          ) : null}
          {sample.limitsZh ? (
            <p className="panel__note">
              <span style={{ color: 'var(--warning)' }}>边界：</span>
              {sample.limitsZh}
            </p>
          ) : null}
          {sample.verifyLogZh ? (
            <details className="evidence">
              <summary>出样日志（{formatDuration(sample.durationSec)}）</summary>
              <div className="evidence__body">{sample.verifyLogZh}</div>
            </details>
          ) : null}
        </div>
      </header>

      <div className="detail-grid">
        <section className="panel" aria-labelledby="what-title">
          <h2 className="panel__title" id="what-title">
            <Icon name="wave" size={16} />
            它能做出什么
          </h2>
          {detail.whatItMakes.length > 0 ? (
            <div className="bullet-list">
              {detail.whatItMakes.map((item, index) => (
                <div key={`${item.type}-${index}`} className="use-case">
                  <span className="use-case__scenario">{item.type}</span>
                  <span className="use-case__why">{item.exampleZh}</span>
                  {item.strength ? <span className="use-case__who">强项：{item.strength}</span> : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="panel__note">
              档案还在补。先看样例分段与下方能力边界；分类为「{repo.category}」，声音类型为
              {repo.soundTypes.length > 0 ? repo.soundTypes.join(' / ') : '未标注'}。
            </p>
          )}
          {detail.ceilingZh ? <p className="panel__note">上限：{detail.ceilingZh}</p> : null}
        </section>

        <section className="panel" aria-labelledby="cap-title">
          <h2 className="panel__title" id="cap-title">
            <Icon name="clock" size={16} />
            能力边界
          </h2>
          <dl className="metric-grid">
            <div className="metric">
              <dt>最长 / 样例时长</dt>
              <dd>{detail.capabilities.maxDurationZh || '未标注'}</dd>
            </div>
            <div className="metric">
              <dt>导出格式</dt>
              <dd>{detail.capabilities.formatsZh.length > 0 ? detail.capabilities.formatsZh.join(' / ') : '未标注'}</dd>
            </div>
            <div className="metric">
              <dt>采样率</dt>
              <dd>{detail.capabilities.sampleRateZh || '未标注'}</dd>
            </div>
            <div className="metric">
              <dt>实时性</dt>
              <dd>{detail.capabilities.realtimeZh || '未标注'}</dd>
            </div>
            <div className="metric">
              <dt>批量</dt>
              <dd>{detail.capabilities.batchZh || '未标注'}</dd>
            </div>
            <div className="metric">
              <dt>平台</dt>
              <dd>{detail.capabilities.platformZh || '未标注'}</dd>
            </div>
          </dl>
          <div className="chip-row">
            {repo.techStack.slice(0, 8).map((tech) => (
              <span key={tech} className="tone">
                {tech}
              </span>
            ))}
          </div>
        </section>

        <section className="panel" aria-labelledby="use-title">
          <h2 className="panel__title" id="use-title">
            <Icon name="headphones" size={16} />
            谁在什么场景用它
          </h2>
          {detail.useCases.length > 0 ? (
            <div>
              {detail.useCases.slice(0, 5).map((item, index) => (
                <article key={`${item.scenarioZh}-${index}`} className="use-case">
                  <span className="use-case__scenario">{item.scenarioZh}</span>
                  <span className="use-case__who">
                    {item.whoZh}
                    {item.fit ? ` · ${item.fit}` : ''}
                  </span>
                  <span className="use-case__why">{item.whyZh}</span>
                  {item.deliverableZh ? (
                    <span className="use-case__who">交付：{item.deliverableZh}</span>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="bullet-list">
              {detail.chooseWhenZh ? <li>选它：{detail.chooseWhenZh}</li> : null}
              {detail.avoidWhenZh ? <li>别选：{detail.avoidWhenZh}</li> : null}
              {repo.bestFor ? <li>最适合：{repo.bestFor}</li> : null}
              <li>{repo.descriptionZh}</li>
            </div>
          )}
        </section>

        <section className="panel" aria-labelledby="flow-title">
          <h2 className="panel__title" id="flow-title">
            <Icon name="arrow-right" size={16} />
            上手流程
          </h2>
          {detail.workflow.length > 0 ? (
            <div className="workflow">
              {detail.workflow.map((step, index) => (
                <div key={`${step.stepZh}-${index}`} className="workflow-step">
                  <span className="workflow-step__num">{index + 1}</span>
                  <div>
                    <div>
                      {step.stepZh}
                      {step.effortZh ? <span className="muted">（{step.effortZh}）</span> : null}
                    </div>
                    <div className="workflow-step__detail">{step.detailZh}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bullet-list">
              <li>安装难度 {repo.installComplexity}/5，命令行 {CLI_LABELS[repo.cliHeadless]}，Windows {WINDOWS_LABELS[repo.windowsSupport]}。</li>
              <li>
                本地目录：<code>{localPath}</code>
              </li>
              <li>真实档案未就绪，这里先给出基础运行门槛，不编造具体命令。</li>
            </div>
          )}
        </section>

        <section className="panel" aria-labelledby="score-title">
          <h2 className="panel__title" id="score-title">
            <Icon name="grid" size={16} />
            六维评分
          </h2>
          {SCORE_DIMENSIONS.map((dim) => (
            <div key={dim.key} className="score-row" title={dim.hint}>
              <span>{dim.label}</span>
              <span className="score-bar">
                <span style={{ width: `${scorePercent(repo.scores[dim.key])}%` }} />
              </span>
              <b>{repo.scores[dim.key].toFixed(1)}</b>
            </div>
          ))}
        </section>

        <section className="panel" aria-labelledby="limits-title">
          <h2 className="panel__title" id="limits-title">
            <Icon name="alert" size={16} />
            差异点与限制
          </h2>
          {detail.differentiators.length > 0 ? (
            <ul className="bullet-list is-good">
              {detail.differentiators.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
          {detail.limits.length > 0 ? (
            <ul className="bullet-list is-warn">
              {detail.limits.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
          {sample.limitsZh ? (
            <p className="panel__note">样例实测边界：{sample.limitsZh}</p>
          ) : null}
          {detail.limits.length === 0 && detail.differentiators.length === 0 && !sample.limitsZh ? (
            <p className="panel__note">档案未标注限制；以样例分段与能力边界为准，不额外推断。</p>
          ) : null}
        </section>

        <section className="panel" aria-labelledby="compare-title">
          <h2 className="panel__title" id="compare-title">
            <Icon name="compare" size={16} />
            该和谁对比
          </h2>
          {detail.compareTips.length > 0 ? (
            <div className="bullet-list">
              {detail.compareTips.map((tip, index) => (
                <li key={`${tip.vs}-${index}`}>
                  vs {tip.vs}：{tip.adviceZh}
                </li>
              ))}
            </div>
          ) : null}
          {contrast.length > 0 ? (
            <div className="chip-row">
              {contrast.map((rival) => (
                <button
                  key={rival.id}
                  type="button"
                  className="chip"
                  onClick={() => {
                    if (selected.includes(repo.id) && selected.length === 2) {
                      const other = selected.find((id) => id !== repo.id);
                      if (other) {
                        onCompare(repo.id, other);
                        return;
                      }
                    }
                    onCompare(repo.id, rival.id);
                  }}
                >
                  A/B：{rival.repo}
                </button>
              ))}
            </div>
          ) : (
            <p className="panel__note">数据层没有记录对照组；可在全量矩阵里手动选两个并排试听。</p>
          )}
          <button type="button" className="button button--small button--ghost" onClick={onOpenMatrix}>
            去矩阵里挑对手
          </button>
        </section>

        <section className="panel panel--inset" aria-labelledby="evidence-title">
          <h2 className="panel__title" id="evidence-title">
            <Icon name="check" size={16} />
            证据与来源
          </h2>
          {detail.evidence.length > 0 ? (
            <div className="bullet-list">
              {detail.evidence.slice(0, 8).map((item, index) => (
                <li key={`${item.field}-${index}`}>
                  {item.field}：{item.noteZh} <span className="muted">（{item.source}）</span>
                </li>
              ))}
            </div>
          ) : (
            <p className="panel__note">证据文件尚未接入；样例 metadata 与仓库 README 是当前可核对的来源。</p>
          )}
          <div className="sample-spec">
            <span>样例目录 <b>{sample.audioPath ?? '未生成'}</b></span>
            <span>核心识读点 <b>{sample.signatureZh ?? '—'}</b></span>
          </div>
          <p className="panel__note">
            数据源：仓库档案 + 样例 meta；{isFallback ? '深度档案未就绪，本页由基础字段合成。' : '深度档案已接入。'}
          </p>
        </section>
      </div>
    </div>
  );
}
