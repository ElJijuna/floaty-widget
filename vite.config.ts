import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
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
