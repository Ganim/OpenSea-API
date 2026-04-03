#!/usr/bin/env node

/**
 * Run E2E tests in parallel shards using vitest's native --shard flag.
 *
 * Each shard gets its own vitest process, which creates its own template DB clone.
 * This gives near-linear speedup with zero code changes to tests.
 *
 * Usage:
 *   node scripts/run-e2e-sharded.mjs          # 4 shards (default)
 *   node scripts/run-e2e-sharded.mjs 2        # 2 shards
 *   node scripts/run-e2e-sharded.mjs 8        # 8 shards
 */

import { spawn } from 'node:child_process';

const SHARD_COUNT = parseInt(process.argv[2] || '4', 10);

console.log(`🚀 Running E2E tests with ${SHARD_COUNT} parallel shards...\n`);

const startTime = Date.now();

const shards = Array.from({ length: SHARD_COUNT }, (_, i) => {
  const shardId = i + 1;
  const label = `[shard ${shardId}/${SHARD_COUNT}]`;

  return new Promise((resolve) => {
    const child = spawn(
      'npx',
      [
        'vitest',
        'run',
        '--project',
        'e2e',
        `--shard=${shardId}/${SHARD_COUNT}`,
      ],
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
      // Extract summary from output
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

      if (code !== 0 && stderr) {
        // Show last 5 lines of stderr for failed shards
        const errLines = stderr.trim().split('\n').slice(-5);
        for (const line of errLines) {
          console.log(`${label} ⚠️  ${line}`);
        }
      }

      console.log('');
      resolve({ shardId, code, stdout, stderr });
    });
  });
});

const results = await Promise.all(shards);

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
const passed = results.filter((r) => r.code === 0).length;
const failed = results.filter((r) => r.code !== 0).length;

console.log('─'.repeat(60));
console.log(
  `✅ ${passed} shards passed, ${failed > 0 ? `❌ ${failed} shards failed` : 'all clean'}`,
);
console.log(`⏱  Total wall time: ${elapsed}s`);
console.log('─'.repeat(60));

process.exit(failed > 0 ? 1 : 0);
