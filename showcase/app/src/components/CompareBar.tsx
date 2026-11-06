import type { Repo } from '../types/repo';
import { MAX_COMPARE } from '../lib/selection';

interface CompareBarProps {
  selected: string[];
  repoById: Map<string, Repo>;
  onRemove: (id: string) => void;
  onClear: () => void;
  onCompare: () => void;
}

export function CompareBar({ selected, repoById, onRemove, onClear, onCompare }: CompareBarProps) {
  if (selected.length === 0) return null;
  const slots: Array<string | null> = [selected[0] ?? null, selected[1] ?? null];

  return (
    <div className="compare-bar" role="region" aria-label="A/B 试听候选">
      <div className="compare-bar__slots">
        {slots.map((id, index) => {
          const repo = id ? repoById.get(id) : undefined;
          return (
            <span key={`${index}-${id ?? 'empty'}`} className={`slot${repo ? ' is-filled' : ''}`}>
              <span className="slot__tag">{index === 0 ? 'A' : 'B'}</span>
              {repo ? (
                <>
                  <span className="slot__name" title={repo.repo}>
                    {repo.repo}
                  </span>
                  <button
                    type="button"
                    className="slot__x"
                    onClick={() => onRemove(repo.id)}
                    aria-label={`从 A/B 移除 ${repo.repo}`}
                  >
                    ×
                  </button>
                </>
              ) : (
                <span>再选 1 个</span>
              )}
            </span>
          );
        })}
      </div>
      <div className="compare-bar__actions">
        <button type="button" className="button button--small button--solid" onClick={onCompare}>
          并排试听 {selected.length}/{MAX_COMPARE}
        </button>
        <button type="button" className="button button--small button--ghost" onClick={onClear}>
          清空
        </button>
      </div>
    </div>
  );
}
