import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// base './' keeps asset paths relative; the single-file plugin inlines JS/CSS so
// dist/explorer.html opens offline by double-click.
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  build: { target: 'es2020' },
  test: { include: ['tests/**/*.test.ts'] },
});
