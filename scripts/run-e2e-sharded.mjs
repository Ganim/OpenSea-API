#!/usr/bin/env node

/**
 * Run E2E tests in parallel using module-based sharding.
 *
 * Each shard runs a separate vitest process with a specific set of module
 * directories. This way each process only collects/imports its own specs,
 * avoiding the OOM issue where vitest's --shard flag imports ALL files in
 * every process.
 *
 * Each shard creates its own template DB clone automatically.
 *
 * Usage:
 *   node scripts/run-e2e-sharded.mjs       # run all shards in parallel
 */

import { spawn } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// ── Discover modules and their spec counts ──────────────────────────────
const controllersDir = 'src/http/controllers';
const modules = readdirSync(controllersDir)
  .filter((f) => statSync(join(controllersDir, f)).isDirectory())
  .map((mod) => {
    let count = 0;
    const countSpecs = (dir) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) countSpecs(join(dir, entry.name));
        else if (entry.name.endsWith('.e2e.spec.ts')) count++;
      }
    };
    countSpecs(join(controllersDir, mod));
    return { name: mod, count, path: `${controllersDir}/${mod}/` };
  })
  .filter((m) => m.count > 0)
  .sort((a, b) => b.count - a.count);

const totalSpecs = modules.reduce((sum, m) => sum + m.count, 0);

// ── Balance shards by spec count (greedy bin-packing) ───────────────────
// Target: 4 shards roughly balanced by number of specs
const SHARD_COUNT = 4;
const shardBuckets = Array.from({ length: SHARD_COUNT }, () => ({
  modules: [],
  count: 0,
}));

for (const mod of modules) {
  // Find the shard with the fewest specs
  const lightest = shardBuckets.reduce((min, s) =>
    s.count < min.count ? s : min,
  );
  lightest.modules.push(mod);
  lightest.count += mod.count;
}

console.log(
  `🚀 Running ${totalSpecs} E2E specs across ${SHARD_COUNT} shards:\n`,
);
for (let i = 0; i < SHARD_COUNT; i++) {
  const b = shardBuckets[i];
  const names = b.modules.map((m) => `${m.name}(${m.count})`).join(', ');
  console.log(`  Shard ${i + 1}: ${b.count} specs — ${names}`);
}
console.log('');

// ── Run shards in parallel ──────────────────────────────────────────────
const startTime = Date.now();

const shards = shardBuckets.map((bucket, i) => {
  const shardId = i + 1;
  const label = `[shard ${shardId}/${SHARD_COUNT}]`;
  const paths = bucket.modules.map((m) => m.path);

  return new Promise((resolve) => {
    const child = spawn(
      'npx',
      ['vitest', 'run', '--project', 'e2e', ...paths],
      {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
        env: { ...process.env, FORCE_COLOR: '1' },
      },
    );

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      const lines = stdout.split('\n');
      const summaryLines = lines.filter(
        (l) =>
          l.includes('Test Files') ||
          l.includes('Tests') ||
          l.includes('Duration'),
      );

      console.log(`${label} exit code: ${code}`);
      for (const line of summaryLines) {
        console.log(`${label} ${line.trim()}`);
      }

      if (code !== 0) {
        const errLines = (stderr || stdout).trim().split('\n').slice(-5);
        for (const line of errLines) {
          console.log(`${label} ⚠️  ${line}`);
        }
      }

      console.log('');
      resolve({ shardId, code, stdout, stderr, specCount: bucket.count });
    });
  });
});

const results = await Promise.all(shards);

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
const passed = results.filter((r) => r.code === 0).length;
const failed = results.filter((r) => r.code !== 0).length;

console.log('─'.repeat(60));
console.log(
  `${passed > 0 ? '✅' : '❌'} ${passed} shards passed, ${failed > 0 ? `❌ ${failed} shards failed` : 'all clean'}`,
);
console.log(
  `⏱  Total wall time: ${elapsed}s (${(elapsed / 60).toFixed(1)}min)`,
);
console.log('─'.repeat(60));

process.exit(failed > 0 ? 1 : 0);
