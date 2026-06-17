import { useEffect, useState } from 'react';

/*
 * useWebGL: detects whether WebGL is usable in this browser/session.
 *
 * We probe a throwaway canvas once on mount. If the context can't be created
 * (old browser, disabled GPU, headless, blocklisted driver) we report false so
 * the ModeSelector can render its CSS-only "cosmic-lite" fallback instead of a
 * dead black three.js canvas.
 *
 * Returns null until the probe runs (so the first paint can stay neutral), then
 * true/false. Treat null as "unknown — don't commit to either path yet".
 */

function probe() {
  if (typeof window === 'undefined') return false;
  // some browsers gate WebGL behind a flag that throws on getContext
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    return !!gl;
  } catch {
    return false;
  }
}

export default function useWebGL() {
  const [supported, setSupported] = useState(null);

  useEffect(() => {
    setSupported(probe());

    // a lost context (GPU reset, tab throttling) should also drop us to fallback
    const onLost = () => setSupported(false);
    window.addEventListener('webglcontextlost', onLost);
    return () => window.removeEventListener('webglcontextlost', onLost);
  }, []);

  return supported;
}
