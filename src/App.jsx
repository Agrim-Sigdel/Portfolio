import React, { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useTheme } from './shared/lib/ThemeContext';
import ModeSelector from './features/modeSelection/ui/ModeSelector';
import './pages/funMode/funMode.css';
import './App.css';

// Each mode is its own bundle; only the chosen one is fetched on demand.
const Terminal = lazy(() => import('./features/terminalMode/ui/Terminal'));
const FunModePage = lazy(() => import('./pages/funMode/FunModePage'));
const NormalModePage = lazy(() => import('./pages/normalMode/NormalModePage'));

/*
 * URL <-> internal mode id mapping. The internal ids predate the routes, so the
 * public slugs are deliberately friendlier than the ids:
 *   /            -> mode selector
 *   /cv          -> 'normal' (the professional CV page)
 *   /normal      -> 'fun'    (the interactive "normal" portfolio)
 *   /terminal    -> 'work'   (the terminal interface)
 */
const SLUG_TO_MODE = { cv: 'normal', normal: 'fun', terminal: 'work' };
const MODE_TO_SLUG = { normal: 'cv', fun: 'normal', work: 'terminal' };

// data-theme applied per mode (matches the previous behaviour).
const MODE_THEME = { fun: null, work: 'dark', normal: 'light' }; // null = respect user theme

function App() {
  return (
    <Routes>
      <Route path="/" element={<SelectorRoute />} />
      <Route path="/:slug" element={<ModeRoute />} />
      {/* Unknown path -> back to the selector */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/* ----------------------------------------------------- mode selector ('/') */
function SelectorRoute() {
  const navigate = useNavigate();

  // Start page defaults to dark deep-space; lock scroll while it's up.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  // ModeSelector plays its own warp transition, then calls this with the mode id.
  const handleModeSelection = (mode) => navigate(`/${MODE_TO_SLUG[mode]}`);

  return (
    <div className="App">
      <AnimatePresence mode="wait">
        <ModeSelector onSelectMode={handleModeSelection} />
      </AnimatePresence>
    </div>
  );
}

/* ----------------------------------------------- a selected mode ('/:slug') */
function ModeRoute() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const mode = SLUG_TO_MODE[slug];

  // Apply this mode's theme. Fun mode respects the user's light/dark preference.
  useEffect(() => {
    if (!mode) return;
    const forced = MODE_THEME[mode];
    document.documentElement.setAttribute('data-theme', forced ?? theme);
  }, [mode, theme]);

  // Mode pages scroll normally.
  useEffect(() => {
    document.body.style.overflow = 'auto';
  }, []);

  // Unknown slug -> selector.
  if (!mode) return <Navigate to="/" replace />;

  // Navigate by internal mode id so the slug mapping stays in one place. The
  // terminal's "switchToFun"/"switchToNormal" correspond to the internal ids
  // 'fun' (/normal) and 'normal' (/cv) respectively.
  const goToMode = (id) => navigate(`/${MODE_TO_SLUG[id]}`);
  const goToStart = () => navigate('/');

  return (
    <div className="App">
      <Suspense fallback={null}>
        {/* FUN MODE - Modern interactive website */}
        {mode === 'fun' && <FunModePage onResetMode={goToStart} />}

        {/* WORK MODE - Terminal interface */}
        {mode === 'work' && (
          <Terminal
            onSwitchToFun={() => goToMode('fun')}
            onSwitchToNormal={() => goToMode('normal')}
            onResetMode={goToStart}
          />
        )}

        {/* NORMAL MODE - Clean simple HTML */}
        {mode === 'normal' && <NormalModePage onResetMode={goToStart} />}
      </Suspense>
    </div>
  );
}

export default App;
