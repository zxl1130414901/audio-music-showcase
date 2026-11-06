import type { Repo, RepoDetail } from '../types/repo';
import { resolveDecision } from '../lib/decision';

interface DecisionRowProps {
  repo: Repo;
  detail?: RepoDetail;
  repoById?: Map<string, Repo>;
  compact?: boolean;
  onOpenRepo?: (id: string) => void;
}

/** 「一耳朵是什么 → 什么时候选它 → 什么时候别选它」，缺字段逐条降级。 */
export function DecisionRow({ repo, detail, repoById, compact = false, onOpenRepo }: DecisionRowProps) {
  const decision = resolveDecision(repo, detail);
  const contrasts = decision.contrastWith
    .map((id) => repoById?.get(id))
    .filter((item): item is Repo => Boolean(item))
    .slice(0, 2);

  if (!decision.signatureZh && !decision.chooseWhenZh && !decision.avoidWhenZh && contrasts.length === 0) {
    return null;
  }

  return (
    <div className={`decision${compact ? ' decision--compact' : ''}`}>
      {decision.signatureZh ? <p className="decision__sig">{decision.signatureZh}</p> : null}
      {decision.chooseWhenZh || decision.avoidWhenZh ? (
        <div className="decision__pairs">
          {decision.chooseWhenZh ? (
            <div className="decision__pair">
              <span className="decision__label is-yes">什么时候选它</span>
              <span>{decision.chooseWhenZh}</span>
            </div>
          ) : null}
          {decision.avoidWhenZh ? (
            <div className="decision__pair">
              <span className="decision__label is-no">什么时候别选</span>
              <span>{decision.avoidWhenZh}</span>
            </div>
          ) : null}
        </div>
      ) : null}
      {contrasts.length > 0 ? (
        <div className="decision__contrast">
          <span>常与它们对比：</span>
          {contrasts.map((item) => (
            <a
              key={item.id}
              href={`#/repo/${encodeURIComponent(item.id)}`}
              onClick={(event) => {
                if (!onOpenRepo) return;
                event.preventDefault();
                onOpenRepo(item.id);
              }}
            >
              {item.repo}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}
