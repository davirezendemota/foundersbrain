import { useMemo, useState } from 'react';

import type { GenUiComponentProps } from '@/lib/componentMap';
import { cn } from '@/lib/utils';

interface SearchSelectArgs {
  label?: string;
  options?: string[];
}

export function SearchSelectComponent({ invocation, onResult, disabled }: GenUiComponentProps) {
  const args = invocation.args as SearchSelectArgs;
  const label = args.label ?? 'Buscar opção';
  const options = args.options ?? [];
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) => option.toLowerCase().includes(normalized));
  }, [options, query]);

  return (
    <div className="genui-card">
      <label className="genui-label" htmlFor={`search-${invocation.toolCallId}`}>
        {label}
      </label>
      <input
        id={`search-${invocation.toolCallId}`}
        type="search"
        className="genui-input"
        placeholder="Digite para filtrar..."
        value={query}
        disabled={disabled || invocation.state === 'result'}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className="genui-option-list">
        {filtered.map((option) => (
          <button
            key={option}
            type="button"
            className={cn('genui-option', invocation.result === option && 'genui-option-selected')}
            disabled={disabled || invocation.state === 'result'}
            onClick={() => onResult(option)}
          >
            {option}
          </button>
        ))}
        {!filtered.length && <p className="genui-muted">Nenhuma opção encontrada.</p>}
      </div>
      {invocation.result && <p className="genui-result">Selecionado: {invocation.result}</p>}
    </div>
  );
}
