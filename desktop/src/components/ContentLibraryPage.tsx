import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState, KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface ContentItem {
  id: number;
  url: string;
  platform: string;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  author: string | null;
  created_at: string;
}

const PLATFORM_TINTS: Record<string, string> = {
  youtube:   'oklch(0.30 0.04 25)',
  tiktok:    'oklch(0.26 0.04 200)',
  instagram: 'oklch(0.28 0.04 350)',
  x:         'oklch(0.26 0.04 240)',
  other:     'oklch(0.28 0.02 80)',
};

const PLATFORM_ACCENT: Record<string, string> = {
  youtube:   'oklch(0.72 0.10 25)',
  tiktok:    'oklch(0.78 0.06 200)',
  instagram: 'oklch(0.72 0.08 350)',
  x:         'oklch(0.78 0.05 240)',
  other:     'oklch(0.78 0.02 80)',
};

const PLATFORM_LABELS: Record<string, string> = {
  youtube:   'YouTube',
  tiktok:    'TikTok',
  instagram: 'Instagram',
  x:         'X',
  other:     'Web',
};

const PLATFORM_GLYPH: Record<string, string> = {
  youtube:   '▶',
  tiktok:    '♪',
  instagram: '◉',
  x:         '×',
  other:     '◇',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function PlatformDot({ platform, size = 13 }: { platform: string; size?: number }) {
  const accent = PLATFORM_ACCENT[platform] ?? PLATFORM_ACCENT.other;
  const glyph  = PLATFORM_GLYPH[platform]  ?? PLATFORM_GLYPH.other;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: size, height: size, borderRadius: 4,
      background: `color-mix(in oklab, ${accent} 22%, transparent)`,
      color: accent,
      fontFamily: '"Geist Mono", ui-monospace, monospace',
      fontSize: size * 0.65, lineHeight: 1, fontWeight: 600,
    }}>{glyph}</span>
  );
}

function StripedPlaceholder({ platform }: { platform: string }) {
  const tint = PLATFORM_TINTS[platform] ?? PLATFORM_TINTS.other;
  const id = Math.random().toString(36).slice(2);
  return (
    <div className="fb-striped-placeholder aspect-video">
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.9 }}>
        <defs>
          <pattern id={`sp-${id}`} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="14" height="14" fill="transparent" />
            <line x1="0" y1="0" x2="0" y2="14" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={tint} />
        <rect width="100%" height="100%" fill={`url(#sp-${id})`} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(120% 80% at 50% 100%, rgba(0,0,0,0.35), rgba(0,0,0,0) 60%)',
      }} />
      <span className="fb-striped-placeholder-label">
        {(PLATFORM_LABELS[platform] ?? 'Web').toUpperCase()} · THUMBNAIL
      </span>
    </div>
  );
}

interface ContentCardProps {
  item: ContentItem;
  onDelete: (id: number) => void;
}

function ContentCard({ item, onDelete }: ContentCardProps) {
  const label = PLATFORM_LABELS[item.platform] ?? item.platform;

  return (
    <article className="fb-card">
      <div style={{ position: 'relative' }}>
        {item.thumbnail_url ? (
          <a href={item.url} target="_blank" rel="noreferrer" className="block">
            <img
              src={item.thumbnail_url}
              alt={item.title ?? ''}
              className="aspect-video w-full object-cover"
            />
          </a>
        ) : (
          <a href={item.url} target="_blank" rel="noreferrer" className="block">
            <StripedPlaceholder platform={item.platform} />
          </a>
        )}

        {/* gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)',
        }} />

        {/* platform badge */}
        <div style={{
          position: 'absolute', top: 8, left: 8,
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '3px 7px', borderRadius: 4,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
          fontFamily: '"Geist Mono", ui-monospace, monospace',
          fontSize: 9.5, letterSpacing: '0.06em', color: '#fff', textTransform: 'uppercase',
        }}>
          <PlatformDot platform={item.platform} size={11} />
          <span>{label}</span>
        </div>

        {/* delete button — visible on hover */}
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          aria-label="Remover"
          className="fb-card-actions"
          style={{
            position: 'absolute', top: 8, right: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 26, height: 26, borderRadius: 6,
            background: 'rgba(0,0,0,0.60)',
            border: '0.5px solid rgba(255,255,255,0.15)',
            color: '#fff', cursor: 'pointer', fontSize: 11,
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {item.title && (
          <p style={{
            fontSize: 13.5, lineHeight: 1.35, color: 'var(--fg-primary)',
            letterSpacing: '-0.005em',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>{item.title}</p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--fg-muted)' }}>
          {item.author && <span style={{ color: 'var(--fg-secondary)' }}>{item.author}</span>}
          {item.author && <span>·</span>}
          <span>{formatDate(item.created_at)}</span>
          <div style={{ flex: 1 }} />
          <div className="fb-card-actions" style={{ display: 'flex', gap: 4 }}>
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              title="Abrir"
              style={{
                width: 26, height: 26, borderRadius: 6,
                background: 'transparent', border: '0.5px solid var(--hairline)',
                color: 'var(--fg-secondary)', cursor: 'pointer', fontSize: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                textDecoration: 'none',
              }}
            >↗</a>
          </div>
        </div>
      </div>
    </article>
  );
}

type InputMode = 'search' | 'save';

interface HybridInputProps {
  url: string;
  onUrlChange: (v: string) => void;
  onAdd: () => void;
  adding: boolean;
}

function HybridInput({ url, onUrlChange, onAdd, adding }: HybridInputProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<InputMode>('search');
  const isSave = mode === 'save';

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && isSave) onAdd();
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 14px', borderRadius: 12,
      background: 'var(--bg-elevated)',
      border: `0.5px solid ${isSave ? 'oklch(0.82 0.06 80 / 0.30)' : 'var(--outline)'}`,
      boxShadow: isSave
        ? '0 0 0 3px oklch(0.82 0.06 80 / 0.05), 0 8px 24px rgba(0,0,0,0.4)'
        : '0 8px 24px rgba(0,0,0,0.35)',
      transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    }}>
      <span style={{
        fontSize: 15, width: 18, textAlign: 'center',
        color: isSave ? 'var(--accent-active)' : 'var(--fg-muted)',
      }}>
        {isSave ? '↗' : '⌕'}
      </span>

      <input
        type={isSave ? 'url' : 'search'}
        value={isSave ? url : ''}
        onChange={(e) => { if (isSave) onUrlChange(e.target.value); }}
        onKeyDown={handleKeyDown}
        placeholder={isSave
          ? t('contentLibrary.placeholder')
          : t('contentLibrary.searchPlaceholder', { defaultValue: 'Buscar na biblioteca…' })}
        disabled={adding}
        style={{
          flex: 1, background: 'transparent', border: 'none', outline: 'none',
          fontSize: 14.5, color: isSave ? 'var(--fg-primary)' : 'var(--fg-faint)',
          caretColor: 'var(--accent-active)',
        }}
      />

      {!isSave && (
        <div style={{
          fontFamily: '"Geist Mono", monospace', fontSize: 10, color: 'var(--fg-faint)',
          padding: '3px 6px', borderRadius: 4, border: '0.5px solid var(--hairline)',
        }}>⌘F</div>
      )}

      <button
        type="button"
        onClick={() => setMode(isSave ? 'search' : 'save')}
        title={isSave ? 'Voltar à busca' : 'Salvar URL'}
        disabled={adding}
        style={{
          width: 36, height: 36, borderRadius: 9,
          background: isSave ? 'var(--accent-active)' : 'var(--bg-card)',
          border: `0.5px solid ${isSave ? 'var(--accent-active)' : 'var(--outline)'}`,
          color: isSave ? '#1a1a1f' : 'var(--fg-primary)',
          cursor: 'pointer', fontSize: 20, lineHeight: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.18s ease',
          transform: isSave ? 'rotate(45deg)' : 'rotate(0)',
          fontWeight: 300, flexShrink: 0,
        }}
      >
        {adding ? <FontAwesomeIcon icon={faSpinner} style={{ fontSize: 14 }} className="animate-spin" /> : '+'}
      </button>

      {isSave && url.trim() && (
        <button
          type="button"
          onClick={onAdd}
          disabled={adding}
          style={{
            display: 'inline-flex', alignItems: 'center',
            minHeight: 32, padding: '0 14px', borderRadius: 999,
            background: 'oklch(0.82 0.06 80 / 0.14)',
            border: '0.5px solid oklch(0.82 0.06 80 / 0.35)',
            color: 'var(--fg-primary)', fontSize: 12.5,
            cursor: 'pointer', flexShrink: 0,
            transition: 'background 0.15s ease',
          }}
        >
          {t('contentLibrary.add')}
        </button>
      )}
    </div>
  );
}

interface PlatformBadgesProps {
  items: ContentItem[];
  active: string | null;
  onChange: (p: string | null) => void;
}

function PlatformBadges({ items, active, onChange }: PlatformBadgesProps) {
  const counts: Record<string, number> = {};
  for (const it of items) {
    counts[it.platform] = (counts[it.platform] ?? 0) + 1;
  }

  const platforms = Object.keys(counts);
  const all = items.length;

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <button
        type="button"
        className={`fb-chip ${active === null ? 'is-active' : ''}`}
        onClick={() => onChange(null)}
      >
        <span>Tudo</span>
        <span className="chip-count">{all}</span>
      </button>
      {platforms.map((p) => (
        <button
          key={p}
          type="button"
          className={`fb-chip ${active === p ? 'is-active' : ''}`}
          onClick={() => onChange(p)}
        >
          <PlatformDot platform={p} size={13} />
          <span>{PLATFORM_LABELS[p] ?? p}</span>
          <span className="chip-count">{counts[p]}</span>
        </button>
      ))}
    </div>
  );
}

export default function ContentLibraryPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [url, setUrl] = useState('');
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activePlatform, setActivePlatform] = useState<string | null>(null);

  const backendUrl = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:10001';

  useEffect(() => {
    fetch(`${backendUrl}/content/`)
      .then((r) => r.json())
      .then((data: ContentItem[]) => setItems(data))
      .catch(() => toast.error(t('contentLibrary.fetchError')))
      .finally(() => setLoading(false));
  }, [backendUrl]);

  async function handleAdd() {
    const trimmed = url.trim();
    if (!trimmed || adding) return;

    setAdding(true);
    try {
      const res = await fetch(`${backendUrl}/content/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.detail ?? t('contentLibrary.addError'));
        return;
      }

      const item: ContentItem = await res.json();
      setItems((prev) => [item, ...prev]);
      setUrl('');
    } catch {
      toast.error(t('contentLibrary.addError'));
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await fetch(`${backendUrl}/content/${id}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch {
      toast.error(t('contentLibrary.deleteError'));
    }
  }

  const visibleItems = activePlatform
    ? items.filter((it) => it.platform === activePlatform)
    : items;

  return (
    <div className="flex h-full flex-col overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      <div style={{ padding: '28px 36px 12px', flexShrink: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 18,
        }}>
          <h1 style={{
            margin: 0, fontSize: 22, fontWeight: 500,
            letterSpacing: '-0.015em', color: 'var(--fg-primary)',
          }}>Content Library</h1>
          <span style={{
            fontFamily: '"Geist Mono", ui-monospace, monospace',
            fontSize: 11, color: 'var(--fg-muted)', letterSpacing: '0.06em',
          }}>{items.length} ITENS</span>
        </div>

        <HybridInput url={url} onUrlChange={setUrl} onAdd={handleAdd} adding={adding} />

        <div style={{ height: 14 }} />
        {items.length > 0 && (
          <PlatformBadges items={items} active={activePlatform} onChange={setActivePlatform} />
        )}
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px 36px 36px' }}>
        {loading && (
          <div className="flex items-center justify-center py-20 text-[var(--fg-muted)]">
            <FontAwesomeIcon icon={faSpinner} className="h-5 w-5 animate-spin" aria-hidden="true" />
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <span style={{ fontSize: 32, opacity: 0.3 }}>◇</span>
            <p style={{ fontSize: 14, color: 'var(--fg-secondary)' }}>{t('contentLibrary.empty')}</p>
          </div>
        )}

        {!loading && visibleItems.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: 16,
          }}>
            {visibleItems.map((item) => (
              <ContentCard key={item.id} item={item} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
