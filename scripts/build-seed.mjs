import { build } from 'esbuild';
import path from 'node:path';

await build({
  entryPoints: ['prisma/seed.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'build/seed.mjs',
  target: 'node22',
  // npm packages that exist in production node_modules
  external: ['@prisma/adapter-pg', '@prisma/client', 'bcryptjs', 'pg'],
  plugins: [
    {
      name: 'resolve-ts-extensions',
      setup(b) {
        // Prisma v7 generates .ts files but seed.ts imports with .js extension.
        // Resolve .js → .ts for prisma/generated/ so esbuild can bundle them.
        b.onResolve({ filter: /\.js$/ }, (args) => {
          if (args.importer.includes('generated') || args.resolveDir.includes('generated')) {
            const tsPath = args.path.replace(/\.js$/, '.ts');
            return { path: path.resolve(args.resolveDir, tsPath) };
          }
          return null;
        });
      },
    },
  ],
});

console.log('✅ Seed compiled to build/seed.mjs');
