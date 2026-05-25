/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

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
      formats: ['es', 'umd'],
      fileName: (format) =>
        format === 'es' ? 'index.es.js' : 'index.umd.cjs',
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
});
