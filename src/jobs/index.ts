import { logger } from '@/lib/logger';
import { checkTrainingExpiry } from './hr/check-training-expiry';
import { expireSignatureEnvelopes } from './signature/expire-envelopes';
import { remindPendingSigners } from './signature/remind-pending-signers';

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

// ---------------------------------------------------------------------------
// Signature module crons
// ---------------------------------------------------------------------------

const SIGNATURE_LOG_PREFIX = '[jobs:signature]';
const SAO_PAULO_OFFSET_HOURS = -3; // BRT is UTC-3 year-round (no DST since 2019)
const EXPIRE_ENVELOPES_BRT_HOUR = 2; // 02:00 BRT
const REMIND_SIGNERS_BRT_HOUR = 9; // 09:00 BRT

let signatureStarted = false;
const signatureHandles: NodeJS.Timeout[] = [];

/**
 * Returns milliseconds until the next occurrence of `hourBrt:00` in BRT.
 * Used to align the daily interval with the wall-clock schedule so the first
 * tick happens at the target hour; subsequent ticks run every 24h.
 */
function msUntilNextBrtHour(hourBrt: number, now: Date = new Date()): number {
  const target = new Date(now);
  // Express the desired hour in UTC by offsetting for BRT.
  const targetUtcHour = (hourBrt - SAO_PAULO_OFFSET_HOURS + 24) % 24;
  target.setUTCHours(targetUtcHour, 0, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setUTCDate(target.getUTCDate() + 1);
  }
  return target.getTime() - now.getTime();
}

/**
 * Registers both signature crons (auto-expire past-due envelopes at 02:00 BRT
 * and remind pending signers at 09:00 BRT). Gated by `ENABLE_CRONS=true`;
 * production deployments may prefer an external scheduler (Fly machines,
 * k8s CronJob) invoking the exported standalone scripts directly.
 */
export function startSignatureJobs(): void {
  if (signatureStarted) {
    logger.warn(`${SIGNATURE_LOG_PREFIX} already started, skipping`);
    return;
  }
  if (process.env.ENABLE_CRONS !== 'true') {
    logger.info(
      `${SIGNATURE_LOG_PREFIX} disabled (set ENABLE_CRONS=true to enable in-process signature jobs)`,
    );
    return;
  }

  signatureStarted = true;
  logger.info(`${SIGNATURE_LOG_PREFIX} starting signature cron jobs`);

  const scheduleDailyAtBrt = (
    hourBrt: number,
    runner: () => Promise<unknown>,
    label: string,
  ) => {
    const firstDelay = msUntilNextBrtHour(hourBrt);
    const tick = () => {
      runner().catch((err) => {
        logger.error({ err }, `${SIGNATURE_LOG_PREFIX} ${label} failed`);
      });
    };
    const firstRun = setTimeout(() => {
      tick();
      const recurring = setInterval(tick, TWENTY_FOUR_HOURS_MS);
      signatureHandles.push(recurring);
    }, firstDelay);
    signatureHandles.push(firstRun);
  };

  scheduleDailyAtBrt(
    EXPIRE_ENVELOPES_BRT_HOUR,
    () => expireSignatureEnvelopes(),
    'expire-envelopes',
  );
  scheduleDailyAtBrt(
    REMIND_SIGNERS_BRT_HOUR,
    () => remindPendingSigners(),
    'remind-pending-signers',
  );
}

/**
 * Stops the signature cron timers registered by {@link startSignatureJobs}.
 * Mirrors {@link stopHrJobs} for symmetric graceful-shutdown handling.
 */
export function stopSignatureJobs(): void {
  for (const handle of signatureHandles) {
    clearTimeout(handle);
    clearInterval(handle);
  }
  signatureHandles.length = 0;
  signatureStarted = false;
}

export { checkTrainingExpiry, expireSignatureEnvelopes, remindPendingSigners };
