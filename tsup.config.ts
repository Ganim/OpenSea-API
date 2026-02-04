import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts', 'src/app.ts'],
  format: ['esm'],
  target: 'node22',
  outDir: 'build',
  clean: true,
  sourcemap: false,
  splitting: false,
  skipNodeModulesBundle: true,
  noExternal: [/^@\//],
});
