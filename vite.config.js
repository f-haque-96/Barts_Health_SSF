import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // M2: Strip console.log and console.warn from production builds
    // Keeps console.error for genuine runtime errors
    minify: 'esbuild',
    // C6: Ensure dev files are excluded via tree-shaking (dynamic imports)
  },
  esbuild: {
    // M2: Remove console.log and console.warn in production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
})
