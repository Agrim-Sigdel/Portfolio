import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // The only oversized chunk is `three` (a 3D library), which is now isolated
    // and lazy-loaded — so the default 500 kB warning is just noise here.
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        // Split heavy, independently-cacheable vendors into their own chunks so
        // the 3D libraries don't bloat the initial bundle and stay cached across
        // deploys that only touch app code.
        manualChunks: {
          three: ['three', '@react-three/fiber', '@react-three/drei', 'easy-3dkit'],
          motion: ['framer-motion'],
        },
      },
    },
  },
})
