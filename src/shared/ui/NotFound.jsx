import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  // Ensure the page respects dark mode to match the fallback background
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.style.overflow = 'auto';
  }, []);

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
      <h1 style={{ margin: 0, fontSize: '3rem', fontWeight: 800, color: '#a16161' }}>404</h1>
      <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Page not found</h2>
      <p style={{ margin: 0, opacity: 0.75, fontSize: '0.9rem', maxWidth: '400px', lineHeight: 1.5 }}>
        The link you followed may be broken, or the page may have been removed.
      </p>

      <div style={{ marginTop: '16px' }}>
        <Link
          to="/"
          style={{
            display: 'inline-block',
            padding: '10px 22px',
            borderRadius: '8px',
            border: '1px solid #333',
            background: '#1a1a1a',
            color: '#f5f5f5',
            fontSize: '0.9rem',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Go to Homepage
        </Link>
      </div>
    </main>
  );
}
