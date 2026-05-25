/// <reference types="node" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.stories.tsx', 'src/test/**', 'src/vite-env.d.ts'],
    },
  },
  plugins: [react()],
  base: process.env.GITHUB_PAGES ? '/floaty/' : '/',
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'FloatyWidget',
      formats: ['es', 'cjs'],
      fileName: (format) =>
        format === 'es' ? 'index.es.js' : 'index.cjs',
    },
    rollupOptions: {
      external: (id) => /^react(-dom)?(\/.*)?$/.test(id),
    },
  },
});
