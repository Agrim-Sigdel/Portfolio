import React from 'react';

/*
 * Catches render/chunk-load errors from the lazy-loaded mode pages so a failed
 * fetch (flaky network, stale deploy hash) shows a retry screen instead of a
 * blank page. Reload is the reliable recovery for stale-chunk errors — React
 * caches a rejected lazy() import, so re-rendering alone won't refetch it.
 */
export default class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    
    const isDev = import.meta.env.DEV;

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

        {isDev && this.state.error && (
          <pre
            style={{
              textAlign: 'left',
              background: 'rgba(255, 76, 43, 0.1)',
              border: '1px solid rgba(255, 76, 43, 0.3)',
              padding: '16px',
              borderRadius: '8px',
              overflow: 'auto',
              maxWidth: '90%',
              fontSize: '0.8rem',
              color: '#ffb0a3'
            }}
          >
            {this.state.error.toString()}
          </pre>
        )}

        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
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
          <button
            type="button"
            onClick={() => window.location.href = '/'}
            style={{
              padding: '10px 22px',
              borderRadius: '8px',
              border: '1px solid #333',
              background: '#1a1a1a',
              color: '#f5f5f5',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Go to Homepage
          </button>
        </div>
      </main>
    );
  }
}
