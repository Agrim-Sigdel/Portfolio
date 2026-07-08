import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Auto-update: a fresh service worker installs and activates on the next
      // visit, so deploys never serve stale content (no manual reload prompt).
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // The web app manifest is hand-maintained at
      // public/favicon_io-2/site.webmanifest and already linked from index.html,
      // so the plugin only builds and registers the service worker.
      manifest: false,
      workbox: {
        // Precache the app shell, icons, and normal-sized JS chunks.
        globPatterns: ['**/*.{css,html,ico,svg,woff2}', 'favicon_io-2/*.png', 'assets/*.js'],
        // Keep the precache lean: skip the heavy lazy chunk (the ~900 kB three.js
        // bundle behind the terminal-mode StarryNight). It's runtime-cached on
        // first use below, honoring the app's deliberate lazy-loading instead of
        // eagerly downloading it on service-worker install.
        globIgnores: ['**/StarryNight-*.js'],
        runtimeCaching: [
          {
            // Hashed JS chunks too large to precache (the 3D bundle): cache on
            // first use, then refresh in the background.
            urlPattern: /\/assets\/[^/]+\.js$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'js-chunks',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
        // SPA deep links resolve to the app shell when offline.
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
  build: {
    // The only oversized chunk is `three` (a 3D library), which is isolated and
    // lazy-loaded (terminal mode only) — so the default 500 kB warning is noise.
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        // Function-form chunking, deliberately minimal. We only name two chunks
        // that are genuinely stable across deploys, for long-term caching:
        //   - react-vendor: the React runtime (loads on every page anyway)
        //   - motion: framer-motion, dynamically imported by the mode pages only
        //
        // three / @react-three / easy-3dkit are INTENTIONALLY left to Vite's
        // default chunking. Forcing them into a named chunk makes the entry
        // statically import (and execute) all ~1 MB of three.js on the landing
        // page; left alone, Vite keeps them inside the lazy terminal-mode chunk,
        // so three is fetched only when someone actually opens the terminal.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (/[\\/](three|@react-three|easy-3dkit)[\\/]/.test(id)) return // default
          if (id.includes('framer-motion')) return 'motion'
          if (/[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id))
            return 'react-vendor'
        },
      },
    },
  },
})
