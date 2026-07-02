import React from 'react';

/*
 * Catches render/chunk-load errors from the lazy-loaded mode pages so a failed
 * fetch (flaky network, stale deploy hash) shows a retry screen instead of a
 * blank page. Reload is the reliable recovery for stale-chunk errors — React
 * caches a rejected lazy() import, so re-rendering alone won't refetch it.
 */
export default class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          background: '#0b0b0b',
          color: '#f5f5f5',
          fontFamily: "'Instrument Sans', 'Inter', system-ui, sans-serif",
          textAlign: 'center',
          padding: '24px',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '1.4rem' }}>Something went wrong loading this page</h1>
        <p style={{ margin: 0, opacity: 0.75, fontSize: '0.9rem' }}>
          This usually happens on a flaky connection or after a new deploy.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 22px',
            borderRadius: '8px',
            border: '1px solid #ff4c2b',
            background: 'transparent',
            color: '#ff4c2b',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Reload
        </button>
      </main>
    );
  }
}
