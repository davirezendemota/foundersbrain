import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

interface InputBarProps {
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
}

export function InputBar({ input, isLoading, onInputChange, onSubmit }: InputBarProps) {
  const { t } = useTranslation();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="shrink-0 border-t border-[var(--border-subtle)] px-5 py-4" onSubmit={handleSubmit}>
      <div className="composer-wrap">
        <textarea
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              onSubmit();
            }
          }}
          placeholder={t('workspace.composer.placeholder')}
          className="w-full resize-none bg-transparent text-sm leading-6 text-[var(--fg-primary)] outline-none placeholder:text-[var(--fg-faint)]"
          style={{ minHeight: '44px' }}
          disabled={isLoading}
        />
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1" />
          <button
            type="submit"
            className={cn('composer-submit-button', input.trim() && 'composer-submit-button-filled')}
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? '...' : t('workspace.composer.send')}
          </button>
        </div>
      </div>
    </form>
  );
}
