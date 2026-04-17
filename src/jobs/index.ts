import { logger } from '@/lib/logger';
import { checkTrainingExpiry } from './hr/check-training-expiry';

/**
 * Lightweight HR cron registrar.
 *
 * Runs in-process next to the other schedulers (finance, AI workflows) when
 * the `ENABLE_CRONS` env var is `"true"`. Production deployments may instead
 * run this through an external scheduler (e.g. Fly.io machines, Kubernetes
 * CronJob) by invoking each function directly — we expose the job
 * implementations as normal exports so they can also run standalone.
 *
 * Gated so unit / E2E test runs (NODE_ENV=test) do not start background
 * timers that would leak between specs.
 */

const LOG_PREFIX = '[jobs]';
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

let started = false;
const handles: NodeJS.Timeout[] = [];

export function startHrJobs(): void {
  if (started) {
    logger.warn(`${LOG_PREFIX} already started, skipping`);
    return;
  }
  if (process.env.ENABLE_CRONS !== 'true') {
    logger.info(
      `${LOG_PREFIX} disabled (set ENABLE_CRONS=true to enable in-process HR jobs)`,
    );
    return;
  }

  started = true;
  logger.info(`${LOG_PREFIX} starting HR cron jobs`);

  // Daily: scan training enrollments for upcoming expirations (30-day window)
  // and for expirations that happened in the last 24h. Run once on startup
  // (after a short delay so the app finishes booting) plus every 24h.
  const runOnce = () => {
    checkTrainingExpiry().catch((err) => {
      logger.error({ err }, `${LOG_PREFIX} check-training-expiry failed`);
    });
  };

  const firstRun = setTimeout(runOnce, 30_000);
  const recurring = setInterval(runOnce, TWENTY_FOUR_HOURS_MS);
  handles.push(firstRun, recurring);
}

/**
 * Stops every interval/timeout registered by {@link startHrJobs}. Used by
 * graceful-shutdown hooks; also handy in tests that accidentally triggered
 * the scheduler.
 */
export function stopHrJobs(): void {
  for (const handle of handles) {
    clearTimeout(handle);
    clearInterval(handle);
  }
  handles.length = 0;
  started = false;
}

export { checkTrainingExpiry };
