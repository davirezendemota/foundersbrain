import { faTrash, faLink, faSpinner } from '@fortawesome/free-solid-svg-icons';
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

const PLATFORM_COLORS: Record<string, string> = {
  youtube: '#FF0000',
  tiktok: '#010101',
  instagram: '#E1306C',
  x: '#1DA1F2',
  other: '#6B7280',
};

const PLATFORM_LABELS: Record<string, string> = {
  youtube: 'YouTube',
  tiktok: 'TikTok',
  instagram: 'Instagram',
  x: 'X',
  other: 'Link',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

interface ContentCardProps {
  item: ContentItem;
  onDelete: (id: number) => void;
}

function ContentCard({ item, onDelete }: ContentCardProps) {
  const color = PLATFORM_COLORS[item.platform] ?? PLATFORM_COLORS.other;
  const label = PLATFORM_LABELS[item.platform] ?? item.platform;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] transition-colors hover:border-[var(--border-strong)]">
      <a href={item.url} target="_blank" rel="noreferrer" className="block flex-shrink-0">
        {item.thumbnail_url ? (
          <img
            src={item.thumbnail_url}
            alt={item.title ?? ''}
            className="aspect-video w-full object-cover"
          />
        ) : (
          <div
            className="aspect-video w-full flex items-center justify-center"
            style={{ backgroundColor: `${color}22` }}
          >
            <FontAwesomeIcon icon={faLink} className="h-6 w-6" style={{ color }} aria-hidden="true" />
          </div>
        )}
      </a>

      <span
        className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
        style={{ backgroundColor: color }}
      >
        {label}
      </span>

      <button
        type="button"
        onClick={() => onDelete(item.id)}
        aria-label="Remover"
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80"
      >
        <FontAwesomeIcon icon={faTrash} className="h-3 w-3" aria-hidden="true" />
      </button>

      <div className="flex flex-1 flex-col gap-1 p-3">
        {item.title && (
          <p className="line-clamp-2 text-sm font-medium leading-snug text-[var(--fg-primary)]">
            {item.title}
          </p>
        )}
        {item.description && (
          <p className="line-clamp-3 text-xs leading-relaxed text-[var(--fg-secondary)]">
            {item.description}
          </p>
        )}
        <div className="mt-auto flex items-center gap-2 pt-2 text-[10px] text-[var(--fg-muted)]">
          {item.author && <span className="truncate">{item.author}</span>}
          {item.author && <span>·</span>}
          <span className="shrink-0">{formatDate(item.created_at)}</span>
        </div>
      </div>
    </article>
  );
}

export default function ContentLibraryPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [url, setUrl] = useState('');
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);

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

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleAdd();
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 border-b border-[var(--border-subtle)] px-6 py-4">
        <div className="flex max-w-2xl gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('contentLibrary.placeholder')}
            disabled={adding}
            className="flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--fg-primary)] outline-none placeholder:text-[var(--fg-muted)] focus:border-[var(--border-strong)] disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!url.trim() || adding}
            className="composer-submit-button shrink-0 px-5 text-sm disabled:opacity-40"
          >
            {adding ? (
              <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              t('contentLibrary.add')
            )}
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        {loading && (
          <div className="flex items-center justify-center py-20 text-[var(--fg-muted)]">
            <FontAwesomeIcon icon={faSpinner} className="h-5 w-5 animate-spin" aria-hidden="true" />
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-2 text-center">
            <FontAwesomeIcon icon={faLink} className="h-8 w-8 text-[var(--fg-muted)]" aria-hidden="true" />
            <p className="text-sm text-[var(--fg-secondary)]">{t('contentLibrary.empty')}</p>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <ContentCard key={item.id} item={item} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
