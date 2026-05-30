import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': 'http://localhost:27600',
      '/events': 'http://localhost:27600',
      '/run': 'http://localhost:27600',
      '/reset': 'http://localhost:27600',
    },
  },
});
