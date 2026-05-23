

import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useRef, useState } from 'react';

interface SubApp {
  id: string;
  label: string;
}

const SUB_APPS: SubApp[] = [
  { id: 'chat', label: 'Chat' },
  { id: 'content-library', label: 'Content Library' },
];

interface SubAppSelectorProps {
  value?: string;
  onChange?: (id: string) => void;
}

export default function SubAppSelector({ value = 'chat', onChange }: SubAppSelectorProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const active = SUB_APPS.find((a) => a.id === value) ?? SUB_APPS[0];

  useEffect(() => {
    if (!open) return;
    function onOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1 text-xs font-medium text-[var(--fg-secondary)] transition-colors duration-150 hover:border-[var(--border-strong)] hover:text-[var(--fg-primary)]"
      >
        <span>{active.label}</span>
        <FontAwesomeIcon
          icon={faChevronDown}
          className="h-2.5 w-2.5 transition-transform duration-150"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-50 mt-1.5 min-w-[100px] overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] py-1 shadow-lg shadow-black/40"
        >
          {SUB_APPS.map((app) => (
            <button
              key={app.id}
              role="option"
              aria-selected={app.id === value}
              onClick={() => {
                onChange?.(app.id);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs font-medium transition-colors duration-100 hover:bg-white/5 ${
                app.id === value
                  ? 'text-[var(--fg-primary)]'
                  : 'text-[var(--fg-secondary)] hover:text-[var(--fg-primary)]'
              }`}
            >
              <span>{app.label}</span>
              {app.id === value && (
                <span className="ml-3 text-[10px] text-[var(--accent-active)]">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
