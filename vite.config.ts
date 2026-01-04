import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // V development mode (npm run dev) používame koreňový adresár '/'
  // V production mode (npm run build) používame '/Kniha-jazd-new/' pre GitHub Pages
  base: mode === 'development' ? '/' : '/Kniha-jazd-new/',
  build: {
    outDir: 'dist',
  }
}));