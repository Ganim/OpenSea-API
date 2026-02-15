import { build } from 'esbuild';

await build({
  entryPoints: ['prisma/seed.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'build/seed.mjs',
  target: 'node22',
  external: ['@prisma/adapter-pg', 'bcryptjs', 'pg'],
  plugins: [
    {
      name: 'prisma-client-redirect',
      setup(b) {
        // Redirect the relative PrismaClient import to the correct path
        // when executed from build/seed.mjs
        b.onResolve({ filter: /\.\/generated\/prisma\/client/ }, () => ({
          path: '../prisma/generated/prisma/client.js',
          external: true,
        }));
      },
    },
  ],
});

console.log('✅ Seed compiled to build/seed.mjs');
