interface AppTabStripProps {
  activeTab: 'chat' | 'content-library';
  onChange: (tab: 'chat' | 'content-library') => void;
  title?: string;
}

export default function AppTabStrip({ activeTab, onChange, title }: AppTabStripProps) {
  const displayTitle = title ?? (activeTab === 'chat' ? 'Second Brain' : 'Second Brain — Content Library');

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      height: 48,
      background: 'var(--bg-void)',
      borderBottom: '0.5px solid var(--hairline)',
      padding: '0 20px',
      flexShrink: 0,
      gap: 0,
      userSelect: 'none',
    }}>
      {/* title */}
      <span style={{
        fontSize: 13,
        fontWeight: 500,
        color: 'var(--fg-secondary)',
        letterSpacing: '-0.005em',
        marginRight: 24,
        flexShrink: 0,
      }}>
        {displayTitle}
      </span>

      {/* tabs */}
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 2, height: '100%' }}>
        {(['chat', 'content-library'] as const).map((tab) => {
          const label = tab === 'chat' ? 'Chat' : 'Content Library';
          const isActive = tab === activeTab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onChange(tab)}
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0 14px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: isActive ? 500 : 400,
                color: isActive ? 'var(--fg-primary)' : 'var(--fg-muted)',
                letterSpacing: '-0.005em',
                transition: 'color 120ms ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = 'var(--fg-secondary)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = 'var(--fg-muted)';
              }}
            >
              {label}
              {isActive && (
                <span style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 14,
                  right: 14,
                  height: 1.5,
                  borderRadius: 9999,
                  background: 'var(--accent-active)',
                }} />
              )}
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1 }} />

      {/* ⌘K badge */}
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 8px',
        borderRadius: 6,
        background: 'var(--bg-card)',
        border: '0.5px solid var(--hairline)',
        fontFamily: '"Geist Mono", ui-monospace, monospace',
        fontSize: 10.5,
        letterSpacing: '0.06em',
        color: 'var(--fg-muted)',
      }}>
        ⌘K
      </span>
    </div>
  );
}
