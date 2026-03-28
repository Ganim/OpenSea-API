import { enqueuePendingBatchChecks } from './queues/esocial-batch-polling.queue';

// Poll every 30 minutes for batch status updates
const INTERVAL_MS = 30 * 60 * 1000;

let intervalId: ReturnType<typeof setInterval> | null = null;
let consecutiveErrors = 0;
const MAX_CONSECUTIVE_ERRORS = 5;

async function runPollingCycle() {
  try {
    await enqueuePendingBatchChecks();
    consecutiveErrors = 0;
  } catch (err) {
    consecutiveErrors++;
    console.error(
      `[eSocial Scheduler] Error enqueuing batch checks (${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}):`,
      err,
    );

    if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
      console.error(
        '[eSocial Scheduler] Too many consecutive errors — stopping scheduler',
      );
      stopEsocialBatchScheduler();
    }
  }
}

export async function startEsocialBatchScheduler(): Promise<void> {
  if (intervalId) return;

  console.log(
    `[eSocial Scheduler] Starting batch status polling (every ${INTERVAL_MS / 60_000}min)`,
  );

  // Run immediately on startup
  await runPollingCycle();

  intervalId = setInterval(runPollingCycle, INTERVAL_MS);
}

export function stopEsocialBatchScheduler(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[eSocial Scheduler] Stopped');
  }
}
